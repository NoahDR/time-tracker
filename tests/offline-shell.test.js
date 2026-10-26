import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const APP = new URL('../app/', import.meta.url).pathname;

const filesUnder = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(dir, e.name)) : [relative(APP, join(dir, e.name))]);

test('the service worker caches every app file for offline use', () => {
  const source = readFileSync(join(APP, 'sw.js'), 'utf8');
  const shell = new Set([...source.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]));
  const expected = filesUnder(APP).filter((f) => f !== 'sw.js');
  assert.deepEqual(expected.filter((f) => !shell.has(f)), [], 'files missing from SHELL in sw.js');
});
