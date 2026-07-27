import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return (
            "Pone un salario y un gasto fijo con etiqueta. "
            "Ej: '$2M alquiler $500k' o 'USD3000 expensas USD200' o '$1.5M comida 300k'."
        )

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    labels = re.findall(r"(alquiler|comida|expensas|servicios|internet|celu|transporte|seguro|educacion|colegio|salud|obra\s?social|gym|netflix|spotify|streaming|suscripcion|tarjeta|cuota|auto|nafta|credito|deuda|salario|sueldo|ingreso)",
                        t, re.IGNORECASE)

    if len(nums) < 2:
        return "Necesito al menos tu ingreso y un gasto. Ej: '$2M alquiler $500k'."

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
    expenses = parsed[1:]

    if usd_mode:
        if salary < 1000:
            salary *= 1_000_000
        expenses = [e * 1_000_000 if e < 1000 else e for e in expenses]
        blue = 1400
        salary_ars = salary * blue
        expenses_ars = [e * blue for e in expenses]
    else:
        salary_ars = salary
        expenses_ars = expenses

    total_expenses = sum(expenses_ars)
    remaining = salary_ars - total_expenses
    ratio = total_expenses / salary_ars * 100 if salary_ars > 0 else 0

    salary_cbt = salary_ars / 1_200_000
    remaining_cbt = remaining / 1_200_000 if remaining > 0 else remaining / 1_200_000

    lines = [
        "=== RADIOGRAFIA MENSUAL ===",
        "Ingreso: $ {:,.0f}".format(salary_ars),
        "",
    ]

    if labels:
        lines.append("Gastos detectados:")
        for i, label in enumerate(labels):
            if i < len(expenses_ars) - 1:
                idx = i + 1 if (len(labels) == len(expenses_ars) or (i == len(labels) - 1 and len(labels) < len(expenses_ars))) else i
            val = expenses_ars[i] if i < len(expenses_ars) else 0
            if val > 0:
                pct = val / salary_ars * 100
                lines.append("- {}: $ {:,.0f} ({:.1f}%)".format(
                    label.capitalize(), val, pct))

    lines += [
        "",
        "Total gastos: $ {:,.0f}".format(total_expenses),
        "Restante: $ {:,.0f}".format(remaining),
        "Carga: {:.1f}% del ingreso".format(ratio),
    ]

    if remaining <= 0:
        lines += [
            "",
            "No sobra nada. Bienvenido al club de los que laburan para pagar cuentas.",
            "Tu ingreso equivale a {:.1f}x la CBT pero no llegas a fin de mes.".format(salary_cbt),
        ]
    elif remaining < salary_ars * 0.1:
        lines += [
            "",
            "Te sobra menos del 10%. Un impuestito, un arreglo del auto o un resfriado",
            "y estas en negativo. La clase media respira por aparatos.",
        ]
    elif remaining < salary_ars * 0.3:
        lines += [
            "",
            "Te sobra algo. No te emociones: una expensa extraordinaria te lo borra.",
        ]
    else:
        holiday_months = remaining / (salary_ars * 0.5)
        lines += [
            "",
            "Te sobra mas del 30%. O ganas muy bien o subestimaste tus gastos.",
            "Con ese excedente te pagan {:.1f} meses de jubilacion minima.".format(
                remaining / 380_000),
        ]

    lines += [
        "",
        "=== COMPARATIVA ===",
        "CBT (INDEC): $ 1,200,000",
        "Tu ingreso: {:.2f}x CBT".format(salary_cbt),
    ]

    if remaining > 0:
        lines.append("Despues de gastos: {:.2f}x CBT".format(remaining_cbt))

    return "\n".join(lines)
