import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.APP_URL || "http://127.0.0.1:4175/cybereader/";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
    : {}),
});
const results = [];

try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByLabel("选择文档文件").setInputFiles({
      name: "flow.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。".repeat(600)),
    });
    const focus = page.locator("#focus-reader");
    await focus.waitFor();
    assert.equal(
      await focus.evaluate((node) => node.parentElement?.parentElement?.id),
      "original-text",
      "focus frame must live inside the original-text flow",
    );
    assert.equal(await page.locator(".main-content > .speed-reader").count(), 0);
    assert.equal(
      await page.locator("#original-text > [data-source-start]").count(),
      2,
      "context must exist on both sides of the focus frame",
    );

    await page.getByRole("button", { name: "下一段", exact: true }).click();
    const centered = await page.evaluate(() => {
      const viewport = document.querySelector(".normal-reader").getBoundingClientRect();
      const frame = document.querySelector(".inline-focus-anchor").getBoundingClientRect();
      return {
        delta: Math.abs(
          frame.top + frame.height / 2 - (viewport.top + viewport.height / 2),
        ),
        before: document.querySelector(
          "#original-text > [data-source-start]",
        ).textContent.length,
        after: document.querySelector(
          "#original-text > [data-source-start]:last-child",
        ).textContent.length,
        frameWidth: frame.width,
        flowWidth: document.querySelector("#original-text").getBoundingClientRect()
          .width,
      };
    });
    assert(centered.delta <= 2, `focus frame is ${centered.delta}px off center`);
    assert(centered.before > 3000 && centered.after > 1000);
    assert(Math.abs(centered.frameWidth - centered.flowWidth) <= 1);

    const start = Number(await page.locator(".speed-reader-text").getAttribute("data-source-start"));
    await page.getByRole("button", { name: "播放", exact: true }).click();
    await page.waitForFunction(
      (previous) =>
        Number(
          document.querySelector(".speed-reader-text")?.getAttribute(
            "data-source-start",
          ),
        ) > previous,
      start,
    );
    await page.getByRole("button", { name: "暂停", exact: true }).click();
    const advanced = Number(
      await page.locator(".speed-reader-text").getAttribute("data-source-start"),
    );
    assert(advanced > start, "step playback must advance the source stream");
    assert.equal(await page.locator(".focus-mode").innerText(), "已暂停");

    const finalDelta = await page.evaluate(() => {
      const viewport = document.querySelector(".normal-reader").getBoundingClientRect();
      const frame = document.querySelector(".inline-focus-anchor").getBoundingClientRect();
      return Math.abs(
        frame.top + frame.height / 2 - (viewport.top + viewport.height / 2),
      );
    });
    assert(finalDelta <= 2, `advanced frame is ${finalDelta}px off center`);
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
    );
    assert.deepEqual(errors, []);
    results.push({
      width,
      inline: true,
      contextBeforeAndAfter: true,
      centered: true,
      stepPlayback: true,
      widthAligned: true,
      overflow: false,
    });
    await page.close();
  }
  console.log(JSON.stringify({ status: "passed", results }, null, 2));
} finally {
  await browser.close();
}
