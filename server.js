const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ===== CONFIG (مباشر زي ما طلبت) =====
const TELEGRAM_BOT_TOKEN = "PUT_YOUR_BOT_TOKEN_HERE";
const TELEGRAM_CHAT_ID = "PUT_YOUR_CHAT_ID_HERE";
const PORT = process.env.PORT || 3000;

// ===== TELEGRAM =====
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

// ===== HELPERS =====
function getIP(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function maskIP(ip) {
  if (ip.includes(".")) {
    const p = ip.split(".");
    p[3] = "0";
    return p.join(".");
  }
  return ip;
}

// ===== RDAP (WHOIS البديل) =====
async function getRDAP(ip) {
  try {
    const res = await fetch(`https://rdap.org/ip/${ip}`);
    return await res.json();
  } catch {
    return null;
  }
}

// ===== VISIT ENDPOINT =====
app.post("/visit", async (req, res) => {
  try {
    const ip = getIP(req);
    const maskedIP = maskIP(ip);

    const consent = req.body?.consent === true;

    // Geo
    const geoRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=66846719`
    );
    const geo = await geoRes.json();

    // RDAP
    const rdap = consent ? await getRDAP(ip) : null;

    const log = `
🛡️ Visit Log
========================
IP: ${maskedIP}
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
ASN: ${geo.as}
VPN/Proxy: ${geo.proxy}
Hosting: ${geo.hosting}
Location: ${geo.lat}, ${geo.lon}

Device: ${
      /mobile|android|iphone/i.test(req.headers["user-agent"])
        ? "Mobile"
        : "Desktop"
    }
User-Agent:
${req.headers["user-agent"]}

Language: ${req.headers["accept-language"]}
Referer: ${req.headers["referer"] || "Direct"}

Consent Given: ${consent ? "YES" : "NO"}

${
  consent && rdap
    ? `--- RDAP INFO ---
Network Name: ${rdap.name || "N/A"}
Start IP: ${rdap.startAddress || "N/A"}
End IP: ${rdap.endAddress || "N/A"}
Country (RDAP): ${rdap.country || "N/A"}
Registry: ${rdap.handle || "N/A"}`
    : "RDAP: Not collected (No consent)"
}

Time: ${new Date().toLocaleString()}
========================
`;

    await sendToTelegram(log);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "failed" });
  }
});

// ===== PAGE =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
