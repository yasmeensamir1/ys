const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ⚠️ حط القيم بإيدك هنا
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = 3000;

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

    const geoRes = await fetch(
      `http://ip-api.com/json/${rawIP}?fields=66846719`
    );
    const geo = await geoRes.json();

    const ua = req.headers["user-agent"] || "unknown";
    const isMobile = /mobile|android|iphone/i.test(ua);

    const log = `
🛡️ Visit Log
----------------------
IP: ${maskedIP}
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
ASN: ${geo.as}
VPN/Proxy: ${geo.proxy}
Hosting: ${geo.hosting}
Location: ${geo.lat}, ${geo.lon}

Device: ${isMobile ? "Mobile" : "Desktop"}
User-Agent:
${ua}

Language: ${req.headers["accept-language"]}
Referer: ${req.headers["referer"] || "Direct"}

Time: ${new Date().toLocaleString()}
----------------------
`;

    await sendToTelegram(log);
    res.json({ logged: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
});

// ===== SERVE YOUR HTML =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
