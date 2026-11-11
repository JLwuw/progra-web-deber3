const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const repository = path.resolve(__dirname, "../..");

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "cartelera-format-"));
  t.after(() => {
    assert.equal(path.dirname(directory), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("cartelera-format-"));
    fs.rmSync(directory, { recursive: true, force: true });
  });
  const hooks = path.join(directory, ".codex/hooks");
  const app = path.join(directory, "mi-cartelera-personal");
  fs.mkdirSync(hooks, { recursive: true });
  fs.mkdirSync(app, { recursive: true });
  for (const name of ["format.cjs", "format.ps1"]) {
    fs.copyFileSync(path.join(__dirname, name), path.join(hooks, name));
  }
  fs.symlinkSync(
    path.join(repository, "mi-cartelera-personal/node_modules"),
    path.join(app, "node_modules"),
    "junction",
  );
  function write(name, contents = "const x={a:1,b:2}\n") {
    const target = path.join(directory, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
    return target;
  }
  function run(toolInput, windows = false, env = process.env) {
    const command = windows ? "powershell.exe" : process.execPath;
    const args = windows
      ? [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          path.join(hooks, "format.ps1"),
        ]
      : [path.join(hooks, "format.cjs")];
    const result = spawnSync(command, args, {
      cwd: directory,
      input: JSON.stringify({
        cwd: directory,
        tool_name: "apply_patch",
        tool_input: toolInput,
      }),
      encoding: "utf8",
      env,
      timeout: 15000,
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    return result;
  }
  return { directory, write, run };
}

test("Edit/Write file path formats content and is idempotent", (t) => {
  const f = fixture(t);
  const target = f.write("mi-cartelera-personal/src/example.ts");
  f.run({ file_path: target });
  const formatted = fs.readFileSync(target, "utf8");
  assert.equal(formatted, "const x = { a: 1, b: 2 };\n");
  f.run({ file_path: target });
  assert.equal(fs.readFileSync(target, "utf8"), formatted);
});

test("Codex patch formats multiple added, updated and renamed targets", (t) => {
  const f = fixture(t);
  const names = ["added.ts", "updated.ts", "renamed.ts"];
  const targets = names.map((name) =>
    f.write("mi-cartelera-personal/src/" + name),
  );
  f.run({
    command:
      "*** Begin Patch\n*** Add File: mi-cartelera-personal/src/added.ts\n*** Update File: mi-cartelera-personal/src/updated.ts\n*** Update File: missing.ts\n*** Move to: mi-cartelera-personal/src/renamed.ts\n*** End Patch",
  });
  for (const target of targets) {
    assert.equal(
      fs.readFileSync(target, "utf8"),
      "const x = { a: 1, b: 2 };\n",
    );
  }
});

test("excluded and outside paths stay untouched; removed files are harmless", (t) => {
  const f = fixture(t);
  const targets = [
    ".git/example.ts",
    "dist/example.ts",
    "mi-cartelera-personal/src/example.txt",
  ];
  for (const name of targets) {
    const target = f.write(name);
    f.run({ file_path: target });
    assert.equal(fs.readFileSync(target, "utf8"), "const x={a:1,b:2}\n");
  }
  // These paths are rejected before opening; no environment file is created.
  f.run({ file_path: path.join(f.directory, ".env.local") });
  f.run({ file_path: path.join(f.directory, "..", "outside.ts") });
  f.run({ file_path: path.join(f.directory, "removed.ts") });
});

test(
  "Windows launcher preserves Unicode input and works with the inherited Node shim",
  {
    skip: process.platform !== "win32",
  },
  (t) => {
    const f = fixture(t);
    const target = f.write(
      "mi-cartelera-personal/src/película.ts",
      'const title="Película"\n',
    );
    // No PATH override: exercise the same inactive NVM shim as the hook environment.
    f.run({ file_path: target }, true);
    assert.equal(
      fs.readFileSync(target, "utf8"),
      'const title = "Película";\n',
    );
  },
);
