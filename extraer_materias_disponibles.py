# -*- coding: utf-8 -*-
import requests
from bs4 import BeautifulSoup
import os
import time
import json
import getpass
from urllib.parse import urljoin
from concurrent.futures import ThreadPoolExecutor
import threading
import sys
import unicodedata
from pathlib import Path  # <-- NUEVO: para guardar el captcha en /public

# ===== Ajuste de encoding para ejecución desde backend Node en Windows =====
# Forzamos stdout/stderr a UTF-8 para evitar UnicodeEncodeError con emojis o
# caracteres fuera de cp1252.
try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


# ==========================
# Utilidades de normalización
# ==========================
def _normalizar(txt: str) -> str:
    """
    Normaliza texto a MAYÚSCULAS y elimina acentos/diacríticos para poder comparar
    valores que vienen con y sin tildes/acentos.
    """
    try:
        return ''.join(
            c for c in unicodedata.normalize('NFD', txt.upper())
            if unicodedata.category(c) != 'Mn'
        )
    except:
        return txt.upper()


# Set con las claves "normalizadas" que identifican materias complementarias.
COMPLEMENTARIAS_KEYS = {
    _normalizar('FORMACIÓN COMPLEMENTARIA DEL ÁREA ARTES, DEPORTES E IDIOMAS'),
    _normalizar('FORMACIÓN COMPLEMENTARIA DEL ÁREA HUMANIDADES')
}


# ============================================================
# Transformación de la data extraída al formato requerido por el frontend
# Agrupa complementarias bajo "Materias Complementarias" y el resto en "Materias".
# ============================================================
def transformar_a_formato_requerido(materias_con_detalles):
    """
    Transformación al formato requerido por la app:

    {
      "Materias Complementarias": { codigo: { materia, Teorico[], Practico[] } ... },
      "Materias": { codigo: { materia, Teorico[], Practico[] } ... }
    }
    """
    agrupadas_complementarias = {}
    agrupadas_normales = {}

    for materia in materias_con_detalles:
        codigo = materia["codigo"]
        tipo_norm = _normalizar(materia.get("tipo_credito", ""))
        es_complementaria = tipo_norm in COMPLEMENTARIAS_KEYS
        target = agrupadas_complementarias if es_complementaria else agrupadas_normales

        # Inicializa estructura por código si no existe
        if codigo not in target:
            target[codigo] = {
                "materia": materia["materia"],
                "tipo_credito": materia.get("tipo_credito", ""),
                "Teorico": [],
                "Practico": []
            }

        # Recorre cada paralelo con su detalle
        for paralelo_detalle in materia["paralelos_detallados"]:
            if "error" in paralelo_detalle:
                # Si esa página de paralelo falló, lo omitimos
                continue

            # Fechas / horas de exámenes (se extraen de cadenas tipo "20/11/2025 - 09:00 a 11:00")
            fecha_parcial = extraer_fecha(paralelo_detalle["examenes"]["parcial"]["fecha_hora"])
            fecha_final = extraer_fecha(paralelo_detalle["examenes"]["final"]["fecha_hora"])
            fecha_mejoramiento = extraer_fecha(paralelo_detalle["examenes"]["mejoramiento"]["fecha_hora"])
            hora_inicio_e, hora_fin_e = extraer_horas_examen(paralelo_detalle["examenes"]["parcial"]["fecha_hora"])

            # Horarios teóricos (tabla principal de la materia)
            horarios_teorico = []
            for horario in paralelo_detalle["horarios"]:
                horarios_teorico.append({
                    "Dia": horario["dia"].upper(),
                    "Aula": horario["aula"] + " -" + extraer_bloque(horario["bloque_campus"]),
                    "HoraInicio": horario["hora_inicio"],
                    "HoraFin": horario["hora_fin"],
                    "FechaExa_Primer": fecha_parcial,
                    "FechaExa_Segundo": fecha_final,
                    "FechaExa_Mejoramiento": fecha_mejoramiento,
                    "HoraInicioE": hora_inicio_e,
                    "HoraFinE": hora_fin_e
                })

            # Cuerpo del paralelo teórico
            paralelo_teorico = {
                "Paralelo": int(paralelo_detalle["numero_paralelo"]) if paralelo_detalle["numero_paralelo"].isdigit() else paralelo_detalle["numero_paralelo"],
                "Profesor": paralelo_detalle["profesor"],
                "horarios": horarios_teorico
            }
            target[codigo]["Teorico"].append(paralelo_teorico)

            # Practicos asociados (tabla colapsable por paralelo)
            for i, paralelo_practico in enumerate(paralelo_detalle["paralelos_asociados"]):
                horarios_practico = []
                for horario_p in paralelo_practico.get("horarios", []):
                    horarios_practico.append({
                        "Dia": horario_p["dia"].upper(),
                        "Aula": horario_p["aula"] + " -" + extraer_bloque(horario_p["bloque_campus"]),
                        "HoraInicio": horario_p["hora_inicio"],
                        "HoraFin": horario_p["hora_fin"],
                        "FechaExa_Primer": fecha_parcial,
                        "FechaExa_Segundo": fecha_final,
                        "FechaExa_Mejoramiento": fecha_mejoramiento,
                        "HoraInicioE": hora_inicio_e,
                        "HoraFinE": hora_fin_e
                    })
                if horarios_practico:
                    # Algunos prácticos no tienen número claro, damos fallback 101,102,...
                    numero_paralelo_practico = paralelo_practico.get("numero_paralelo", str(101 + i))
                    if isinstance(numero_paralelo_practico, str) and numero_paralelo_practico.isdigit():
                        numero_paralelo_practico = int(numero_paralelo_practico)
                    target[codigo]["Practico"].append({
                        "Paralelo": numero_paralelo_practico,
                        "Profesor": paralelo_practico.get("profesor", paralelo_detalle["profesor"]),
                        "horarios": horarios_practico
                    })

    return {"Materias Complementarias": agrupadas_complementarias, "Materias": agrupadas_normales}


