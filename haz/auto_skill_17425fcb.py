import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un salario y un alquiler. Ej: '$2M alquiler $500k' o 'USD3000 USD800'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if len(nums) < 2:
        return "Necesito salario y alquiler. Ej: '$2M alquiler $500k'."

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

    salary = parsed[0]
    rent = parsed[1]

    if usd_mode:
        if salary < 1000:
            salary *= 1_000_000
        if rent < 10:
            rent *= 1_000_000
        elif rent < 1000:
            rent *= 1_000
        blue = 1400
        salary_ars = salary * blue
        rent_ars = rent * blue
    else:
        salary_ars = salary
        rent_ars = rent

    if salary_ars <= 0:
        return "Con salario cero vivis debajo de un puente. Sin cargo extra."

    pct = rent_ars / salary_ars * 100
    remaining = salary_ars - rent_ars
    ideal_max = salary_ars * 0.30
    diff = ideal_max - rent_ars

    cbt = 1_200_000
    smvm = 380_000

    lines = [
        "=== ALQUILER vs SALARIO ===",
        "Salario: $ {:,.0f}/mes".format(salary_ars),
        "Alquiler: $ {:,.0f}/mes".format(rent_ars),
        "",
        "El alquiler se come el {:.1f}% de tu ingreso.".format(pct),
    ]

    if pct <= 20:
        lines += [
            "Debajo del 20%. O alquilas en el interior o vivis con 4 roommates.",
            "Te sobran $ {:,.0f}/mes para el resto.".format(remaining),
        ]
    elif pct <= 30:
        lines += [
            "Entre 20-30%. Esta dentro del margen recomendado (que inventaron los bancos",
            "para prestarte plata, no para que vivas bien).",
            "Te sobran $ {:,.0f}/mes.".format(remaining),
        ]
    elif pct <= 50:
        lines += [
            "Entre 30-50%. Ya estas en zona de riesgo. Si se rompe un diente,",
            "elegis entre el dentista y el mes que viene.",
            "Te excedes por $ {:,.0f}/mes del 30% recomendado.".format(abs(diff)),
        ]
    elif pct <= 70:
        lines += [
            "Entre 50-70%. La mitad de tu sueldo es de tu casero.",
            "El resto es para sobrevivir. No ahorras, no viajas, no existis.",
            "Te excedes por $ {:,.0f}/mes del 30% recomendado.".format(abs(diff)),
        ]
    else:
        lines += [
            "Mas del 70%. Basicamente laburas para que otro tenga un techo.",
            "Si sos propietario, reí. Si sos inquilino, abrazate fuerte.",
            "Te quedan $ {:,.0f}/mes para TODO lo demas.".format(remaining),
        ]

    lines += [
        "",
        "=== COMPARATIVA ===",
        "Tu alquiler equivale a:",
        "- {:.1f}x Salario Minimo ($ {:,.0f})".format(rent_ars / smvm, smvm),
        "- {:.1f}x Canasta Basica ($ {:,.0f})".format(rent_ars / cbt, cbt),
    ]

    if rent_ars > cbt:
        lines += [
            "",
            "Tu alquiler solo es mas caro que la canasta basica de una familia.",
            "No es un techo, es un lujo que te pagan para tenerlo.",
        ]
    elif rent_ars > smvm:
        lines += [
            "",
            "Alquilas por mas de un salario minimo. La clase media es un",
            "alquiler que todavia podes pagar. Hasta que no puedas.",
        ]

    return "\n".join(lines)
