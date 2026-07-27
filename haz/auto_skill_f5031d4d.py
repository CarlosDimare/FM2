import re
from datetime import datetime

CONVENIOS = {
    "comercio": {"nombre": "Empleados de Comercio (FAECYS)", "minimo": 850000, "jornada": 48, "color": "media"},
    "gastronomico": {"nombre": "Gastronomicos (UTHGRA)", "minimo": 996000, "jornada": 48, "color": "media"},
    "docente": {"nombre": "Docentes (CTERA)", "minimo": 650000, "jornada": 40, "color": "bajo"},
    "rural": {"nombre": "Trabajadores Rurales (UATRE)", "minimo": 1088000, "jornada": 44, "color": "media"},
    "metalurgico": {"nombre": "Metalurgicos (UOM)", "minimo": 950000, "jornada": 44, "color": "media"},
    "construccion": {"nombre": "Construccion (UOCRA)", "minimo": 900000, "jornada": 44, "color": "media"},
    "bancario": {"nombre": "Bancarios (AB)", "minimo": 1500000, "jornada": 35, "color": "alto"},
    "petrolero": {"nombre": "Petroleros (SUPEH)", "minimo": 2500000, "jornada": 40, "color": "alto"},
    "camionero": {"nombre": "Camioneros", "minimo": 1200000, "jornada": 44, "color": "alto"},
    "salud": {"nombre": "Sanidad (FESPROSA)", "minimo": 800000, "jornada": 36, "color": "media"},
}

CANASTA_BASICA = 1005000


def run(ctx):
    text = ctx.get("text", "")
    if not text:
        lines = [
            "[ Cuanto Vale Tu Hora ]",
            "",
            "  Decime tu sueldo y horas semanales y te calculo",
            "  si estas por encima o debajo de cada gremio.",
            "",
            "  Ej: 'gano 800 lucas, laburo 40hs semanales'",
            "  Ej: 'sueldo 1.5 palos, 48hs'",
        ]
        return "\n".join(lines)

    sueldo, horas = _extraer_datos(text)
    if not sueldo:
        return "No pude entender tu sueldo. Pone algo como 'gano 800 lucas' o 'sueldo 1.2 millones'."

    if not horas:
        for cv in CONVENIOS.values():
            horas = cv["jornada"]
            break

    valor_hora = sueldo / 4.33 / horas
    canastas = sueldo / CANASTA_BASICA

    lines = [f"[ Cuanto Vale Tu Hora ]"]
    lines.append("")
    lines.append(f"  Sueldo mensual:       ${sueldo:,.0f}")
    lines.append(f"  Horas semanales:      {horas}")
    lines.append(f"  Valor hora:           ${valor_hora:,.0f}")
    lines.append(f"  Canastas basicas:     {canastas:.2f} (CBT=${CANASTA_BASICA:,})")
    lines.append("")
    lines.append(f"  Comparado con gremios (por hora):")
    lines.append("")

    ordenados = sorted(CONVENIOS.items(), key=lambda x: x[1]["minimo"] / x[1]["jornada"], reverse=True)

    superados = 0
    for key, cv in ordenados:
        valor_hora_gremio = cv["minimo"] / 4.33 / cv["jornada"]
        diff = valor_hora - valor_hora_gremio
        arriba = diff >= 0
        if arriba:
            superados += 1
        signo = "+" if arriba else ""
        lines.append(f"  {key:15s} ${valor_hora_gremio:>7,.0f}/h  ({signo}${diff:>7,.0f})  {'GANAS' if arriba else 'PERDES'} vs {cv['nombre']}")

    lines.append("")
    total = len(CONVENIOS)
    if superados == 0:
        lines.append(f"  Estas por debajo de todos los gremios. Considera afiliarte.")
    elif superados == total:
        lines.append(f"  Estas por encima de todos los gremios. Felicidades, burgues.")
    elif superados >= total / 2:
        lines.append(f"  Estas por encima de {superados}/{total} gremios. Clase media tirando.")
    else:
        lines.append(f"  Estas por encima de solo {superados}/{total} gremios. Busca un convenio.")

    lines.append("")
    lines.append(f"  Tip: la canasta basica total es ${CANASTA_BASICA:,}.")
    lines.append(f"  Si tu sueldo no cubre al menos 1 canasta, no es tu culpa.")
    lines.append(f"  Es que los salarios los pone el mercado, no la necesidad.")

    return "\n".join(lines)


def _extraer_datos(text: str) -> tuple:
    t = text.lower()
    sueldo = None

    patterns = [
        r"(\d[\d.,]*)\s*(?:lucas|mil|palos|millones?|k)\s*(?:bruto|neto)?",
        r"(?:sueldo|salario|gano|cobro|gano)\s*(?:de\s*)?\$?\s*([\d.,]+)",
        r"\$?\s*([\d.,]+)\s*(?:lucas|mil|palos|millones?)",
    ]

    for pat in patterns:
        m = re.search(pat, t)
        if m:
            raw = m.group(1)
            tiene_punto = "." in raw
            s = raw.replace(".", "").replace(",", "")

            if tiene_punto and s.isdigit():
                raw_float = float(raw.replace(",", "."))
                if "palos" in t or "millones" in t:
                    sueldo = int(raw_float * 1000000)
                elif "lucas" in t or "k" in t:
                    sueldo = int(raw_float * 1000)
                else:
                    sueldo = int(raw_float)
                if sueldo < 10000:
                    sueldo *= 1000
                break

            if s.isdigit():
                val = int(s)
                if "palos" in t or "millones" in t:
                    val *= 1000000
                elif "lucas" in t or "k" in t:
                    val *= 1000
                if val < 10000:
                    val *= 1000
                sueldo = val
                break

    horas = None
    hm = re.search(r"(\d+)\s*(?:hs?|horas?|semanales?)", t)
    if hm:
        horas = int(hm.group(1))

    return sueldo, horas
