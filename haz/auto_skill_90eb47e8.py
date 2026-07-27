import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone ahorro y gasto mensual. Ej: 'ahorro $2M, gasto $500k/mes' o 'savings USD5000, monthly USD1500'."

    m_ahorro = re.search(
        r"(?:ahorro|savings|tengo|fondo)\s*(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|millones|m(?!\w)|usd|dolares)?",
        t, re.IGNORECASE
    )
    m_gasto = re.search(
        r"(?:gasto|cost|monthly|gasta)\s*(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|millones|m(?!\w)|usd|dolares)?",
        t, re.IGNORECASE
    )
    if not m_ahorro or not m_gasto:
        return "No entendi. Pone 'ahorro $X, gasto $Y/mes'."

    def parse(m, text):
        val = float(m.group(1).replace(",", ""))
        s = (m.group(2) or "").lower().strip()
        if s in ("k", "mil"):
            val *= 1_000
        elif s in ("m", "millones"):
            val *= 1_000_000
        return val

    ahorro = parse(m_ahorro, t)
    gasto = parse(m_gasto, t)

    usd_mode = "usd" in t.lower()

    if gasto <= 0:
        return "El gasto tiene que ser mayor a cero."

    meses = ahorro / gasto

    if meses < 0.5:
        estado = "ROJO: si perdes el ingreso hoy, no llegas al finde."
    elif meses < 1:
        estado = "ROJO CLARO: llegas justo al fin de mes y arafue."
    elif meses < 3:
        estado = "AMARILLO: aguantas un trimestre. Actualiza el CV ya."
    elif meses < 6:
        estado = "NARANJA: medio ano de colchon. Busca con calma."
    elif meses < 12:
        estado = "VERDE: un ano entero. Podes hasta darte el lujo de renunciar."
    else:
        estado = "AZUL: mas de un ano. Sos privilegiado. No lo gastes en cuotas sin interes."

    lines = [
        "=== INDEPENDENCIA PRECARIA ===",
        "Ahorro:   $ {:,.0f}".format(ahorro),
        "Gasto:    $ {:,.0f}/mes".format(gasto),
        "Meses:    {:.1f}".format(meses),
        "",
        "Status: " + estado,
    ]

    return "\n".join(lines)
