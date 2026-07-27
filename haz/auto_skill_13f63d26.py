import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu sueldo y ciudad actual y de destino. Ej: '$2M CABA Cordoba'"

    m_sueldo = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m_sueldo:
        return "No entendi el sueldo."

    val = float(m_sueldo.group(1).replace(",", ""))
    s = (m_sueldo.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    # Cost of living index per city (base CABA = 1.0)
    ciudades = {
        "caba": 1.0, "buenos aires": 1.0, "capital": 1.0,
        "cordoba": 0.82, "cbca": 0.82,
        "rosario": 0.85,
        "mendoza": 0.78,
        "la plata": 0.88,
        "mar del plata": 0.80,
        "salta": 0.72,
        "tucuman": 0.70,
        "neuquen": 0.95,
        "bariloche": 1.05,
        "ushuaia": 1.12,
        "resistencia": 0.68,
        "corrientes": 0.70,
        "posadas": 0.72,
        "san miguel de tucuman": 0.70,
        "santiago del estero": 0.65,
        "formosa": 0.62,
        "la rioja": 0.68,
        "san juan": 0.72,
        "san luis": 0.70,
        "catamarca": 0.66,
        "jujuy": 0.65,
        "parana": 0.75,
        "santa fe": 0.80,
        "bahia blanca": 0.78,
        "comodoro rivadavia": 1.08,
        "rio gallegos": 1.10,
        "viedma": 0.85,
    }

    t_lower = t.lower()
    ciudad_origen = None
    ciudad_destino = None
    palabras = t_lower.split()
    for i, p in enumerate(palabras):
        for key in ciudades:
            if p == key or p.startswith(key[:5]):
                if ciudad_origen is None:
                    ciudad_origen = key
                elif ciudad_destino is None:
                    ciudad_destino = key

    if not ciudad_origen:
        ciudad_origen = "caba"
    if not ciudad_destino:
        ciudad_destino = "cordoba"

    idx_o = ciudades.get(ciudad_origen, 1.0)
    idx_d = ciudades.get(ciudad_destino, 1.0)

    sueldo_equivalente = val * (idx_d / idx_o)
    diff = sueldo_equivalente - val

    lines = [
        "=== PODER ADQUISITIVO ENTRE CIUDADES ===",
        "Origen:   {} (indice {:.2f})".format(ciudad_origen.capitalize(), idx_o),
        "Destino:  {} (indice {:.2f})".format(ciudad_destino.capitalize(), idx_d),
        "",
        "Tu sueldo actual: $ {:,.0f}".format(val),
        "Equivalente en {}: $ {:,.0f}".format(ciudad_destino.capitalize(), sueldo_equivalente),
    ]

    if diff > 0:
        lines.append("Necesitarias $ {:,.0f} MAS ({:.0f}%) para mantener el mismo poder adquisitivo.".format(diff, diff/val*100))
    elif diff < 0:
        lines.append("Gastarias $ {:,.0f} MENOS ({:.0f}%). Te sobra guita.".format(abs(diff), abs(diff)/val*100))
    else:
        lines.append("Mismo poder adquisitivo.")

    return "\n".join(lines)
