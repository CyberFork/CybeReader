import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const books = JSON.parse(readFileSync(new URL('../src/library.json', import.meta.url), 'utf8'));
test('curated library snapshots match source digest and retain license', () => {
  assert.equal(books.length, 3);
  for (const book of books) {
    assert.match(book.file, /^library\/pg\d+\.txt$/);
    assert.match(book.source, /^https:\/\/www\.gutenberg\.org\/ebooks\/\d+$/);
    const bytes = readFileSync(new URL(`../public/${book.file}`, import.meta.url));
    assert.equal(bytes.length, book.bytes);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), book.sha256);
    const text = bytes.toString('utf8');
    assert(text.length < 1_000_000);
    assert.match(text, /\*\*\* START OF/);
    assert(text.indexOf(book.bodyStart, text.indexOf('*** START OF') + 60) > 0);
    assert.match(text, /FULL PROJECT GUTENBERG™? LICENSE/);
  }
});
