import { chromium } from "playwright";
import { mkdir, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
const assets = fileURLToPath(new URL("../docs/assets/", import.meta.url));
await mkdir(assets, { recursive: true });
const frames = await mkdtemp(join(tmpdir(), "cybereader-demo-"));
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.CHROMIUM_EXECUTABLE }
    : {}),
});
let frame = 0;
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });
  await page.goto(process.env.APP_URL || "http://127.0.0.1:4175/cybereader/", {
    waitUntil: "networkidle",
  });
  await page.getByRole("button", { name: "体验示例" }).click();
  await page.locator(".speed-reader-text").waitFor();
  await page.screenshot({ path: join(assets, "cybereader-desktop.png") });
  const capture = async (count) => {
    for (let i = 0; i < count; i++) {
      await page.screenshot({
        path: join(frames, `frame-${String(frame++).padStart(3, "0")}.png`),
      });
      await page.waitForTimeout(180);
    }
  };
  await capture(5);
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await capture(15);
  await page.getByRole("button", { name: "增加宽度", exact: true }).click();
  await page.getByRole("button", { name: "增加速度", exact: true }).click();
  await capture(12);
  await page.getByRole("button", { name: "暂停", exact: true }).click();
  await page.getByRole("button", { name: "添加书签", exact: true }).click();
  await page.getByRole("button", { name: "添加笔记" }).click();
  await page
    .getByLabel("书签笔记")
    .fill("阅读不是速度竞赛：重要观点可以停下来思考。");
  await page.getByRole("button", { name: "保存", exact: true }).click();
  await capture(8);
  await page.getByRole("button", { name: "设置", exact: true }).click();
  await capture(6);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "停止", exact: true }).click();
  await page.getByRole("button", { name: "跳转", exact: true }).click();
  await capture(6);
  await page.getByRole("button", { name: "播放", exact: true }).click();
  await capture(10);
  await page.screenshot({ path: join(assets, "cybereader-demo-poster.png") });
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
  });
  await mobile.goto(process.env.APP_URL || "http://127.0.0.1:4175/cybereader/", {
    waitUntil: "networkidle",
  });
  await mobile.getByRole("button", { name: "体验示例" }).click();
  await mobile.locator(".speed-reader-controls").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(300);
  await mobile.evaluate(()=>window.scrollTo(0,0));
  await mobile.screenshot({
    path: join(assets, "cybereader-mobile.png"),
    fullPage: true,
  });
} finally {
  await browser.close();
}
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-framerate",
    "5",
    "-i",
    join(frames, "frame-%03d.png"),
    "-filter_complex",
    "[0:v]scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff:max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3",
    "-loop",
    "0",
    join(assets, "cybereader-demo.gif"),
  ],
  { stdio: "ignore" },
);
console.log(
  JSON.stringify({
    frames: frame,
    gif: join(assets, "cybereader-demo.gif"),
    temporaryFrames: frames,
  }),
);
