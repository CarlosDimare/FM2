import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un precio en ARS y te digo cuanto sale en cuotas, USD y dolar blue. Ej: '$50000' o '$1M'"

    m = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m:
        return "No entendi."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    blue = 1400
    oficial = 950
    usd_blue = val / blue
    usd_oficial = val / oficial

    # Cuotas
    cuotas_opciones = [(3, 1.05), (6, 1.12), (12, 1.25), (18, 1.40)]
    intereses = 0.03  # 3% monthly inflation approx

    lines = [
        "=== PRECIO EN ARGENTINA ===",
        "Precio: $ {:,.0f}".format(val),
        "",
        "En dolares:",
        "- Blue:    US$ {:,.2f} (${:,.0f})".format(usd_blue, blue),
        "- Oficial: US$ {:,.2f} (${:,.0f})".format(usd_oficial, oficial),
        "",
        "En cuotas (precio final con interes):",
    ]

    for cuotas, coef in cuotas_opciones:
        total = val * coef
        cuota = total / cuotas
        perdida_inflacion = val * ((1 + intereses) ** (cuotas / 12) - 1)
        lines.append("- {}x $ {:,.0f}/mes = $ {:,.0f} ({:.0f}% recargo)".format(cuotas, cuota, total, (coef - 1) * 100))

    lines += [
        "",
        "Comparacion contra inflacion ({:.0f}% mensual):".format(intereses * 100),
    ]
    for cuotas, coef in cuotas_opciones:
        inflacion_acum = (1 + intereses) ** (cuotas / 12) - 1
        if coef - 1 < inflacion_acum:
            lines.append("- {} cuotas: te conviene (recargo {:.1f}% < inflacion {:.1f}%)".format(cuotas, (coef - 1) * 100, inflacion_acum * 100))
        else:
            lines.append("- {} cuotas: no te conviene (recargo {:.1f}% > inflacion {:.1f}%)".format(cuotas, (coef - 1) * 100, inflacion_acum * 100))

    return "\n".join(lines)
