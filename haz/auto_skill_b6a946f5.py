import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y el sector. Ej: '$2M software' o 'USD3000'."

    m = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|usd|dolares)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el salario."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    usd_mode = "usd" in t.lower()

    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    salario = val * (1_400 if usd_mode else 1)

    sectores = [
        ("software", "Software/IT", 7.45),
        ("industria", "Industria", 4.0),
        ("comercio", "Comercio", 3.0),
        ("construccion", "Construccion", 2.5),
        ("servicios", "Servicios", 4.5),
    ]

    sector = "default"
    nombre = "Economia gral"
    ratio = 4.0
    for key, name, r in sectores:
        if key in t.lower():
            sector = key
            nombre = name
            ratio = r
            break

    valor_anual = salario * 13  # 12 meses + aguinaldo
    generas_anual = valor_anual * ratio
    plusvalia_anual = generas_anual - valor_anual

    horas_mes = 160
    h_para_empresa = horas_mes * (1 - 1 / ratio)
    h_para_vos = horas_mes / ratio

    lines = [
        "=== EXCEDENTE ANUAL ===",
        "Sector:     " + nombre,
        "Tu salario: $ {:,.0f}/mes ($ {:,.0f}/ano)".format(salario, valor_anual),
        "Generas:    $ {:,.0f}/ano".format(generas_anual),
        "Plusvalia:  $ {:,.0f}/ano".format(plusvalia_anual),
        "Proporcion: 1:{}".format(int(round(ratio))),
        "",
        "Por mes ({}h):".format(horas_mes),
        "- {:.0f}h para la empresa ({:.0f}%)".format(h_para_empresa, h_para_empresa / horas_mes * 100),
        "- {:.0f}h para vos ({:.0f}%)".format(h_para_vos, h_para_vos / horas_mes * 100),
    ]

    return "\n".join(lines)
