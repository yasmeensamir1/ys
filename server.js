const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== CONFIG (direct, as you asked) =====
const TELEGRAM_BOT_TOKEN = "PUT_YOUR_BOT_TOKEN";
const TELEGRAM_CHAT_ID = "PUT_YOUR_CHAT_ID";
const PORT = process.env.PORT || 3000;

// ===== SEND TO TELEGRAM =====
async function sendToTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text,
    }),
  });
}

// ===== CONSENT + DATA COLLECTION =====
app.post("/collect", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    const geo = await geoRes.json();

    const {
      fullName,
      email,
      address,
      consent
    } = req.body;

    if (!consent) {
      return res.status(400).send("Consent is required");
    }

    const message = `
🛡️ User Consent Data Collected
==============================
Name: ${fullName}
Email: ${email}
Address (User Provided):
${address}

--- Network Info ---
IP: ${ip}
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
ASN: ${geo.as}
VPN/Proxy: ${geo.proxy}
Location: ${geo.lat}, ${geo.lon}

User-Agent:
${req.headers["user-agent"]}

Time:
${new Date().toLocaleString()}
==============================
`;

    await sendToTelegram(message);

    res.send("Data submitted successfully");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error");
  }
});

// ===== PAGE =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Running on port ${PORT}`);
});
