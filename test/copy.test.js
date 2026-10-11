import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// Copy rule from review: no em dashes anywhere on the site.
test('pages contain no em dash', () => {
  const root = new URL('../public/', import.meta.url);
  for (const file of readdirSync(root).filter((f) => f.endsWith('.html'))) {
    assert.ok(!readFileSync(new URL(file, root), 'utf8').includes('—'), `${file} has an em dash`);
  }
});
