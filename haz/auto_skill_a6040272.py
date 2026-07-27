import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone ingreso total y cuantos son. Ej: '$1.2M 2 adultos 1 nino' o 'USD2000 1 adulto'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if not nums:
        return "No entendi. Ej: '$1.2M 2 adultos 1 nino'."

    income_raw = float(nums[0][0].replace(",", ""))
    suffix = nums[0][1].lower().strip() if nums[0][1] else ""

    if suffix in ("k", "mil"):
        income = income_raw * 1_000
    elif suffix in ("m", "millones", "mm"):
        income = income_raw * 1_000_000
    elif not suffix and not usd_mode and income_raw < 10000:
        income = income_raw * 1_000
    else:
        income = income_raw

    adultos = 1
    ninos = 0

    ad = re.search(r"(\d+)\s*(adulto|adultos|mayor|mayores|grande|persona)", t, re.IGNORECASE)
    if ad:
        adultos = int(ad.group(1))

    ni = re.search(r"(\d+)\s*(nino|ninos|nina|ninas|chico|chicos|menor|menores|hijo|hijos)", t, re.IGNORECASE)
    if ni:
        ninos = int(ni.group(1))

    if adultos < 1:
        adultos = 1

    if usd_mode:
        if income < 1000:
            income *= 1_000_000
        blue = 1400
        income_ars = income * blue
    else:
        income_ars = income

    # INDEC CBT values (approximate mid-2026 for CABA)
    cbt_adulto = 380_000
    cbt_menor = 305_000

    # Equivalencias INDEC: adulto=1, cada menor~0.8
    equivalente = adultos + ninos * 0.8
    canasta_hogar = cbt_adulto * adultos + cbt_menor * ninos
    canasta_equivalente = cbt_adulto * equivalente

    # Indigencia (canasta alimentaria) ~ 55% de la CBT
    indigencia_hogar = canasta_hogar * 0.55

    relacion = income_ars / canasta_hogar

    lines = [
        "=== UMBRALES SOCIALES ===",
        "Hogar: {} adulto(s), {} nino(s)".format(adultos, ninos),
        "Ingreso: $ {:,.0f}/mes".format(income_ars),
        "",
        "Canasta Basica Total (CBT): $ {:,.0f}/mes".format(canasta_hogar),
        "Canasta Alimentaria (indigencia): $ {:,.0f}/mes".format(indigencia_hogar),
        "Tu ingreso es {:.2f}x la CBT de tu hogar.".format(relacion),
        "",
    ]

    if relacion < 0.5:
        lines += [
            "Debajo de la mitad de la CBT. Indigencia.",
            "No llegas a comer. Esto no es clase baja, es emergencia.",
        ]
    elif relacion < 1:
        deficit = canasta_hogar - income_ars
        lines += [
            "Debajo de la CBT. Pobre segun INDEC.",
            "Te faltan $ {:,.0f}/mes para cubrir lo basico.".format(deficit),
            "Si el INDEC dice que sos pobre, sos pobre.",
            "No importa si 'llegas a fin de mes' porque no llegas.",
        ]
    elif relacion < 1.5:
        lines += [
            "Entre 1x y 1.5x la CBT. No sos pobre (segun INDEC).",
            "Pero un impuesto, un resfrio o un arreglo del auto te tira abajo.",
            "Clase media vulnerable. La mas grande de Argentina.",
        ]
    elif relacion < 2.5:
        lines += [
            "Entre 1.5x y 2.5x la CBT. Clase media tradicional.",
            "Llegas, ahorras poco, y cualquier crisis te corre dos casilleros.",
        ]
    elif relacion < 4:
        lines += [
            "Entre 2.5x y 4x la CBT. Clase media acomodada.",
            "Llegas bien, ahorras algo, pero un alquiler en CABA te come la mitad.",
        ]
    else:
        lines += [
            "Mas de 4x la CBT. Estas en el 10% de arriba.",
            "No sos rico, pero estas comodo. No te acostumbres.",
        ]

    if usd_mode:
        lines += [
            "",
            "En USD (blue ${:,.0f}):".format(blue),
            "Ingreso: USD {:,.2f}/mes".format(income),
            "CBT del hogar: USD {:,.2f}/mes".format(canasta_hogar / blue),
            "Indigencia: USD {:,.2f}/mes".format(indigencia_hogar / blue),
        ]

    return "\n".join(lines)
