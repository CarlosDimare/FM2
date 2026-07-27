import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un precio y tu salario. Ej: '50000 800000' o 'USD200 1500' o '2M 350k'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if not nums:
        return "No entendi. Ej: '50000 800000' (precio + salario mensual)."

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

    if len(parsed) == 0:
        return "No entendi los numeros."
    price = parsed[0]
    salary = parsed[1] if len(parsed) >= 2 else 800_000

    if usd_mode:
        if price < 1000:
            price *= 1_000_000
        blue = 1400
        price_ars = price * blue
        salary_ars = salary * blue
    else:
        price_ars = price
        salary_ars = salary

    if salary_ars <= 0:
        return "Con salario cero no compras ni un caramelo."

    labor_days_month = 21.5
    labor_hours_month = labor_days_month * 8
    hourly = salary_ars / labor_hours_month
    daily = salary_ars / labor_days_month

    hours_needed = price_ars / hourly
    days_needed = price_ars / daily
    percent_salary = price_ars / salary_ars * 100

    cbt = 1_200_000
    cbt_hours = cbt / hourly

    lines = [
        "=== TIEMPO-TRABAJO ===",
        "Precio: $ {:,.0f}".format(price_ars),
        "Salario: $ {:,.0f}/mes ({:.0f} hs/mes)".format(salary_ars, labor_hours_month),
        "",
        "Te cuesta:",
        "- {:.1f} horas de laburo".format(hours_needed),
        "- {:.1f} dias de laburo".format(days_needed),
        "- {:.1f}% de tu salario mensual".format(percent_salary),
        "",
    ]

    if hours_needed <= 1:
        lines += ["Entra en menos de una hora. Cafe promedio."]
    elif hours_needed <= 8:
        lines += ["Un dia de laburo. O un finde, si sos freelance."]
    elif hours_needed <= labor_hours_month:
        lines += ["Casi medio mes laburando para esto. Que lindo es el consumo."]
    else:
        months = hours_needed / labor_hours_month
        lines += ["Te lleva {:.1f} meses de laburo. Ojala te guste.".format(months)]

    lines += [
        "",
        "=== REFERENCIA ===",
        "Canasta Basica (INDEC): $ {:,.0f}".format(cbt),
        "La CBT te lleva {:.1f} hs de tu laburo ({:.1f} dias).".format(cbt_hours, cbt_hours / 8),
    ]

    if usd_mode:
        lines += [
            "",
            "En USD (blue ${:,.0f}):".format(blue),
            "Precio: USD {:,.2f}".format(price),
            "Salario: USD {:,.2f}/mes".format(salary),
            "Tu salario anual en USD: USD {:,.2f}".format(salary * 12),
        ]

    return "\n".join(lines)
