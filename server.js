const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/screenshot", async (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: "html is required" });

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/google-chrome-stable",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-software-rasterizer",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-default-apps",
        "--disable-sync",
        "--disable-translate",
        "--hide-scrollbars",
        "--metrics-recording-only",
        "--mute-audio",
        "--no-first-run",
        "--safebrowsing-disable-auto-update",
        "--single-process",
        "--memory-pressure-off",
      ],
      headless: "new",
      timeout: 30000,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 800, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 20000 });

    // 폰트 로딩 대기
    await page.evaluate(() => document.fonts.ready);

    const height = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 640, height: Math.min(height, 3000), deviceScaleFactor: 1 });

    const screenshot = await page.screenshot({ type: "png", fullPage: true });
    res.set("Content-Type", "image/png");
    res.send(screenshot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
