import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y sector. Ej: '$2M software' o 'USD3000'."

    m = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|usd|dolares)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el salario."

    val = float(m.group(1).replace(",", ""))
    suffix = (m.group(2) or "").lower().strip()

    usd_mode = "usd" in t.lower()

    if suffix in ("k", "mil"):
        val *= 1_000
    elif suffix in ("m", "millones"):
        val *= 1_000_000

    salario_mensual = val * (1_400 if usd_mode else 1)

    sectores = {
        "software": {"ratio": 7.45, "nombre": "Software/CESSI"},
        "industria": {"ratio": 4.0, "nombre": "Industria manufacturera"},
        "comercio": {"ratio": 3.0, "nombre": "Comercio"},
        "construccion": {"ratio": 2.5, "nombre": "Construccion"},
        "servicios": {"ratio": 4.5, "nombre": "Servicios generales"},
    }

    sector = "default"
    nombre_sector = "Economia (estimacion)"
    ratio = 4.0
    for key in sectores:
        if key in t.lower():
            sector = key
            nombre_sector = sectores[key]["nombre"]
            ratio = sectores[key]["ratio"]
            break

    valor_generado = salario_mensual * ratio
    horas_mes = 160
    horas_para_empresa = horas_mes * (1 - 1 / ratio)
    horas_para_vos = horas_mes / ratio

    lines = [
        "=== PLUSVALIA ===",
        "Sector:     " + nombre_sector,
        "Salario:    $ {:,.0f}/mes".format(salario_mensual),
        "Generas:    $ {:,.0f}/mes".format(valor_generado),
        "Proporcion: 1:{} ($ {:.2f} por cada $1)".format(int(round(ratio)), ratio),
        "",
        "Del mes ({}h):".format(horas_mes),
        "- {:.0f}h ({:.0f}%) para la empresa (plusvalia)".format(horas_para_empresa, horas_para_empresa / horas_mes * 100),
        "- {:.0f}h ({:.0f}%) para vos".format(horas_para_vos, horas_para_vos / horas_mes * 100),
        "",
        "Dias:",
        "- {:.1f} dias/mes laburas para la empresa".format(horas_para_empresa / 8),
        "- {:.1f} dias/mes laburas para vos".format(horas_para_vos / 8),
    ]

    if ratio >= 7:
        lines += ["", "Software: el sector mas explotado de la economia argentina."]
    elif ratio >= 4:
        lines += ["", "Productividad alta, retribucion baja. Tipico de Argentina."]

    return "\n".join(lines)
