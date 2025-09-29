// server/server.js  (ESM)
import express from "express";
import cors from "cors";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==================== Estado en memoria ====================
let pendingProcess = null;                 // proceso Python activo
let lastStdout = [];                       // buffer de logs
let pendingCreds = { user: null, pass: null }; // credenciales temporales
const oneTimeTokens = new Set();           // tokens de un solo uso

// ==================== Helpers ====================
const LOG_CAP = 1200; // evita crecer indefinidamente

const pushLog = (txt) => {
  if (!txt) return;
  // divide por líneas para granularidad
  const lines = String(txt).split(/\r?\n/);
  for (const l of lines) {
    if (l.length === 0) continue;
    lastStdout.push(l);
  }
  if (lastStdout.length > LOG_CAP) {
    lastStdout = lastStdout.slice(-Math.floor(LOG_CAP * 0.8));
  }
};

const candidateCaptchaPaths = () => ([
  path.resolve(process.cwd(), "captcha.jpg"),
  path.resolve(process.cwd(), "server", "captcha.jpg"),
  path.resolve(__dirname, "captcha.jpg"),
  path.resolve(__dirname, "..", "captcha.jpg"),
  path.resolve(process.cwd(), "public", "captcha.jpg"),
]);

const readCaptchaAsBase64 = () => {
  for (const p of candidateCaptchaPaths()) {
    if (fs.existsSync(p)) {
      try {
        const buf = fs.readFileSync(p);
        return "data:image/jpeg;base64," + buf.toString("base64");
      } catch {}
    }
  }
  return null;
};

const deleteOldCaptchas = () => {
  for (const p of candidateCaptchaPaths()) {
    try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  }
};

const candidateResultPaths = () => ([
  path.resolve(process.cwd(), "materias_formato_requerido.json"),
  path.resolve(process.cwd(), "server", "materias_formato_requerido.json"),
  path.resolve(__dirname, "materias_formato_requerido.json"),
  path.resolve(__dirname, "..", "materias_formato_requerido.json"),
]);

const readResultJSON = () => {
  for (const p of candidateResultPaths()) {
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, "utf-8");
      return JSON.parse(raw);
    }
  }
  return null;
};

// ==================== Endpoints ====================

// 1) Token anti-CSRF temporal (5 min)
app.get("/api/extraccion/token", (_req, res) => {
  const t = crypto.randomBytes(16).toString("hex");
  oneTimeTokens.add(t);
  setTimeout(() => oneTimeTokens.delete(t), 5 * 60 * 1000);
  res.json({ token: t });
});

// 2) Recibir credenciales (guardadas solo en memoria)
app.post("/api/extraccion/credenciales", (req, res) => {
  const { usuario, password, token } = req.body || {};
  if (!token || !oneTimeTokens.has(token)) {
    return res.status(400).json({ message: "Token invalido o expirado" });
  }
  oneTimeTokens.delete(token);
  if (!usuario || !password) {
    return res.status(400).json({ message: "Usuario y password requeridos" });
  }
  pendingCreds.user = usuario;
  pendingCreds.pass = password;
  res.json({ message: "Credenciales almacenadas temporalmente" });
});

// 3) Iniciar extracción (lanzar Python)
app.post("/api/extraccion/iniciar", (_req, res) => {
  if (pendingProcess) {
    return res.status(409).json({ message: "Ya hay un proceso en ejecución" });
  }

  // Limpia captcha previo para forzar uno nuevo
  deleteOldCaptchas();

  // Ruta del script Python (puedes cambiarla por ENV si lo mueves)
  const scriptPath =
    process.env.EXTRACCION_SCRIPT ||
    path.resolve(__dirname, "..", "extraer_materias_disponibles.py");

  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ message: "Script Python no encontrado", path: scriptPath });
  }

  // Comando Python configurable
  const pyCmd = process.env.PYTHON_CMD || "python";

  // Inyecta credenciales por variables de entorno (el script ya las soporta)
  const envCreds = {};
  if (pendingCreds.user && pendingCreds.pass) {
    envCreds.EXTRACCION_USUARIO = pendingCreds.user;
    envCreds.EXTRACCION_PASSWORD = pendingCreds.pass;
  }

  // Lanza proceso
  const proc = spawn(pyCmd, [scriptPath], {
    stdio: ["pipe", "pipe", "pipe"],
    env: {
      ...process.env,
      PYTHONIOENCODING: "utf-8",
      PYTHONUTF8: "1",
      ...envCreds,
    },
    cwd: path.resolve(__dirname, ".."), // raíz del repo (ajústalo si hace falta)
  });

  pendingProcess = proc;
  lastStdout = [];
  pendingCreds = { user: null, pass: null }; // ya no las necesitamos

  proc.stdout.on("data", (data) => pushLog(data.toString()));
  proc.stderr.on("data", (data) => pushLog("[ERR] " + data.toString()));

  proc.on("close", (code) => {
    pushLog(`-- proceso finalizado código ${code} --`);
    pendingProcess = null;
  });

  res.json({ message: "Proceso iniciado", pid: proc.pid });
});

// 4) Logs (para el panel de estado)
app.get("/api/extraccion/logs", (_req, res) => {
  res.json({ logs: lastStdout.slice(-400) });
});

// 5) Captcha (base64, sin caché del navegador)
app.get("/api/extraccion/captcha", (_req, res) => {
  try {
    const b64 = readCaptchaAsBase64();
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    if (!b64) return res.status(404).json({ message: "no-captcha" });
    res.json({ image: b64, ts: Date.now() });
  } catch (e) {
    res.status(500).json({ message: String(e) });
  }
});

// 6) Resultado (JSON final que pinta la malla)
app.get("/api/extraccion/result", (_req, res) => {
  try {
    const json = readResultJSON();
    if (!json) return res.status(404).json({ message: "Resultado no disponible" });
    res.json(json);
  } catch (e) {
    res.status(500).json({ message: "Error leyendo resultado", error: String(e) });
  }
});

// 7) Enviar entrada al proceso (usuario/contraseña/captcha durante la ejecución)
app.post("/api/extraccion/input", (req, res) => {
  const { texto } = req.body || {};
  if (!pendingProcess || !pendingProcess.stdin) {
    return res.status(400).json({ message: "No hay proceso activo" });
  }
  try {
    pendingProcess.stdin.write((texto ?? "") + "\n"); // MUY IMPORTANTE el "\n"
    res.json({ message: "Enviado" });
  } catch (e) {
    res.status(500).json({ message: String(e.message || e) });
  }
});

// ==================== Arranque ====================
app.listen(PORT, () => {
  console.log(`Servidor backend escuchando en puerto ${PORT}`);
});
