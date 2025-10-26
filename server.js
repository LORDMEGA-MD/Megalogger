import express from "express";
import bodyParser from "body-parser";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ACCESS_KEY = process.env.ACCESS_KEY || "54321";

const LOG_DIR = path.join(__dirname, "logs");
const DB_FILE = path.join(__dirname, "db.json");

fs.ensureDirSync(LOG_DIR);

// Ensure db.json exists and valid
if (!fs.existsSync(DB_FILE)) fs.writeJsonSync(DB_FILE, []);
else {
  try { fs.readJsonSync(DB_FILE); }
  catch(e) { fs.writeJsonSync(DB_FILE, []); }
}

app.use(bodyParser.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Serve main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "device-logger.html"));
});

// Save logs
app.post("/logs", async (req, res) => {
  try {
    const payload = req.body;
    const now = new Date().toISOString();
    const fileName = `device-log-${now.replace(/[:.]/g,"-")}.json`;

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

    res.status(201).json({ ok: true });
  } catch(e) {
    console.error("Error saving log:", e);
    res.status(500).json({ ok: false });
  }
});

// View logs (protected)
app.get("/view", async (req,res)=>{
  const key = (req.query.key||"").trim();
  if(key !== ACCESS_KEY) return res.status(403).send("Forbidden");

  const db = await fs.readJson(DB_FILE);
  db.sort((a,b)=>new Date(b.time)-new Date(a.time));
  res.json(db);
});

app.get("*",(req,res)=> res.redirect("/"));

app.listen(PORT, ()=>console.log(`✅ Server running on port ${PORT}`));
