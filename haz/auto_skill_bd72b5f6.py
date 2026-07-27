import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un monto en dolares. Ej: '171 millones USD' o '$450M'."

    m = re.search(
        r"(?:USD|u\$s|dolares?|dls?|\$)?\s*(\d+(?:[.,]\d+)?)\s*(millones?|mill?|m|billones?|b|mm|k)?",
        t, re.IGNORECASE
    )
    if not m:
        return "No entendi el monto. Usa formato como '171 millones USD' o '$450M'."

    raw = m.group(1).replace(",", "")
    suffix = (m.group(2) or "").lower().strip()
    val = float(raw)

    mult = 1
    if suffix in ("b", "billones", "billon"):
        mult = 1_000_000_000
    elif suffix in ("m", "millones", "millon", "mill", "mm"):
        mult = 1_000_000
    elif suffix == "k":
        mult = 1_000
    elif val < 10000:
        mult = 1_000_000

    usd = val * mult
    blue = 1400
    ars = usd * blue

    j = 350_000
    s_min = 380_000
    cbt = 1_200_000
    esc = 500_000_000
    hosp = 3_000_000_000
    plan = 156_000

    lines = [
        "USD {:,.0f} = $ {:,.0f} (blue $ {:,}/USD)".format(usd, ars, blue),
        "",
        "Eso alcanza para:",
        "- {:,.0f} jubilaciones minimas".format(ars / j),
        "- {:,.0f} salarios minimos vital y movil".format(ars / s_min),
        "- {:,.0f} canastas basicas totales".format(ars / cbt),
        "- {:,.0f} planes sociales mensuales".format(ars / plan),
        "- {:.1f} escuelas primarias".format(ars / esc),
        "- {:.1f} hospitales modulares".format(ars / hosp),
        "",
        "Por argentino: USD {:.2f}".format(usd / 47_000_000),
    ]

    if "holdout" in t.lower() or "buitre" in t.lower() or "fondo" in t.lower():
        ganancia = usd * 0.80
        lines += [
            "",
            "Si es pago a holdouts (compraron ~20% del valor):",
            "- Ganancia del fondo: USD {:,.0f}".format(ganancia),
            "- ROI: 300%",
            "- Con la ganancia se pagarian {:,.0f} jubilaciones minimas".format(ganancia * blue / j),
        ]

    return "\n".join(lines)
