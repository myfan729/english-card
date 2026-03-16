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
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      headless: "new",
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 640, height: 800, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: "networkidle0" });

    // 실제 콘텐츠 높이에 맞게 자동 조절
    const height = await page.evaluate(() => document.body.scrollHeight);
    await page.setViewport({ width: 640, height: height, deviceScaleFactor: 2 });

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
