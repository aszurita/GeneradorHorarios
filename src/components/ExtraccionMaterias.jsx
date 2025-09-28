import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export default function ExtraccionMaterias({ onSuccess }) {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaUrl, setCaptchaUrl] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [estado, setEstado] = useState('idle');
  const [error, setError] = useState(null);

  const cargarCaptcha = () => {
    const url = `${API_BASE}/captcha?ts=${Date.now()}`;
    setCaptchaUrl(url);
  };

  useEffect(() => {
    cargarCaptcha();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setEstado('login');
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/iniciar-sesion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, password, captcha })
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const data = await resp.json();
      setSessionId(data.session_id);
      setEstado('loggeado');
      if (onSuccess) onSuccess(data.session_id);
    } catch (err) {
      setError(err.message);
      setEstado('error');
      cargarCaptcha();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white border rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-4">Extracción de Materias Disponibles</h3>
      {sessionId ? (
        <div className="text-green-700 text-sm">Sesión iniciada. Session ID: {sessionId}</div>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium">Usuario</label>
            <input className="mt-1 w-full border rounded px-2 py-1" value={usuario} onChange={e=>setUsuario(e.target.value)} required/>
          </div>
          <div>
            <label className="text-sm font-medium">Contraseña</label>
            <input type="password" className="mt-1 w-full border rounded px-2 py-1" value={password} onChange={e=>setPassword(e.target.value)} required/>
          </div>
          <div>
            <label className="text-sm font-medium">Captcha</label>
            <div className="flex items-center gap-2 mt-1">
              {captchaUrl && <img src={captchaUrl} alt="captcha" className="h-12 border rounded" />}
              <button type="button" onClick={cargarCaptcha} className="text-xs px-2 py-1 bg-gray-200 rounded">Recargar</button>
            </div>
            <input className="mt-2 w-full border rounded px-2 py-1" value={captcha} onChange={e=>setCaptcha(e.target.value)} required/>
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <button disabled={estado==='login'} className="mt-2 bg-[#003566] text-white rounded py-2 hover:opacity-90 disabled:opacity-50">
            {estado==='login' ? 'Iniciando sesión...' : 'Iniciar sesión y extraer'}
          </button>
        </form>
      )}
    </div>
  );
}
