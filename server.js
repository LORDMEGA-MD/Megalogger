import express from "express";
import bodyParser from "body-parser";
import fs from "fs-extra";
import path from "path";

const app = express();
const PORT = 3000;
const LOG_DIR = "./logs";
const DB_FILE = "./db.json";

fs.ensureDirSync(LOG_DIR);
if (!fs.existsSync(DB_FILE)) fs.writeJsonSync(DB_FILE, []); // initialize

app.use(bodyParser.json({ limit: "5mb" }));
app.use(express.static("public"));

app.post("/logs", async (req, res) => {
  const payload = req.body;
  const now = new Date().toISOString();
  const fileName = `device-log-${now.replace(/[:.]/g, "-")}.json`;

  // enrich with name (phone type) and timestamp
  const record = {
    id: Date.now(),
    time: now,
    device: payload.platform || "unknown",
    userAgent: payload.userAgent || "",
    data: payload
  };

  await fs.writeJson(path.join(LOG_DIR, fileName), record, { spaces: 2 });
  const db = await fs.readJson(DB_FILE);
  db.push(record);
  await fs.writeJson(DB_FILE, db, { spaces: 2 });

  res.status(201).json({ ok: true, saved: fileName });
});

app.get("/view", async (req, res) => {
  const { key } = req.query;
  if (key !== "54321") return res.status(403).send("Forbidden");
  const db = await fs.readJson(DB_FILE);
  db.sort((a, b) => new Date(b.time) - new Date(a.time)); // latest first
  res.json(db);
});

app.listen(PORT, () => console.log(`✅ Listening at http://localhost:${PORT}`));
