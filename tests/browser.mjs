import { chromium } from "playwright";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
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
    const page = await browser.newPage({
      viewport: { width, height: 1000 },
      acceptDownloads: true,
    });
    const errors = [],
      requests = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error("PAGE ERROR", e.message);
    });
    page.on("request", (r) => requests.push(r.url()));
    await page.goto(base, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "体验示例" }).click();
    await page.locator(".speed-reader-text").waitFor();
    const progress = () => page.locator(".progress-text").textContent();
    assert.match(await progress(), /^1 \//);
    await page.getByRole("button", { name: "播放", exact: true }).click();
    await page.waitForFunction(
      () =>
        Number(
          document.querySelector(".progress-text")?.textContent?.split("/")[0],
        ) > 1,
    );
    await page.getByRole("button", { name: "暂停", exact: true }).click();
    const paused = await progress();
    await page.waitForTimeout(700);
    assert.equal(await progress(), paused);
    await page.getByRole("button", { name: "下一个", exact: true }).click();
    assert.notEqual(await progress(), paused);
    await page.getByRole("button", { name: "上一个", exact: true }).click();
    assert.equal(await progress(), paused);
    await page.getByRole("button", { name: "添加书签", exact: true }).click();
    await page.getByRole("button", { name: "添加笔记" }).click();
    await page.getByLabel("书签笔记").fill("这是公开测试笔记");
    await page.getByRole("button", { name: "保存", exact: true }).click();
    await page.getByRole("button", { name: "停止", exact: true }).click();
    assert.match(await progress(), /^1 \//);
    await page.getByRole("button", { name: "跳转", exact: true }).click();
    assert.equal(await progress(), paused);
    await page.getByRole("button", { name: "设置", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await dialog.waitFor();
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "detached" });
    assert.equal(
      await page
        .getByRole("button", { name: "设置", exact: true })
        .evaluate((e) => document.activeElement === e),
      true,
    );
    await page.locator(".speed-reader").focus();
    await page.keyboard.press("ArrowRight");
    const resumed = await progress();
    await page.waitForTimeout(650);
    await page.reload({ waitUntil: "networkidle" });
    await page
      .locator(".document-item")
      .filter({ hasText: "CybeReader 示例.txt" })
      .click();
    assert.equal(await progress(), resumed);
    for (const [file, text] of [
      ["sample.pdf", "CybeReader PDF fixture"],
      ["sample.docx", "CybeReader DOCX fixture"],
    ]) {
      await page
        .getByLabel("选择文档文件")
        .setInputFiles(
          fileURLToPath(new URL(`./fixtures/${file}`, import.meta.url)),
        );
      await page.waitForFunction(
        (expected) =>
          document
            .querySelector(".normal-reader-text")
            ?.textContent?.includes(expected),
        text,
      );
    }
    await page
      .getByLabel("选择文档文件")
      .setInputFiles({
        name: "old.doc",
        mimeType: "application/msword",
        buffer: Buffer.from("unsupported"),
      });
    await page.getByRole("alert").filter({ hasText: "另存" }).waitFor();
    await page
      .getByLabel("选择文档文件")
      .setInputFiles({
        name: "long.txt",
        mimeType: "text/plain",
        buffer: Buffer.from(
          "长文阅读，按需显示原文，不重复重绘整本书。".repeat(5000),
        ),
      });
    await page.waitForFunction(() =>
      document
        .querySelector(".reader-section-nav")
        ?.textContent?.includes("long.txt"),
    );
    assert.ok(
      (await page.locator(".normal-reader-text").textContent()).length <= 8200,
    );
    await page.getByRole("button", { name: "下一段", exact: true }).click();
    assert.ok(Number((await progress()).split("/")[0]) > 1);
    await page
      .getByLabel("选择文档文件")
      .setInputFiles({
        name: "end.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("测试"),
      });
    await page.waitForFunction(() =>
      document
        .querySelector(".reader-section-nav")
        ?.textContent?.includes("end.txt"),
    );
    await page.getByRole("button", { name: "播放", exact: true }).click();
    await page.getByRole("button", { name: "播放", exact: true }).waitFor();
    assert.equal(
      await page
        .getByRole("button", { name: "播放", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await page
      .getByRole("button", { name: "导出备份", exact: true })
      .scrollIntoViewIfNeeded();
    assert.equal(
      await page
        .getByRole("button", { name: "导出备份", exact: true })
        .evaluate((el) => {
          const r = el.getBoundingClientRect();
          return el.contains(
            document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2),
          );
        }),
      true,
      "backup button is covered",
    );
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "导出备份", exact: true }).click();
    assert.equal(
      (await download).suggestedFilename(),
      "cybereader-backup.json",
    );
    page.once("dialog", (d) => d.accept());
    await page
      .locator(".document-item")
      .filter({ hasText: "end.txt" })
      .getByRole("button", { name: "删除", exact: true })
      .click();
    await page.locator(".speed-reader.empty").waitFor();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(
      requests.some((u) => {
        try {
          const request = new URL(u);
          const app = new URL(base);
          return (
            request.origin === app.origin &&
            !request.pathname.startsWith("/cybereader/")
          );
        } catch {
          return false;
        }
      }),
      false,
      "same-origin request escaped the /cybereader/ subpath",
    );
    assert.deepEqual(errors, []);
    results.push({
      width,
      playPause: true,
      bookmarkNote: true,
      resume: true,
      pdf: true,
      docx: true,
      legacyDocRejected: true,
      finishPauses: true,
      longTextDomBounded: true,
      keyboard: true,
      backup: true,
      overflow: false,
      errors: 0,
    });
    await page.close();
  }
  console.log(JSON.stringify({ status: "passed", results }, null, 2));
} finally {
  await browser.close();
}
