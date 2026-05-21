import express from "express";
import fetch from "node-fetch";

const app = express();

// پورت Railway
const PORT = process.env.PORT || 3000;

// دامنه مقصد از متغیر محیطی
const TARGET = process.env.TARGET_DOMAIN;

// برای گرفتن بادی خام
app.use(express.raw({ type: "*/*" }));

// روت تست
app.get("/ok", (req, res) => {
  res.status(200).send("RELAY OK");
});

// ریلی همه درخواست‌ها
app.all("*", async (req, res) => {
  if (!TARGET) {
    return res.status(500).send("TARGET_DOMAIN is not set");
  }

  try {
    const url = new URL(req.originalUrl, TARGET);

    const upstream = await fetch(url, {
      method: req.method,
      headers: req.headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : req.body
    });

    res.status(upstream.status);

    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);

  } catch (err) {
    console.error("Relay error:", err.message);
    res.status(502).send("Relay error");
  }
});

app.listen(PORT, () => {
  console.log(`Relay running on port ${PORT}`);
});