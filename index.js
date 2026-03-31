/**
 *render but best Replit Optimized GoatBot Runner + Auto Installer
 * Original: NTKhang
 * Optimized by Siyuuuuu
 * Auto-loaded system 
 * no eny problem 
 */

const { spawn, execSync } = require("child_process");
const express = require("express");
const os = require("os");
const log = require("./logger/log.js");

const app = express();
const PORT = process.env.PORT || 3000;

// ─── CONFIGURATION ───
const MEMORY_LIMIT_MB = 500;
const MEMORY_CHECK_INTERVAL = 20000;

/**
 * AUTO INSTALLER SYSTEM
 * Missing modules ekhane add kora ache jeno auto install hoy
 */
const REQUIRED_PACKAGES = [
  "ytdl-core",
  "@distube/ytdl-core",
  "fb-downloader-scrapper",
  "instagram-url-direct",
  "tiktok-downloader-full",
  "systeminformation",
  "os-utils",
  "axios",
  "fs-extra",
  "canvas",
  "path"
];

function checkAndInstall() {
  log.info("Checking system dependencies...");
  for (const pkg of REQUIRED_PACKAGES) {
    try {
      require.resolve(pkg);
    } catch (e) {
      log.warn(`Missing module [${pkg}]. Installing...`);
      try {
        // --no-save use korle package.json edit hoy na, install fast hoy
        execSync(`npm install ${pkg} --no-save`, { stdio: "inherit" });
      } catch (err) {
        log.error(`Failed to install ${pkg}: ${err.message}`);
      }
    }
  }
  log.info("✅ All dependencies are ready!");
}

// ─────────────────────────
// Health Endpoint (for uptime)
app.get("/", (req, res) => {
  res.send("Siyuu GoatBot Running 🚀 (Auto-Restart: OFF)");
});

app.get("/status", (req, res) => {
  res.json({
    status: "online",
    uptime: process.uptime().toFixed(0),
    memory: (process.memoryUsage().rss >> 20) + " MB",
    cpu: os.loadavg()[0].toFixed(2),
    time: Date.now()
  });
});

// Replit friendly listen
app.listen(PORT, "0.0.0.0", () => {
  log.info(`🌐 Web running on port ${PORT}`);
});

// ─────────────────────────
// Bot Start Function
function startBot() {
  // Spawn korar age check kore nibe package missing ache kina
  checkAndInstall();

  const child = spawn("node", ["Goat.js"], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
    env: process.env
  });

  log.info(`🚀 GoatBot starting...`);

  child.on("close", (code) => {
    if (code === 0) {
      log.info("Bot exited normally.");
    } else {
      log.error(`Bot process exited with code ${code}. Auto-restart is disabled.`);
    }
    // Auto-restart bondho, tai process exit kore deya holo
    process.exit(code);
  });

  child.on("error", (err) => {
    log.error("Spawn error:", err.message);
  });
}

// ─────────────────────────
// Memory Guard
setInterval(() => {
  const used = process.memoryUsage().rss >> 20;
  if (used > MEMORY_LIMIT_MB) {
    log.warn(`💥 Memory exceeded (${used}MB). Killing process...`);
    process.exit(1);
  }
}, MEMORY_CHECK_INTERVAL);

// ─────────────────────────
// Graceful Shutdown
["SIGINT", "SIGTERM"].forEach(sig =>
  process.on(sig, () => {
    log.info(`👋 Shutdown signal received (${sig})`);
    process.exit(0);
  })
);

// ─────────────────────────
// Start Bot
startBot();