# ===============================
# Helpers de parsing de strings
# ===============================
def extraer_fecha(fecha_hora_str):
    """
    Extrae la fecha de un string como '20/11/2025 - 09:00 a 11:00'
    """
    try:
        if " - " in fecha_hora_str:
            fecha_parte = fecha_hora_str.split(" - ")[0]
            return fecha_parte
        return fecha_hora_str
    except:
        return "No encontrado"


def extraer_horas_examen(fecha_hora_str):
    """
    Extrae las horas de inicio y fin de un string como '20/11/2025 - 09:00 a 11:00'
    Retorna ('09:00:00', '11:00:00') por defecto si no se logra parsear.
    """
    try:
        if " - " in fecha_hora_str and " a " in fecha_hora_str:
            horas_parte = fecha_hora_str.split(" - ")[1]
            hora_inicio = horas_parte.split(" a ")[0] + ":00"
            hora_fin = horas_parte.split(" a ")[1] + ":00"
            return hora_inicio, hora_fin
        return "09:00:00", "11:00:00"  # Default
    except:
        return "09:00:00", "11:00:00"


def extraer_bloque(bloque_campus_str):
    """
    Extrae el bloque de un string como '14B CAMPUS GUSTAVO GALINDO' -> '14B'
    """
    try:
        partes = bloque_campus_str.split()
        if partes:
            return partes[0]
        return ""
    except:
        return ""


# (opcional) quedó, pero ya no la usamos para abrir el captcha fuera del navegador
def mostrar_captcha(ruta):
    try:
        # Windows
        os.startfile(ruta)
    except AttributeError:
        # MacOS
        from subprocess import call
        call(['open', ruta])
    except Exception:
        # Linux
        from subprocess import call
        call(['xdg-open', ruta])


