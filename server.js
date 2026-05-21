import express from "express";
import fetch from "node-fetch";

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = process.env.TARGET_DOMAIN;

// گرفتن بادی خام
app.use(express.raw({ type: "*/*" }));

// روت تست
app.get("/ok", (req, res) => {
  res.status(200).send("RELAY OK");
});

// رله کردن همه درخواست‌ها
app.all("*", async (req, res) => {
  if (!TARGET) {
    return res.status(500).send("TARGET_DOMAIN is not set");
  }

  try {
    const url = new URL(req.originalUrl, TARGET);

    // حذف هدرهای مشکل‌ساز که باعث SSL Error می‌شن
    const cleanHeaders = { ...req.headers };
    delete cleanHeaders.host;
    delete cleanHeaders["x-forwarded-host"];
    delete cleanHeaders["x-forwarded-proto"];
    delete cleanHeaders["x-forwarded-for"];

    const upstream = await fetch(url, {
      method: req.method,
      headers: cleanHeaders,
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
