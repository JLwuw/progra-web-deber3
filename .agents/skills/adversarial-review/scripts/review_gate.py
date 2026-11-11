#!/usr/bin/env python3
"""Bind independent review evidence to a staged Git tree; never stage or commit."""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys
import uuid


class GateError(Exception):
    pass


def git(*args, allowed=(0,)):
    result = subprocess.run(['git', *args], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode not in allowed:
        # Avoid echoing source contents, credentials or Git-controlled diagnostics.
        raise GateError('Git operation failed: ' + args[0])
    return result.stdout


def root():
    return Path(os.fsdecode(git('rev-parse', '--show-toplevel').strip()))


def state_dir():
    return Path(os.fsdecode(git('rev-parse', '--path-format=absolute', '--git-path', 'adversarial-review').strip()))


def prohibited(path):
    name = Path(path).name.lower()
    return name.startswith('.env') and name != '.env.example'


def snapshot():
    if git('ls-files', '-u', '-z'):
        raise GateError('Resolve the unmerged index before requesting review.')
    files = [os.fsdecode(p) for p in git('diff', '--cached', '--name-only', '-z').split(b'\0') if p]
    if not files:
        raise GateError('Nothing is staged; review never stages files or permits an empty commit.')
    # Check paths before reading any content, including unchanged tracked paths.
    tracked = [os.fsdecode(p) for p in git('ls-files', '-z').split(b'\0') if p]
    if any(prohibited(p) for p in files + tracked):
        raise GateError('An environment-file path is staged/tracked; contents were not opened.')
    parent = git('rev-parse', '--verify', 'HEAD', allowed=(0, 128)).strip()
    tree = git('write-tree').decode('ascii').strip()
    return {'head': parent.decode('ascii') if parent else 'UNBORN', 'tree': tree, 'files': files}


def read_json(path):
    if prohibited(path) or prohibited(path.resolve()):
        raise GateError('An environment-file report path is prohibited; contents were not opened.')
    try:
        if path.stat().st_size > 1_000_000:
            raise GateError('Review record is too large.')
        result = json.loads(path.read_text(encoding='utf-8'))
    except (OSError, ValueError, UnicodeError):
        raise GateError('Review record is missing or malformed.') from None
    if not isinstance(result, dict):
        raise GateError('Review record must be a JSON object.')
    return result


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name + '.' + uuid.uuid4().hex + '.tmp')
    try:
        with temporary.open('x', encoding='utf-8') as handle:
            json.dump(value, handle, ensure_ascii=True, indent=2)
            handle.write('\n')
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def validate_report(report, request):
    if report.get('schemaVersion', 1) != 1:
        raise GateError('Unsupported review schema.')
    for key in ('requestId', 'head', 'tree'):
        if report.get(key) != request.get(key) or not nonempty(report.get(key)):
            raise GateError('Review does not match the current request: ' + key)
    reviewer = report.get('reviewer')
    if not isinstance(reviewer, dict) or reviewer.get('independent') is not True or not nonempty(reviewer.get('id')):
        raise GateError('An independent reviewer identity is required.')
    if report.get('verdict') not in ('PASS', 'FAIL', 'UNVERIFIED') or not nonempty(report.get('summary')):
        raise GateError('A supported verdict and nonempty summary are required.')
    findings, checks = report.get('findings'), report.get('checks')
    if not isinstance(findings, list) or not isinstance(checks, list) or not checks:
        raise GateError('Explicit findings and a nonempty checks list are required.')
    for finding in findings:
        if not isinstance(finding, dict) or finding.get('priority') not in ('P0', 'P1', 'P2', 'P3'):
            raise GateError('Invalid finding priority.')
        if type(finding.get('line')) is not int or finding['line'] < 1 or not all(nonempty(finding.get(key)) for key in ('file', 'requirement', 'evidence')):
            raise GateError('Findings require location, requirement and evidence.')
    for check in checks:
        if not isinstance(check, dict) or check.get('status') not in ('passed', 'failed', 'unverified') or type(check.get('required')) is not bool:
            raise GateError('Invalid check status or requirement flag.')
        if not all(nonempty(check.get(key)) for key in ('name', 'evidence')):
            raise GateError('Checks require names and actual evidence.')
    if report['verdict'] == 'PASS':
        required = [check for check in checks if check['required']]
        if findings or not required or any(check['status'] != 'passed' for check in required):
            raise GateError('PASS requires no findings and all required checks passed.')


def matching_request(current):
    request = read_json(state_dir() / 'request.json')
    if request.get('schemaVersion') != 1 or any(request.get(key) != current[key] for key in ('head', 'tree', 'files')):
        raise GateError('The staged snapshot or HEAD changed; prepare a fresh independent review.')
    if not nonempty(request.get('requestId')):
        raise GateError('Invalid review request.')
    return request


def prepare():
    request = {'schemaVersion': 1, 'requestId': uuid.uuid4().hex, **snapshot()}
    write_json(state_dir() / 'request.json', request)
    # A fresh nonce also invalidates an older response for an identical tree.
    print(json.dumps(request, ensure_ascii=True, indent=2))


def record(path):
    request = matching_request(snapshot())
    report = read_json(path)
    validate_report(report, request)
    write_json(state_dir() / 'history' / (uuid.uuid4().hex + '.json'), report)
    write_json(state_dir() / 'review.json', report)
    print('Recorded independent verdict: ' + report['verdict'])
    if report['verdict'] != 'PASS':
        raise GateError('Review is recorded but does not permit a commit.')


def check():
    request = matching_request(snapshot())
    report = read_json(state_dir() / 'review.json')
    validate_report(report, request)
    if report['verdict'] != 'PASS':
        raise GateError('Independent review has not passed.')
    print('Independent review matches the staged snapshot and HEAD.')


def install():
    repository = root()
    hook = repository / '.githooks' / 'pre-commit'
    script = repository / '.agents' / 'skills' / 'adversarial-review' / 'scripts' / 'review_gate.py'
    if not hook.is_file() or not os.access(hook, os.X_OK) or not script.is_file():
        raise GateError('Executable .githooks/pre-commit and review_gate.py must exist before installation.')
    configured = git('config', '--get', 'core.hooksPath', allowed=(0, 1)).decode().strip()
    if configured and configured != '.githooks':
        raise GateError('Another hooks path is configured; integrate it explicitly instead of overwriting it.')
    default_hooks = Path(os.fsdecode(git('rev-parse', '--path-format=absolute', '--git-path', 'hooks').strip()))
    if not configured and default_hooks.is_dir() and any(p.is_file() and os.access(p, os.X_OK) and not p.name.endswith('.sample') for p in default_hooks.iterdir()):
        raise GateError('Active default Git hooks exist; integrate them explicitly instead of hiding them.')
    git('config', '--local', 'core.hooksPath', '.githooks')
    print('Installed repository-local pre-commit review gate. No files staged or committed.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('prepare')
    recorder = commands.add_parser('record')
    recorder.add_argument('--report', type=Path, required=True)
    commands.add_parser('check')
    commands.add_parser('install')
    args = parser.parse_args()
    try:
        os.chdir(root())
        if args.command == 'prepare':
            prepare()
        elif args.command == 'record':
            record(args.report)
        elif args.command == 'check':
            check()
        else:
            install()
    except (GateError, OSError) as error:
        print('Review gate: ' + str(error), file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
