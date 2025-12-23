/**
 * Secure Visitor Logging Server
 * For Cybersecurity / Monitoring purposes
 */

const express = require("express");
const path = require("path");

// Node 18+ فيه fetch built-in
const app = express();
app.use(express.json());

// ===== ENV CONFIG =====
const TELEGRAM_BOT_TOKEN = process.env.TG_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TG_CHAT_ID;
const PORT = process.env.PORT || 3000;

// ===== HELPERS =====
function maskIP(ip) {
  if (!ip) return "unknown";
  if (ip.includes(".")) {
    const p = ip.split(".");
    p[3] = "0";
    return p.join(".");
  }
  return ip;
}

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

// ===== VISIT LOGGER =====
app.post("/visit", async (req, res) => {
  try {
    const rawIP =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    const maskedIP = maskIP(rawIP);

    // ===== GEO LOOKUP =====
    const geoRes = await fetch(
      `http://ip-api.com/json/${rawIP}?fields=66846719`
    );
    const geo = await geoRes.json();

    const userAgent = req.headers["user-agent"] || "unknown";
    const isMobile = /mobile|android|iphone/i.test(userAgent);

    // ===== DATA FROM FRONTEND (OPTIONAL) =====
    const {
      screen,
      timezone,
      platform,
      language,
    } = req.body || {};

    const logMessage = `
🛡️ Security Visit Log
======================
IP: ${maskedIP}
Country: ${geo.country || "N/A"}
City: ${geo.city || "N/A"}
ISP: ${geo.isp || "N/A"}
ASN: ${geo.as || "N/A"}
VPN/Proxy: ${geo.proxy}
Hosting: ${geo.hosting}
Location: ${geo.lat}, ${geo.lon}

Device: ${isMobile ? "Mobile" : "Desktop"}
Platform: ${platform || "N/A"}
Screen: ${screen || "N/A"}

Browser / OS:
${userAgent}

Language: ${language || req.headers["accept-language"]}

Timezone: ${timezone || "N/A"}
Referer: ${req.headers["referer"] || "Direct"}

Time (Local): ${new Date().toLocaleString()}
Time (UTC): ${new Date().toUTCString()}

--- RAW HEADERS ---
${JSON.stringify(req.headers, null, 2)}
======================
`;

    await sendToTelegram(logMessage);

    res.json({ logged: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "logging_failed" });
  }
});

// ===== SERVE PAGE =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ===== START =====
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
