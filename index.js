const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("@sparticuz/chromium");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer-core");
const cors = require("cors");
const { IpFilter } = require("express-ipfilter");

const app = express();

const cloudflareIps = [
  "173.245.48.0/20",
  "103.21.244.0/22",
  "103.22.200.0/22",
  "103.31.4.0/22",
  "141.101.64.0/18",
  "108.162.192.0/18",
  "190.93.240.0/20",
  "188.114.96.0/20",
  "197.234.240.0/22",
  "198.41.128.0/17",
  "162.158.0.0/15",
  "104.16.0.0/13",
  "104.24.0.0/14",
  "172.64.0.0/13",
  "131.0.72.0/22"
];

// ✅ Restrict CORS to your frontend domain
app.use(cors({
  origin: "https://saveforyourtrip.com"
}));

// ✅ Middleware for parsing form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// ✅ Block direct access to the home page
app.get("/", (req, res) => {
  res.status(403).send("Forbidden");
});

// ✅ Block GET requests to /submit
app.get("/submit", (req, res) => {
  res.status(403).send("Forbidden");
});

// ✅ Restrict POST /submit by IP
app.use("/submit", IpFilter(cloudflareIps, {
  mode: "allow",
  detectIp: (req) => req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.ip
}));

// ✅ Handle form submission
app.post("/submit", async (req, res) => {
  const { name, email, phone, datetour, npart, tour_details } = req.body;
  console.log("✅ Received:", req.body);

  try {
    // ✅ First: send to Google Sheets
    await fetch("https://script.google.com/macros/s/AKfycbxk4sV2xLZcKbnMQRtaMer-FxeFsUk1JjvivIK4g6f5fFFlXvQfzD92GsbEurjN7Fvw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, datetour, npart, tour_details })
    });

    // ✅ Then: launch Puppeteer to fill Rocketour form
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.goto("https://www.rocketour.co.il/affiliate-form", { waitUntil: "networkidle2" });

    await page.type('input[name="affiliateId"]', "242");
    await page.type('input[name="city"]', "רומא");
    await page.type('input[name="leadName"]', name);
    await page.type('input[name="leadPhone"]', phone);
    await page.type('textarea[name="notes"]', `\nמספר משתתפים: ${npart}\n${tour_details}`);


    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: "networkidle2" }),
    ]);

    await browser.close();

    res.status(200).send("✅ First saved to Google Sheet, then submitted to Rocketour.");
  } catch (error) {
    console.error("❌ Error submitting form:", error);
    res.status(500).send("Error submitting form.");
  }
});


// ✅ Start the server
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server is running.");
});
