import express from "express";
import fs from "fs/promises";
import bodyParser from "body-parser";
import path from "path";

const app = express();
const DB_PATH = path.join(process.cwd(), "db.json");
const ACCESS_KEY = "54321";

app.use(bodyParser.json({ limit: "10mb" }));
app.use(express.static(".")); // serve HTML directly

// ✅ Ensure db.json exists
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, "[]", "utf8");
  }
}
await initDB();

// 🔹 Append logs into same db.json
app.post("/logs", async (req, res) => {
  try {
    const log = req.body;
    if (!log.collectedAt) log.collectedAt = new Date().toISOString();

    const data = JSON.parse(await fs.readFile(DB_PATH, "utf8") || "[]");
    data.push(log);
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));

    console.log("✅ Log saved:", log.platform || "Unknown Device");
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error("❌ Error saving log:", err);
    res.status(500).json({ error: err.message });
  }
});

// 🔹 View logs (requires correct key)
app.get("/logs", async (req, res) => {
  const { key } = req.query;
  if (key !== ACCESS_KEY) return res.status(403).send("Access denied");
  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, "utf8") || "[]");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on port " + port));
