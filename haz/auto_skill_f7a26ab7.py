import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone precio de propiedad y tu ahorro mensual. Ej: 'USD100000 $200k' o '80M 500k'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if len(nums) < 2:
        return "Necesito el precio y tu ahorro mensual. Ej: 'USD100000 $200k'."

    parsed = []
    for val_str, suffix in nums:
        val = float(val_str.replace(",", ""))
        s = suffix.lower().strip() if suffix else ""
        if s in ("k", "mil"):
            val *= 1_000
        elif s in ("m", "millones", "mm"):
            val *= 1_000_000
        elif not s and not usd_mode and val < 10000:
            val *= 1_000
        parsed.append(val)

    prop = parsed[0]
    savings = parsed[1] if len(parsed) >= 2 else 200_000

    if usd_mode:
        if prop < 10000:
            prop *= 1_000_000
        blue = 1400
        prop_ars = prop * blue
        savings_ars = savings * blue
    else:
        prop_ars = prop
        savings_ars = savings

    if savings_ars <= 0:
        return "Si no ahorras, la propiedad se compra sola? Avísame cuando encuentres la formula."

    years = prop_ars / savings_ars / 12
    months = prop_ars / savings_ars

    smvm = 380_000
    cbt = 1_200_000
    años_smvm = prop_ars / (smvm * 12)
    años_cbt = prop_ars / (cbt * 12)

    lines = [
        "=== SUEÑO PROPIO ===",
        "Propiedad: $ {:,.0f}".format(prop_ars),
        "Ahorro mensual: $ {:,.0f}/mes".format(savings_ars),
        "",
        "Te lleva:",
        "- {:.0f} meses de ahorro".format(months),
        "- {:.1f} años de ahorro".format(years),
    ]

    if years < 1:
        lines += ["En menos de un año la tenes. O sos Gardel o te regalaron la plata."]
    elif years < 3:
        lines += ["Entre 1 y 3 años. Bajita la pelota, clase media alta."]
    elif years < 10:
        lines += ["Una decada ahorrando. Alcanza si no se te rompe el lavarropas ni se dispara el dolar."]
    elif years < 30:
        lines += ["Te lleva {:.0f} años. Te recibis, laburas, te jubilas, y a los 65 la pagas.".format(years)]
    else:
        lines += ["{:.0f} años. Ni en cuotas. Mejor alquila y comprate un fideo.".format(years)]

    lines += [
        "",
        "=== COMPARATIVA CLASE ===",
        "Con un Salario Minimo ($ {:,.0f}/mes): {:.0f} años".format(smvm, años_smvm),
        "Con una Canasta Basica ($ {:,.0f}/mes): {:.0f} años".format(cbt, años_cbt),
    ]

    if usd_mode:
        lines += [
            "",
            "En USD (blue ${:,.0f}):".format(blue),
            "Propiedad: USD {:,.2f}".format(prop),
            "Ahorro: USD {:,.2f}/mes".format(savings),
        ]

    return "\n".join(lines)
