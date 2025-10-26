import express from "express";
import fs from "fs/promises";
import path from "path";
import bodyParser from "body-parser";

const app = express();
const ACCESS_KEY = "54321";
const __dirname = process.cwd();
const DB_PATH = path.join(__dirname, "db.json");
const PUBLIC_PATH = path.join(__dirname, "public");

// ✅ Serve your frontend files
app.use(express.static(PUBLIC_PATH));
app.use(bodyParser.json({ limit: "10mb" }));

// Ensure db.json exists
async function initDB() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, "[]", "utf8");
  }
}
await initDB();

// ✅ Save log
app.post("/logs", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile(DB_PATH, "utf8") || "[]");
    data.push(req.body);
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ View logs with key
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

// ✅ Default route to serve your HTML
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_PATH, "device-logger.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
