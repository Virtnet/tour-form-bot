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



// Parse application/x-www-form-urlencoded and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.post("/submit", async (req, res) => {
  const { name, email, phone, datetour, npart, tour_details } = req.body;
  console.log("✅ Received form submission:", req.body);

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
    await page.type('textarea[name="notes"]', `\nמספר משתתפים: ${npart}\n${tour_details}`);

    await page.click('input[type="submit"]');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle0' }) // or 'domcontentloaded'
    ]);
    
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
