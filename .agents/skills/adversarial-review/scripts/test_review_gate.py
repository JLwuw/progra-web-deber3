#!/usr/bin/env python3
"""Integration checks use disposable Git repositories; no real project commits."""
import copy
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('review_gate.py').resolve()
REPOSITORY = SCRIPT.parents[4]
HOOK = REPOSITORY / '.githooks' / 'pre-commit'


class ReviewGateTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='adversarial-gate-')
        self.addCleanup(self.temporary.cleanup)
        self.repo = Path(self.temporary.name) / 'repo'
        self.repo.mkdir()
        self.env = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
        self.env.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL=os.devnull)
        self.git('init', '--quiet')
        self.git('config', 'user.name', 'Gate Test')
        self.git('config', 'user.email', 'gate-test@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        self.git('config', 'core.filemode', 'true')
        self.stage('README.md', 'Initial fixture\n')
        self.git('commit', '-qm', 'chore: initialize fixture')
        target = self.repo / '.agents/skills/adversarial-review/scripts'
        target.mkdir(parents=True)
        shutil.copyfile(SCRIPT, target / SCRIPT.name)
        hook = self.repo / '.githooks/pre-commit'
        hook.parent.mkdir()
        shutil.copyfile(HOOK, hook)
        hook.chmod(0o755)
        self.gate('install')
        self.stage('change.txt', 'Proposed change\n')

    def run_command(self, command, expected=0, text=None):
        result = subprocess.run(command, cwd=self.repo, env=self.env, input=text, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        self.assertEqual(result.returncode, expected, (command, result.stdout, result.stderr))
        return result.stdout

    def git(self, *args, expected=0, text=None):
        return self.run_command(['git', *args], expected=expected, text=text)

    def gate(self, *args, expected=0):
        return self.run_command([sys.executable, str(SCRIPT), *args], expected=expected)

    def stage(self, name, content):
        (self.repo / name).write_text(content)
        self.git('add', '--', name)

    def report(self, request=None):
        request = request or json.loads(self.gate('prepare'))
        return {**{key: request[key] for key in ('requestId', 'head', 'tree')},
                'reviewer': {'id': 'independent-fixture-reviewer', 'independent': True},
                'verdict': 'PASS', 'summary': 'Synthetic report for gate mechanics, not a real project approval.',
                'findings': [], 'checks': [{'name': 'Fixture check', 'status': 'passed', 'required': True, 'evidence': 'Synthetic check in a disposable integration test.'}]}

    def record(self, report, expected=0):
        path = Path(self.temporary.name) / 'report.json'
        path.write_text(json.dumps(report))
        return self.gate('record', '--report', str(path), expected=expected)

    def test_hook_blocks_commit_without_review_and_preserves_staging(self):
        staged = self.git('ls-files', '--stage')
        self.git('commit', '-qm', 'test: blocked fixture', expected=1)
        self.assertEqual(self.git('ls-files', '--stage'), staged)

    def test_matching_pass_allows_real_commit(self):
        self.record(self.report())
        self.gate('check')
        self.git('commit', '-qm', 'test: reviewed fixture')
        self.assertEqual(self.git('show', 'HEAD:change.txt'), 'Proposed change\n')
        self.gate('check', expected=1)  # Consumed by changed HEAD/empty index.

    def test_changed_content_rename_and_executable_bit_invalidate(self):
        for mutation in ('content', 'rename', 'mode'):
            with self.subTest(mutation=mutation):
                self.record(self.report())
                if mutation == 'content':
                    self.stage('change.txt', 'Changed again\n')
                elif mutation == 'rename':
                    self.git('mv', 'change.txt', 'renamed.txt')
                else:
                    self.git('update-index', '--chmod=+x', 'renamed.txt')
                self.gate('check', expected=1)
                self.git('commit', '-qm', 'test: stale fixture', expected=1)

    def test_changed_head_invalidates_same_tree(self):
        self.record(self.report())
        tree = self.git('write-tree').strip()
        # Construct a different parent only inside this fixture; do not bypass real hooks.
        old_head = self.git('rev-parse', 'HEAD').strip()
        head_tree = self.git('rev-parse', 'HEAD^{tree}').strip()
        new_head = self.git('commit-tree', head_tree, '-p', old_head, text='Fixture parent advance\n').strip()
        self.git('update-ref', 'HEAD', new_head)
        self.assertEqual(self.git('write-tree').strip(), tree)
        self.gate('check', expected=1)

    def test_renewed_request_invalidates_identical_snapshot(self):
        report = self.report()
        self.record(report)
        self.gate('prepare')
        self.gate('check', expected=1)
        self.record(report, expected=1)

    def test_unstaged_edits_do_not_change_approved_commit(self):
        self.record(self.report())
        (self.repo / 'change.txt').write_text('Not staged\n')
        self.gate('check')
        self.git('commit', '-qm', 'test: reviewed staged content')
        self.assertEqual(self.git('show', 'HEAD:change.txt'), 'Proposed change\n')

    def test_empty_index_and_unborn_branch(self):
        self.git('reset', '--quiet', 'HEAD', '--', 'change.txt')
        self.gate('prepare', expected=1)
        self.git('checkout', '--orphan', 'unborn')
        self.git('rm', '--cached', '-q', 'README.md')
        self.stage('new.txt', 'Initial branch content\n')
        report = self.report()
        self.assertEqual(report['head'], 'UNBORN')
        self.record(report)
        self.git('commit', '-qm', 'test: reviewed root commit')

    def test_nonpass_verdicts_are_recorded_but_block_commits(self):
        for verdict in ('FAIL', 'UNVERIFIED'):
            report = self.report()
            report['verdict'] = verdict
            self.record(report, expected=1)
            saved = json.loads((self.repo / '.git/adversarial-review/review.json').read_text())
            self.assertEqual(saved['verdict'], verdict)
            self.gate('check', expected=1)
            self.git('commit', '-qm', 'test: nonpass fixture', expected=1)

    def test_invalid_pass_reports_cannot_replace_valid_report(self):
        valid = self.report()
        self.record(valid)
        cases = []
        for change in ('findings', 'failed', 'unverified', 'no-required', 'not-independent', 'empty-checks', 'unknown-status', 'missing-evidence', 'wrong-tree'):
            report = copy.deepcopy(valid)
            if change == 'findings':
                report['findings'] = [{'priority': 'P3', 'file': 'change.txt', 'line': 1, 'requirement': 'Fixture', 'evidence': 'Unresolved fixture finding'}]
            elif change in ('failed', 'unverified', 'unknown-status'):
                report['checks'][0]['status'] = 'unknown' if change == 'unknown-status' else change
            elif change == 'no-required': report['checks'][0]['required'] = False
            elif change == 'not-independent': report['reviewer']['independent'] = False
            elif change == 'empty-checks': report['checks'] = []
            elif change == 'missing-evidence': del report['checks'][0]['evidence']
            else: report['tree'] = '0' * 40
            cases.append(report)
        for report in cases:
            self.record(report, expected=1)
            self.gate('check')

    def test_missing_malformed_and_oversized_report(self):
        self.gate('prepare')
        path = Path(self.temporary.name) / 'invalid.json'
        self.gate('record', '--report', str(path), expected=1)
        for content in ('[]', '{broken', ' ' * 1_000_001):
            path.write_text(content)
            self.gate('record', '--report', str(path), expected=1)
        self.gate('check', expected=1)

    def test_environment_path_rejected_without_opening_file(self):
        # Stage a synthetic blob path without creating/reading an environment file.
        oid = self.git('hash-object', '-w', '--stdin', text='synthetic fixture').strip()
        self.git('update-index', '--add', '--cacheinfo', '100644,' + oid + ',.env.local')
        self.gate('prepare', expected=1)
        self.assertFalse((self.repo / '.env.local').exists())

    def test_environment_report_path_is_rejected_before_reading(self):
        self.gate('prepare')
        path = Path(self.temporary.name) / '.env.local'
        result = subprocess.run([sys.executable, str(SCRIPT), 'record', '--report', str(path)], cwd=self.repo, env=self.env, text=True, capture_output=True)
        self.assertEqual(result.returncode, 1)
        self.assertIn('environment-file report path is prohibited', result.stderr)
        self.assertFalse(path.exists())

    def test_unmerged_index_is_rejected(self):
        oid = self.git('hash-object', '-w', '--stdin', text='fixture conflict').strip()
        entries = ''.join(
            f'100644 {oid} {stage}\tconflict.txt\n' for stage in (1, 2, 3)
        )
        # Binary input avoids Windows text-mode CRLF translation in Git's protocol.
        result = subprocess.run(['git', 'update-index', '--index-info'],
            cwd=self.repo, env=self.env, input=entries.encode('ascii'), capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(len(self.git('ls-files', '--unmerged').splitlines()), 3)
        self.gate('prepare', expected=1)

    def test_install_preserves_other_hook_config_and_active_default_hook(self):
        self.git('config', 'core.hooksPath', 'existing-hooks')
        self.gate('install', expected=1)
        self.assertEqual(self.git('config', '--get', 'core.hooksPath').strip(), 'existing-hooks')
        self.git('config', '--unset', 'core.hooksPath')
        active = self.repo / '.git/hooks/pre-commit'
        active.write_text('#!/bin/sh\nexit 0\n')
        active.chmod(0o755)
        self.gate('install', expected=1)
        self.assertEqual(active.read_text(), '#!/bin/sh\nexit 0\n')


if __name__ == '__main__':
    unittest.main(verbosity=2)