# =====================================================
# Scraper de detalle de una materia (página de paralelo)
# =====================================================
def extraer_detalles_materia(session, url_materia, max_intentos=3):
    """
    Visita la página del paralelo y extrae:
    - datos básicos (nombre, profe, modalidad, cupos)
    - fechas/horarios de exámenes
    - horarios de clases teóricas
    - paralelos prácticos (profesor, horarios)
    Maneja reintentos por timeout/red y devuelve estructura dict.
    """
    for intento in range(max_intentos):
        try:
            if intento > 0:
                print(f"  Reintentando... (intento {intento + 1}/{max_intentos})")
                time.sleep(0.5)  # Pausa corta entre reintentos
            
            resp = session.get(url_materia, timeout=15)  # Timeout algo agresivo
            resp.raise_for_status()  # Excepción si hay error HTTP
            
            # Solo en caso de estado no 200 guardamos HTML para depurar
            if resp.status_code != 200:
                filename = f"error_materia_{url_materia.split('=')[-1]}.html"
                with open(filename, "w", encoding="utf-8") as f:
                    f.write(resp.text)
            
            soup = BeautifulSoup(resp.text, "html.parser")
            detalles = {}
            
            # --- Datos básicos (IDs estables en la página de paralelo)
            elementos_basicos = {
                "nombre_materia": "ctl00_contenido_LabelNombreMateria",
                "paralelo": "ctl00_contenido_LabelParalelo", 
                "profesor": "ctl00_contenido_LabelProfesor",
                "modalidad": "ctl00_contenido_modo_curso",
                "cupo_maximo": "ctl00_contenido_LabelCupo",
                "cupo_disponible": "ctl00_contenido_LabelDisponible"
            }
            for key, elemento_id in elementos_basicos.items():
                elemento = soup.find("span", {"id": elemento_id})
                detalles[key] = elemento.get_text(strip=True) if elemento else "No encontrado"
            
            # --- Exámenes (parcial/final/mejoramiento)
            examenes = {}
            elementos_examenes = {
                "parcial": {
                    "fecha_hora": "ctl00_contenido_LabelParcial",
                    "aula": "ctl00_contenido_aulaParcial"
                },
                "final": {
                    "fecha_hora": "ctl00_contenido_LabelFinal", 
                    "aula": "ctl00_contenido_aulaFinal"
                },
                "mejoramiento": {
                    "fecha_hora": "ctl00_contenido_LabelMejora",
                    "aula": "ctl00_contenido_aulaMej"
                }
            }
            for tipo_examen, campos in elementos_examenes.items():
                examenes[tipo_examen] = {}
                for campo, elemento_id in campos.items():
                    elemento = soup.find("span", {"id": elemento_id})
                    examenes[tipo_examen][campo] = elemento.get_text(strip=True) if elemento else "No encontrado"
            detalles["examenes"] = examenes
            
            # --- Horarios teóricos (tabla principal)
            horarios = []
            tabla_horarios = soup.find("table", {"id": "ctl00_contenido_TableHorarios"})
            if tabla_horarios:
                tbody = tabla_horarios.find("tbody")
                if tbody:
                    for fila in tbody.find_all("tr"):
                        celdas = fila.find_all("td")
                        if len(celdas) >= 5:
                            horario = {
                                "dia": celdas[0].get_text(strip=True),
                                "hora_inicio": celdas[1].get_text(strip=True),
                                "hora_fin": celdas[2].get_text(strip=True),
                                "aula": celdas[3].get_text(strip=True),
                                "bloque_campus": celdas[4].get_text(strip=True)
                            }
                            horarios.append(horario)
            detalles["horarios"] = horarios
            
            # --- Paralelos prácticos (bloques colapsables por paralelo teórico)
            paralelos_asociados = []
            # Busca anchors con onclick que contengan "cargarparalelo"
            enlaces_paralelos = soup.find_all("a", onclick=lambda x: x and "cargarparalelo" in x)
            
            for enlace in enlaces_paralelos:
                try:
                    id_paralelo = enlace.get("id", "")  # ID del widget del práctico
                    if id_paralelo:
                        tabla_id = f"tabla_{id_paralelo}"
                        div_tabla = soup.find("div", {"id": tabla_id})
                        
                        if div_tabla:
                            paralelo_info = {}
                            
                            # Extrae profesor/número del práctico/capacidad/cupo disponible
                            tabla_info = div_tabla.find("table")
                            if tabla_info:
                                filas = tabla_info.find_all("tr")
                                for fila in filas:
                                    texto = fila.get_text()
                                    if "Profesor:" in texto:
                                        parts = texto.split("Profesor:")
                                        if len(parts) > 1:
                                            profesor_texto = parts[1].split("Paralelo:")[0].strip()
                                            paralelo_info["profesor"] = profesor_texto
                                    if "Paralelo::" in texto:
                                        parts = texto.split("Paralelo::")
                                        if len(parts) > 1:
                                            paralelo_info["numero_paralelo"] = parts[1].strip()
                                    if "Capacidad:" in texto:
                                        parts = texto.split("Capacidad:")
                                        if len(parts) > 1:
                                            capacidad = parts[1].split("Cupo disponible:")[0].strip()
                                            paralelo_info["capacidad"] = capacidad
                                    if "Cupo disponible:" in texto:
                                        parts = texto.split("Cupo disponible:")
                                        if len(parts) > 1:
                                            cupo_disp = parts[1].strip()
                                            paralelo_info["cupo_disponible"] = cupo_disp
                            
                            # Tabla de horarios del práctico
                            tabla_horarios_p = div_tabla.find("table", class_="display")
                            horarios_paralelo = []
                            if tabla_horarios_p:
                                tbody_p = tabla_horarios_p.find("tbody")
                                if tbody_p:
                                    for fila_p in tbody_p.find_all("tr"):
                                        celdas_p = fila_p.find_all("td")
                                        if len(celdas_p) >= 5:
                                            horario_p = {
                                                "dia": celdas_p[0].get_text(strip=True),
                                                "hora_inicio": celdas_p[1].get_text(strip=True),
                                                "hora_fin": celdas_p[2].get_text(strip=True),
                                                "aula": celdas_p[3].get_text(strip=True),
                                                "bloque_campus": celdas_p[4].get_text(strip=True)
                                            }
                                            horarios_paralelo.append(horario_p)
                            
                            if horarios_paralelo:
                                paralelo_info["horarios"] = horarios_paralelo
                                paralelos_asociados.append(paralelo_info)
                
                except Exception as e_paralelo:
                    print(f"    Error extrayendo paralelo {enlace.get('id', 'desconocido')}: {e_paralelo}")
                    continue
            
            detalles["paralelos_asociados"] = paralelos_asociados
            
            # Si llegamos aquí, la extracción fue exitosa
            return detalles
            
        except requests.exceptions.Timeout:
            print(f"  [WARN] Timeout en intento {intento + 1}")
            if intento == max_intentos - 1:
                return {"error": "Timeout después de varios intentos", "url": url_materia}
        except requests.exceptions.RequestException as e:
            print(f"  [WARN] Error de conexion en intento {intento + 1}: {e}")
            if intento == max_intentos - 1:
                return {"error": f"Error de conexión: {str(e)}", "url": url_materia}
        except Exception as e:
            print(f"  [WARN] Error al parsear datos en intento {intento + 1}: {e}")
            if intento == max_intentos - 1:
                return {"error": f"Error de parsing: {str(e)}", "url": url_materia}
    
    # Llegar aquí significa que fallaron todos los intentos
    return {"error": "Falló después de todos los intentos", "url": url_materia}


