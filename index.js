const express = require("express");
const bodyParser = require("body-parser");
const chromium = require("@sparticuz/chromium");
const fetch = require("node-fetch");
const puppeteer = require("puppeteer-core");
const cors = require("cors");

const app = express();

// ✅ Allow requests from your live frontend
app.use(cors({
  origin: "https://saveforyourtrip.com",
}));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // ✅ Add this to support JSON body parsing

app.post("/submit", async (req, res) => {
  const { name, email, phone, datetour, npart, tour_details } = req.body;

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    await fetch("https://script.google.com/macros/s/AKfycbxk4sV2xLZcKbnMQRtaMer-FxeFsUk1JjvivIK4g6f5fFFlXvQfzD92GsbEurjN7Fvw/exec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, datetour, npart, tour_details })
    });

    res.status(200).send("✅ Form submitted to Rocketour and Google Sheet.");
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).send("Error submitting form.");
  }
});

app.get("/", (req, res) => {
  res.send("Form bot is running.");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running.");
});
