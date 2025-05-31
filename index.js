const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/submit", async (req, res) => {
  const { name, phone, tour_details } = req.body;

  try {
const browser = await puppeteer.launch({
  args: chromium.args,
  defaultViewport: chromium.defaultViewport,
  executablePath: await chromium.executablePath(),
  headless: chromium.headless,
});

    const page = await browser.newPage();
    await page.goto("https://rocketour.co/affiliate-form/", { waitUntil: "networkidle2" });
    
    await page.type('input[name="affiliateId"]', "242");
    await page.type('input[name="city"]', "רומא");
    await page.type('input[name="leadName"]', name);
    await page.type('input[name="leadPhone"]', phone);
    await page.type('input[name="notes"]', tour_details);

    await page.click('input[type="submit"]');
    await page.waitForTimeout(3000);

    await browser.close();

    res.send("✅ Tour submitted successfully!");
  } catch (err) {
    console.error(err);
    res.status(500).send("❌ Error submitting the form.");
  }
});

app.get("/", (req, res) => {
  res.send("Form bot is running.");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running.");
});
