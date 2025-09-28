import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// In-memory store for captcha workflow (simple demo)
let pendingProcess = null;
let lastStdout = [];
let captchaBase64 = null; // almacenará la imagen captcha codificada
let pendingCreds = { user: null, pass: null };

// Sencillo token CSRF-like para credenciales (no persistente, demo)
const oneTimeTokens = new Set();

app.get('/api/extraccion/token', (req, res) => {
  const t = crypto.randomBytes(16).toString('hex');
  oneTimeTokens.add(t);
  setTimeout(() => oneTimeTokens.delete(t), 5 * 60 * 1000); // expira en 5 min
  res.json({ token: t });
});

app.post('/api/extraccion/credenciales', (req, res) => {
  const { usuario, password, token } = req.body || {};
  if (!token || !oneTimeTokens.has(token)) {
    return res.status(400).json({ message: 'Token invalido o expirado' });
  }
  oneTimeTokens.delete(token);
  if (!usuario || !password) {
    return res.status(400).json({ message: 'Usuario y password requeridos' });
  }
  pendingCreds.user = usuario;
  pendingCreds.pass = password;
  res.json({ message: 'Credenciales almacenadas temporalmente' });
});

const pyCmd = process.env.PYTHON_CMD || 'python';

app.post('/api/extraccion/iniciar', (req, res) => {
  if (pendingProcess) {
    return res.status(409).json({ message: 'Ya hay un proceso en ejecución' });
  }
  const pyPath = path.join(__dirname, '..', 'extraer_materias_disponibles.py');
  if (!fs.existsSync(pyPath)) {
    return res.status(404).json({ message: 'Script Python no encontrado', path: pyPath });
  }
  const envCreds = {};
  if (pendingCreds.user && pendingCreds.pass) {
    envCreds.EXTRACCION_USUARIO = pendingCreds.user;
    envCreds.EXTRACCION_PASSWORD = pendingCreds.pass;
  }
  const proc = spawn(pyCmd, [pyPath], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUTF8: '1'
      , ...envCreds
    }
  });
  pendingProcess = proc;
  lastStdout = [];
  captchaBase64 = null;
  pendingCreds = { user: null, pass: null }; // limpiar

  const tryLoadCaptcha = () => {
    try {
      const captchaPath = path.join(__dirname, 'captcha.jpg');
      if (fs.existsSync(captchaPath)) {
        const buf = fs.readFileSync(captchaPath);
        captchaBase64 = 'data:image/jpeg;base64,' + buf.toString('base64');
      }
    } catch (e) {
      // ignore
    }
  };

  proc.stdout.on('data', (data) => {
    const text = data.toString();
    lastStdout.push(text);
    if (text.includes('Introduce el texto del captcha')) {
      // Intentar cargar la imagen
      tryLoadCaptcha();
    }
  });
  proc.stderr.on('data', (data) => {
    lastStdout.push('[ERR] ' + data.toString());
  });
  proc.on('close', (code) => {
    pendingProcess = null;
    lastStdout.push(`-- proceso finalizado código ${code} --`);
  });

  res.json({ message: 'Proceso iniciado', pid: proc.pid });
});

app.get('/api/extraccion/logs', (req, res) => {
  res.json({ logs: lastStdout.slice(-200) });
});

app.get('/api/extraccion/captcha', (req, res) => {
  if (!captchaBase64) return res.status(404).json({ message: 'Captcha no disponible aun' });
  res.json({ image: captchaBase64 });
});

app.post('/api/extraccion/input', (req, res) => {
  const { texto } = req.body;
  if (!pendingProcess) return res.status(400).json({ message: 'No hay proceso activo' });
  pendingProcess.stdin.write(texto + '\n');
  res.json({ message: 'Enviado' });
});

app.listen(4000, () => {
  console.log('Servidor backend escuchando en puerto 4000');
});
