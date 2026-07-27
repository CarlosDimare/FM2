import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu sueldo. Ej: '$2M' o 'USD3000'."

    m = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|usd|dolares)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el sueldo."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    usd_mode = "usd" in t.lower()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    bruto = val * (1_400 if usd_mode else 1)

    # Deductions approx
    jubilacion = bruto * 0.11
    obra_social = bruto * 0.03
    pami = bruto * 0.03
    sindicato = bruto * 0.02
    total_deducciones = jubilacion + obra_social + pami + sindicato
    neto = bruto - total_deducciones

    # Employer cost
    contribuciones = bruto * 0.28  # employer contributions approx
    costo_empleador = bruto + contribuciones

    lines = [
        "=== RECIBO SIMULADO ===",
        "Bruto:     $ {:,.0f}".format(bruto),
        "",
        "Deducciones:",
        "- Jubilacion (11%):   $ {:,.0f}".format(jubilacion),
        "- Obra social (3%):   $ {:,.0f}".format(obra_social),
        "- PAMI (3%):          $ {:,.0f}".format(pami),
        "- Sindicato (2%):     $ {:,.0f}".format(sindicato),
        "- Total deduc.:       $ {:,.0f}".format(total_deducciones),
        "",
        "Neto a cobrar: $ {:,.0f}".format(neto),
        "",
        "Costo empleador: $ {:,.0f}".format(costo_empleador),
        "Diferencia: $ {:,.0f} ({:.0f}%)".format(costo_empleador - neto, (costo_empleador - neto) / neto * 100),
    ]

    return "\n".join(lines)
