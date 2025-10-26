// server.js
import express from "express";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, "db.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Ensure db.json exists and is valid
if (!fs.existsSync(DB_FILE)) {
  fs.writeJsonSync(DB_FILE, []);
} else {
  try {
    fs.readJsonSync(DB_FILE);
  } catch {
    console.warn("⚠️ db.json corrupted, resetting...");
    fs.writeJsonSync(DB_FILE, []);
  }
}

// POST /log → save device info
app.post("/log", async (req, res) => {
  try {
    const logs = await fs.readJson(DB_FILE);
    logs.push(req.body);
    await fs.writeJson(DB_FILE, logs, { spaces: 2 });
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving log:", err);
    res.status(500).json({ error: "Failed to save log" });
  }
});

// GET /view?key=54321 → fetch logs
app.get("/view", async (req, res) => {
  const { key } = req.query;
  if (key !== "54321") {
    return res.status(403).json({ error: "Access denied" });
  }
  try {
    const logs = await fs.readJson(DB_FILE);
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json(logs);
  } catch (err) {
    console.error("Error reading logs:", err);
    res.status(500).json({ error: "Failed to read logs" });
  }
});

// Catch-all route for HTML (prevents “Cannot GET /” errors)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () =>
  console.log(`✅ Server running on port ${PORT}`)
);
