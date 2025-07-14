const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("@sparticuz/chromium");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer-core");
const cors = require("cors");


const app = express();

// CORS - allow only your frontend origin
app.use(cors({
  origin: "https://saveforyourtrip.com"
}));

app.get("/submit", (req, res) => {
  res.status(403).send("Forbidden");
});


// Parse application/x-www-form-urlencoded and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post("/submit", async (req, res) => {
  const { name, email, phone, datetour, npart, tour_details } = req.body;
  console.log("✅ Received form submission:", req.body);

  try {

    await fetch("https://script.google.com/macros/s/AKfycbxk4sV2xLZcKbnMQRtaMer-FxeFsUk1JjvivIK4g6f5fFFlXvQfzD92GsbEurjN7Fvw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, datetour, npart, tour_details })
    });

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
    await page.type('textarea[name="notes"]', `\nמספר משתתפים: ${npart}\n${tour_details}`);

    console.log("👉 Clicking submit...");
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000); // wait for form to process
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
