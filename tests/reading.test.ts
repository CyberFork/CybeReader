import test from "node:test";
import assert from "node:assert/strict";
import { chunkText, indexAt, clamp } from "../src/utils/reading.ts";
import { parseDocument } from "../src/utils/documentParser.ts";
test("grapheme chunks preserve emoji/combining marks and UTF-16 offsets", () => {
  const text = "你好👩‍💻cafe\u0301世界";
  const chunks = chunkText(text, 2);
  assert.equal(chunks.map((c) => c.text).join(""), text);
  assert.equal(chunks[1].text, "👩‍💻c");
  for (const c of chunks) assert.equal(text.slice(c.start, c.end), c.text);
});
test("invalid widths cannot create an infinite loop and empty text clears chunks", () => {
  for (const width of [0, -1, Infinity, NaN])
    assert.ok(chunkText("abc", width).length > 0);
  assert.deepEqual(chunkText("", 5), []);
  assert.equal(clamp(NaN, 0.5, 20, 2), 2);
});
test("binary lookup preserves absolute reading positions across width changes", () => {
  const narrow = chunkText("你好👩‍💻世界", 1);
  const wide = chunkText("你好👩‍💻世界", 3);
  assert.equal(indexAt(narrow, 6), 2);
  assert.equal(indexAt(wide, 6), 0);
  assert.equal(indexAt(wide, 999), 1);
});
test("text import works, unsupported/empty/oversized documents fail explicitly", async () => {
  assert.equal(
    (await parseDocument(new File(["hello"], "sample.txt"))).content,
    "hello",
  );
  await assert.rejects(parseDocument(new File([" "], "empty.txt")), /未提取/);
  await assert.rejects(parseDocument(new File(["old"], "old.doc")), /另存/);
  await assert.rejects(parseDocument(new File(["x"], "bad.exe")), /支持 TXT/);
  await assert.rejects(
    parseDocument(new File(["a".repeat(1_000_001)], "long.txt")),
    /100 万/,
  );
});
