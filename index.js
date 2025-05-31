const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/submit", async (req, res) => {
  const { name, phone, tour_date } = req.body;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto("https://rocketour.co/affiliate-form/", { waitUntil: "networkidle2" });

    await page.type('input[name="your-name"]', name);
    await page.type('input[name="tel-505"]', phone);
    await page.type('input[name="date-256"]', tour_date);

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
