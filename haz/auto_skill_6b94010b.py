import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un precio de propiedad y el alquiler mensual. Ej: 'USD100000 alquiler USD500'"

    m_precio = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    m_alquiler = re.search(r"alquiler\s*(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)

    if not m_precio or not m_alquiler:
        return "No entendi. Pone 'USD100000 alquiler USD500' o '$50M alquiler $300000'"

    precio = float(m_precio.group(1).replace(",", ""))
    s = (m_precio.group(2) or "").lower().strip()
    usd = "usd" in t.lower() or "u$s" in t.lower()
    if s in ("k", "mil"):
        precio *= 1_000
    elif s in ("m", "millones"):
        precio *= 1_000_000

    alquiler = float(m_alquiler.group(1).replace(",", ""))
    s2 = (m_alquiler.group(2) or "").lower().strip()
    if s2 in ("k", "mil"):
        alquiler *= 1_000
    elif s2 in ("m", "millones"):
        alquiler *= 1_000_000

    # Basic inputs in ARS
    if usd:
        precio_ars = precio * 1400
        alquiler_ars = alquiler * 1400
    else:
        precio_ars = precio
        alquiler_ars = alquiler

    anios_alquiler_equivale = precio_ars / (alquiler_ars * 12) if alquiler_ars else 0

    # Credit simulation (30 years, fixed rate, nominal)
    tasa = 0.08  # 8% annual
    plazo_anios = 30
    cuota_mensual = precio_ars * (tasa / 12) * (1 + tasa / 12) ** (plazo_anios * 12) / ((1 + tasa / 12) ** (plazo_anios * 12) - 1)
    total_credit = cuota_mensual * 12 * plazo_anios
    interes_total = total_credit - precio_ars

    lines = [
        "=== ALQUILAR VS COMPRAR ===",
        "Propiedad: {:,.0f} (USD {:,.0f})".format(precio_ars, precio_ars / 1400) if usd else "Propiedad: $ {:,.0f}".format(precio_ars),
        "Alquiler:  {:,.0f}/mes (USD {:,.0f})".format(alquiler_ars, alquiler_ars / 1400) if usd else "Alquiler: $ {:,.0f}/mes".format(alquiler_ars),
        "",
        "Alquilando (sin ajuste):",
        "- Equivale a comprar: {:.1f} anos de alquiler".format(anios_alquiler_equivale),
        "- En 30 anos gastas: $ {:,.0f}".format(alquiler_ars * 12 * 30),
        "",
        "Comprando (credito hipotecario {:.0f}%/{:.0f} anos):".format(tasa * 100, plazo_anios),
        "- Cuota mensual: $ {:,.0f}".format(cuota_mensual),
        "- Total pagado: $ {:,.0f}".format(total_credit),
        "- Intereses: $ {:,.0f}".format(interes_total),
        "",
    ]

    if cuota_mensual < alquiler_ars:
        lines.append("La cuota es menor que el alquiler. Con vivienda unica te conviene comprar.")
    else:
        diff = cuota_mensual - alquiler_ars
        lines.append("La cuota es $ {:,.0f} mas cara que el alquiler.".format(diff))

    return "\n".join(lines)
