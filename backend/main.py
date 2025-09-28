from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
import asyncio
import os
import uuid
from typing import Optional

# Placeholder imports - adapt logic from extraer_materias_disponibles.py later

app = FastAPI()

class Credentials(BaseModel):
    usuario: str
    password: str
    captcha: str
    session_id: Optional[str] = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/iniciar-sesion")
async def iniciar_sesion(creds: Credentials):
    # TODO: Integrar lógica real de login y devolver session_id
    if not creds.usuario or not creds.password or not creds.captcha:
        raise HTTPException(status_code=400, detail="Faltan credenciales")
    session_id = str(uuid.uuid4())
    return {"session_id": session_id, "mensaje": "Login simulado. Integrar lógica real."}

@app.get("/captcha")
async def obtener_captcha():
    # TODO: devolver imagen captcha real (por ahora imagen vacía)
    dummy_path = os.path.join(os.path.dirname(__file__), "captcha_dummy.png")
    if not os.path.exists(dummy_path):
        with open(dummy_path, "wb") as f:
            f.write(b"")
    return FileResponse(dummy_path, media_type="image/png")

@app.post("/extraer")
async def extraer(session_id: str):
    # TODO: Llamar a la función principal de scraping reutilizando la sesión
    # Retornar ruta de archivo o datos en memoria
    return {"status": "procesando", "session_id": session_id}
