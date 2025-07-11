const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("@sparticuz/chromium");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer-core");
const cors = require("cors");
const { IpFilter } = require("express-ipfilter");

const app = express();

// IMPORTANT: Trust reverse proxies so req.ip uses X-Forwarded-For header correctly
app.set('trust proxy', true);

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

// CORS - allow only your frontend origin
app.use(cors({
  origin: "https://saveforyourtrip.com"
}));

// Parse application/x-www-form-urlencoded and JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Block direct access to home page
app.get("/", (req, res) => {
  res.status(403).send("Forbidden");
});

// Block GET requests to /submit
app.get("/submit", (req, res) => {
  res.status(403).send("Forbidden");
});

// Log detected IP for /submit (optional, for debugging)
app.use("/submit", (req, res, next) => {
  console.log("Headers cf-connecting-ip:", req.headers["cf-connecting-ip"]);
  console.log("Headers x-forwarded-for:", req.headers["x-forwarded-for"]);
  console.log("req.ip:", req.ip);
  next();
});


// IP whitelist filter with improved detectIp function
app.use("/submit", IpFilter(cloudflareIps, {
  mode: "allow",
  detectIp: (req) => {
    if (req.headers["cf-connecting-ip"]) return req.headers["cf-connecting-ip"];
    if (req.headers["x-forwarded-for"]) return req.headers["x-forwarded-for"].split(",")[0].trim();
    return req.ip;
  },
  errorMessage: "Access denied from this IP"
}));

// Handle form submission
app.post("/submit", async (req, res) => {
  const { name, email, phone, datetour, npart, tour_details } = req.body;
  console.log("✅ Received form submission:", req.body);

  try {
    // Send data to Google Sheets (your script URL)
    await fetch("https://script.google.com/macros/s/AKfycbxk4sV2xLZcKbnMQRtaMer-FxeFsUk1JjvivIK4g6f5fFFlXvQfzD92GsbEurjN7Fvw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, datetour, npart, tour_details })
    });

    // Launch Puppeteer with chromium executable from sparticuz
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Go to Rocketour form page
    await page.goto("https://www.rocketour.co.il/affiliate-form", { waitUntil: "networkidle2" });

    // Fill out form fields
    await page.type('input[name="affiliateId"]', "242");
    await page.type('input[name="city"]', "רומא");
    await page.type('input[name="leadName"]', name);
    await page.type('input[name="leadPhone"]', phone);
    await page.type('textarea[name="notes"]', `\nמספר משתתפים: ${npart}\n${tour_details}`);

    // Submit the form and wait for navigation
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

// Start server on environment port or 3000
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}.`);
});
