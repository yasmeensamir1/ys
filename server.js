const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ===== CONFIG =====
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// منع تكرار نفس الـ IP
const recentIPs = new Map();

// ===== SEND TO TELEGRAM =====
async function sendToTelegram(text) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text
    })
  });
}

// ===== VISITOR ENDPOINT =====
app.post("/visit", async (req, res) => {
  try {
    const ip =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress;

    if (recentIPs.has(ip)) {
      return res.json({ status: "ignored" });
    }

    recentIPs.set(ip, true);
    setTimeout(() => recentIPs.delete(ip), 5 * 60 * 1000);

    const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
    const geo = await geoRes.json();

    const message = `
🔔 New Visitor
IP: ${ip}
Country: ${geo.country}
City: ${geo.city}
ISP: ${geo.isp}
Location: ${geo.lat}, ${geo.lon}
Time: ${new Date().toLocaleString()}
User-Agent: ${req.headers["user-agent"]}
`;

    await sendToTelegram(message);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed" });
  }
});

// ===== SERVE PAGE =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});
