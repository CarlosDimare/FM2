import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un salario. Ej: $2M o USD3000."

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

    smvm = 380_000
    canasta_basica = 1_200_000
    canasta_ampliada = 1_700_000
    alquiler = 650_000
    expensas = 150_000
    comida = 350_000
    transporte = 80_000
    servicios = 60_000
    salud = 50_000
    total_gastos = alquiler + expensas + comida + transporte + servicios + salud
    resto = salario - total_gastos

    pct_smvm = salario / smvm * 100
    pct_cb = salario / canasta_basica * 100

    lines = [
        "=== CLASE MEDIA LIQUIDACION ===",
        "Salario: $ {:,.0f}".format(salario),
        "",
        "Gastos mensuales tipicos CABA:",
        "- Alquiler:     $ {:,.0f}".format(alquiler),
        "- Expensas:     $ {:,.0f}".format(expensas),
        "- Comida:       $ {:,.0f}".format(comida),
        "- Transporte:   $ {:,.0f}".format(transporte),
        "- Servicios:    $ {:,.0f}".format(servicios),
        "- Salud:        $ {:,.0f}".format(salud),
        "  TOTAL:        $ {:,.0f}".format(total_gastos),
        "",
        "Despues de gastar te quedan: $ {:,.0f}".format(resto),
        "Te alcanza para ahorrar? {}.".format("SI" if resto > 0 else "NO"),
        "",
        "Relacion con referencias:",
        "- {:,.0f}% del SMVM ($ {:,.0f})".format(pct_smvm, smvm),
        "- {:,.0f}% de la CBT ($ {:,.0f})".format(pct_cb, canasta_basica),
    ]

    return "\n".join(lines)