# =========================================================
# Wrapper para ejecutar extracción de UN paralelo (para pool)
# =========================================================
def procesar_paralelo_individual(args):
    """
    Función auxiliar para procesar un paralelo individual en threading.
    Recibe (session, paralelo, número correlativo, total).
    """
    session, paralelo, numero_paralelo, total_paralelos = args
    try:
        print(f"  [{numero_paralelo}/{total_paralelos}] Paralelo {paralelo['numero']}")
        
        detalles = extraer_detalles_materia(session, paralelo["url"])
        detalles["numero_paralelo"] = paralelo["numero"]
        detalles["url"] = paralelo["url"]
        
        return detalles
    except Exception as e:
        print(f"  [ERROR] Error procesando paralelo {paralelo['numero']}: {e}")
        return {"error": f"Error: {str(e)}", "numero_paralelo": paralelo["numero"], "url": paralelo["url"]}


# ============================
# Punto de entrada principal
# ============================
def main():
    # Solicitar credenciales por terminal (si no llegan por variables de entorno)
    print("=" * 60)
    print("SISTEMA DE EXTRACCION DE MATERIAS ESPOL")
    print("=" * 60)
    print("Este programa extraera informacion detallada de materias disponibles")
    print("desde el sistema academico de ESPOL.")
    print()
    print("Requisitos:")
    print("  - Credenciales validas del sistema academico ESPOL")
    print("  - Conexion a internet estable")
    print("  - Capacidad de resolver CAPTCHA")
    print()
    print("Por favor, ingrese sus credenciales:")
    print("Tip: Presiona Ctrl+C en cualquier momento para cancelar")
    print()

    # Permitir inyección de credenciales desde variables de entorno (backend Node)
    usuario_env = os.getenv("EXTRACCION_USUARIO", "").strip()
    password_env = os.getenv("EXTRACCION_PASSWORD", "")

    try:
        if usuario_env:
            usuario = usuario_env
            print("Usando usuario provisto por backend.")
        else:
            usuario = input("Usuario: ").strip()
            if not usuario:
                print("Error: Debe ingresar un usuario valido")
                return

        if password_env:
            password = password_env
            print("Usando contrasena provista por backend.")
        else:
            password = getpass.getpass("Contrasena: ")
            if not password:
                print("Error: Debe ingresar una contrasena valida")
                return
    except KeyboardInterrupt:
        print("\nOperacion cancelada por el usuario.")
        return
    except EOFError:
        print("\nEntrada inesperada. Programa terminado.")
        return

    print("Iniciando proceso de autenticacion...")
    print()
    
    url_login = "https://www.academico.espol.edu.ec/login.aspx?ReturnUrl=%2fUI%2fRegistros%2fmateriasdisponibles.aspx"

    # ============================
    # Sesión HTTP con retries/pooling
    # ============================
    session = requests.Session()
    
    from requests.adapters import HTTPAdapter
    from urllib3.util.retry import Retry
    
    adapter = HTTPAdapter(
        pool_connections=10,
        pool_maxsize=10,
        max_retries=Retry(
            total=3,
            backoff_factor=0.3,
            status_forcelist=[500, 502, 503, 504]
        )
    )
    session.mount('https://', adapter)
    session.mount('http://', adapter)
    
    # Headers "normales" para parecer navegador y mantener keep-alive
    session.headers.update({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Connection': 'keep-alive',
        'Keep-Alive': 'timeout=30, max=100'
    })

    # Paso 1: GET de login para capturar __VIEWSTATE y demás campos ocultos ASP.NET
    resp = session.get(url_login)
    soup = BeautifulSoup(resp.text, "html.parser")
    viewstate = soup.find("input", {"name": "__VIEWSTATE"})["value"]
    eventvalidation = soup.find("input", {"name": "__EVENTVALIDATION"})["value"]
    viewstategen = soup.find("input", {"name": "__VIEWSTATEGENERATOR"})["value"]

    # Paso 2: POST con usuario (página intermedia antes del CAPTCHA)
    payload1 = {
        "__VIEWSTATE": viewstate,
        "__EVENTVALIDATION": eventvalidation,
        "__VIEWSTATEGENERATOR": viewstategen,
        "ctl00$contenido$txtuser": usuario,
        "ctl00$contenido$btnSigte": "Siguiente"
    }
    resp2 = session.post(url_login, data=payload1)
    soup2 = BeautifulSoup(resp2.text, "html.parser")

    # Paso 3: Capturamos nuevos campos ocultos + datos del CAPTCHA
    try:
        viewstate2 = soup2.find("input", {"name": "__VIEWSTATE"})["value"]
        eventvalidation2 = soup2.find("input", {"name": "__EVENTVALIDATION"})["value"]
        viewstategen2 = soup2.find("input", {"name": "__VIEWSTATEGENERATOR"})["value"]
        lbd_vcid = soup2.find("input", {"name": lambda x: x and x.startswith("LBD_VCID_")})
        lbd_vcid_name = lbd_vcid["name"]
        lbd_vcid_value = lbd_vcid["value"]

        # Imagen del CAPTCHA
        captcha_img = soup2.find("img", {"class": "LBD_CaptchaImage"})
        captcha_url = captcha_img["src"]
        if captcha_url.startswith("/"):
            captcha_url = urljoin(url_login, captcha_url)
    except Exception:
        print("[ERROR] No se pudo extraer el captcha o los campos ocultos del segundo paso. Revisa debug_usuario.html.")
        return
    
    # --- NUEVO: descarga y guarda el CAPTCHA en /public/captcha.jpg para que el frontend lo muestre ---
    try:
        # Descargamos la imagen del captcha
        captcha_resp = session.get(captcha_url)

        # Ruta a "public/captcha.jpg" (directorio hermano del script, ajusta si tu estructura difiere)
        CAPTCHA_PATH = Path(__file__).resolve().parent / "public" / "captcha.jpg"

        # Aseguramos que exista la carpeta /public
        CAPTCHA_PATH.parent.mkdir(parents=True, exist_ok=True)

        # Guardamos la imagen en disco
        with open(CAPTCHA_PATH, "wb") as f:
            f.write(captcha_resp.content)

        # Señal opcional para backend/frontend (puede usarse para saber que ya hay captcha listo)
        print("CAPTCHA_READY", flush=True)

        # Si backend nos inyecta el código por variable de entorno (EXTRACCION_CAPTCHA), úsalo.
        # Si no, pedimos por consola (el frontend envía texto por stdin).
        captcha_code = os.getenv("EXTRACCION_CAPTCHA", "").strip()
        if not captcha_code:
            captcha_code = input("Introduce el texto del captcha (mira la imagen en la página): ")

    except Exception:
        print("[ERROR] No se pudo descargar o guardar el captcha en /public.")
        return

    # Paso 4: POST de login final con contraseña + captcha
    payload2 = {
        "__VIEWSTATE": viewstate2,
        "__EVENTVALIDATION": eventvalidation2,
        "__VIEWSTATEGENERATOR": viewstategen2,
        lbd_vcid_name: lbd_vcid_value,
        "ctl00$contenido$txtpsw": password,
        "ctl00$contenido$CaptchaCodeTextBox": captcha_code,
        "ctl00$contenido$btnIniciarSesion": "Iniciar sesión"
    }

    form = soup2.find("form", {"id": "aspnetForm"})
    action = form["action"]
    if action.startswith("./"):
        post_url = urljoin(url_login, action)
    else:
        post_url = action

    resp3 = session.post(post_url, data=payload2)
    # Guardamos HTML por si hay que depurar problemas de login
    with open("debug_postlogin.html", "w", encoding="utf-8") as f:
        f.write(resp3.text)
    
    # Validar si el login fue exitoso (URLs típicas o presencia de "logout")
    if "historiaacademica_" in resp3.url or "materiasdisponibles" in resp3.url or "logout" in resp3.text:
        print("Login exitoso")
    else:
        # Mensajes comunes de error
        if "captcha" in resp3.text.lower() or "código de verificación" in resp3.text.lower():
            print("Error: Codigo CAPTCHA incorrecto. Intentelo de nuevo.")
        elif "contraseña" in resp3.text.lower() or "usuario" in resp3.text.lower():
            print("Error: Usuario o contrasena incorrectos.")
        else:
            print("Error: No se pudo iniciar sesion. Revise debug_postlogin.html para mas detalles.")
        return

    # ============================
    # Página de materias disponibles
    # ============================
    url_materias_disponibles = "https://www.academico.espol.edu.ec/UI/Registros/materiasdisponibles.aspx"
    resp4 = session.get(url_materias_disponibles)
    with open("respuesta_materias_disponibles.html", "w", encoding="utf-8") as f:
        f.write(resp4.text)

    soup4 = BeautifulSoup(resp4.text, "html.parser")
    try:
        # Verificación simple de estar en la página correcta
        h1 = soup4.find("h1")
        if not h1 or "Materias disponibles" not in h1.get_text():
            print("[ERROR] No se encontró el título 'Materias disponibles' en la página. Revisa respuesta_materias_disponibles.html.")
            return
        
        # La tabla principal donde están listadas (ID estable en el sitio)
        tabla = soup4.find("table", {"id": "ctl00_contenido_tbMateriasDisp"})
        if not tabla:
            print("[ERROR] No se encontró la tabla de materias disponibles. Revisa respuesta_materias_disponibles.html.")
            return
        
        materias = []
        tbody = tabla.find("tbody")
        if tbody:
            for fila in tbody.find_all("tr"):
                celdas = fila.find_all("td")
                if len(celdas) >= 5:  # Código, Materia, Estado Académico, Tipo Crédito, Paralelos
                    # La última celda suele contener los links a paralelos [1] [2] ...
                    paralelos_info = []
                    enlaces_paralelos = celdas[4].find_all("a", class_="myLink")
                    
                    for enlace in enlaces_paralelos:
                        href = enlace.get("href")
                        numero_paralelo = enlace.get_text(strip=True).replace("[", "").replace("]", "")
                        
                        if href:
                            # Construir URL absoluta
                            url_completa = "https://www.academico.espol.edu.ec/UI/Registros/" + href
                            paralelos_info.append({
                                "numero": numero_paralelo,
                                "url": url_completa
                            })
                    
                    # Estructura base por materia
                    materia = {
                        "codigo": celdas[0].get_text(strip=True),
                        "materia": celdas[1].get_text(strip=True),
                        "estado_academico": celdas[2].get_text(strip=True),
                        "tipo_credito": celdas[3].get_text(strip=True),
                        "paralelos_texto": celdas[4].get_text(strip=True),
                        "paralelos": paralelos_info
                    }
                    materias.append(materia)
        
        # Año y término (si el sitio los muestra)
        anio_elem = soup4.find("span", {"id": "ctl00_contenido_lblAnio"})
        termino_elem = soup4.find("span", {"id": "ctl00_contenido_lblTermino"})

        print(f"Se encontraron {len(materias)} materias disponibles para el anio {anio_elem.get_text(strip=True) if anio_elem else 'No encontrado'}, termino {termino_elem.get_text(strip=True) if termino_elem else 'No encontrado'}")
        
        # ============================
        # Extracción de detalles de paralelos en CONCURRENCIA
        # ============================
        print("\n=== Extrayendo detalles de cada paralelo (modo concurrente) ===")
        start_time = time.time()
        materias_con_detalles = []
        
        total_paralelos = sum(len(materia["paralelos"]) for materia in materias)
        contador = 0

        print(f"Iniciando procesamiento de {total_paralelos} paralelos en {len(materias)} materias...")
        
        for idx, materia in enumerate(materias, 1):
            materia_start_time = time.time()
            print(f"\n[{idx}/{len(materias)}] Procesando materia: {materia['codigo']} - {materia['materia']}")
            materia_detallada = {
                "codigo": materia["codigo"],
                "materia": materia["materia"],
                "estado_academico": materia["estado_academico"],
                "tipo_credito": materia["tipo_credito"],
                "paralelos_detallados": []
            }
            
            # Preparamos los argumentos que recibirá cada worker/hilo
            args_paralelos = []
            for paralelo in materia["paralelos"]:
                contador += 1
                args_paralelos.append((session, paralelo, contador, total_paralelos))
            
            # Usamos un pool de 5 workers para no saturar el servidor
            if args_paralelos:
                with ThreadPoolExecutor(max_workers=5) as executor:
                    resultados = list(executor.map(procesar_paralelo_individual, args_paralelos))
                
                # Agregamos los resultados de cada paralelo (éxito o error)
                for resultado in resultados:
                    materia_detallada["paralelos_detallados"].append(resultado)
            
            materias_con_detalles.append(materia_detallada)
            
            # Métricas de avance
            materia_time = time.time() - materia_start_time
            elapsed_total = time.time() - start_time
            avg_time_per_materia = elapsed_total / idx
            remaining_materias = len(materias) - idx
            estimated_remaining = remaining_materias * avg_time_per_materia

            print(f"Completada materia {materia['codigo']} con {len(materia_detallada['paralelos_detallados'])} paralelos")
            print(f"Tiempo: {materia_time:.1f}s | Total: {elapsed_total:.1f}s | ETA: {estimated_remaining:.1f}s")
        
        # ============================
        # Transformación final y guardado
        # ============================
        print("\n=== Transformando datos al formato requerido ===")
        datos_formato_requerido = transformar_a_formato_requerido(materias_con_detalles)
        
        # Guardar JSON final (el frontend lo leerá con /api/extraccion/result)
        with open("materias_formato_requerido.json", "w", encoding="utf-8") as f:
            json.dump(datos_formato_requerido, f, ensure_ascii=False, indent=4)
        
        # ============================
        # Métricas de rendimiento
        # ============================
        total_time = time.time() - start_time
        paralelos_exitosos = sum(
            len([p for p in m["paralelos_detallados"] if "error" not in p])
            for m in materias_con_detalles
        )
        paralelos_con_error = total_paralelos - paralelos_exitosos

        print(f"\nEXTRACCION COMPLETADA")
        print(f"Estadisticas de rendimiento:")
        print(f"  Tiempo total: {total_time:.1f} segundos ({total_time/60:.1f} minutos)")
        print(f"  Materias procesadas: {len(datos_formato_requerido)}")
        print(f"  Paralelos exitosos: {paralelos_exitosos}/{total_paralelos}")
        if paralelos_con_error > 0:
            print(f"  Paralelos con errores: {paralelos_con_error}")
        print(f"  Promedio por paralelo: {total_time/total_paralelos:.2f}s")
        print(f"  Velocidad de procesamiento: {total_paralelos/total_time:.1f} paralelos/segundo")
        print(f"Archivo 'materias_formato_requerido.json': {len(datos_formato_requerido)} materias en formato requerido")
        
    except Exception as e:
        # Cualquier excepción no controlada se captura aquí para que el backend pueda leer el error
        print(f"[ERROR] Error extrayendo la tabla de materias disponibles: {e}")


# Ejecuta main() si se corre como script (no si se importa como módulo)
if __name__ == "__main__":
    main()
