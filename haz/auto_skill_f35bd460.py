import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un gasto hormiga mensual. Ej: '$20000 cafes' o 'USD50 Spotify'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if not nums:
        return "No entendi el gasto. Ej: '$20000 cafes'."

    val_raw = float(nums[0][0].replace(",", ""))
    suffix = nums[0][1].lower().strip() if nums[0][1] else ""

    if suffix in ("k", "mil"):
        gasto = val_raw * 1_000
    elif suffix in ("m", "millones", "mm"):
        gasto = val_raw * 1_000_000
    elif not suffix and not usd_mode and val_raw < 10000:
        gasto = val_raw * 1_000
    else:
        gasto = val_raw

    gasto_mensual = gasto
    gasto_anual = gasto_mensual * 12
    gasto_5a = gasto_anual * 5
    gasto_10a = gasto_anual * 10

    if usd_mode:
        blue = 1400
        gasto_mensual_ars = gasto_mensual * blue
        gasto_anual_ars = gasto_anual * blue
    else:
        gasto_mensual_ars = gasto_mensual

    # Labels from input
    labels = re.findall(r"(cafe|cafes|subscription|subscriptions|suscripcion|suscripciones|netflix|spotify|disney|hbo|prime|streaming|diario|diaria|yerba|pan|leche|viaje|viajes|salida|salidas|cerveza|birra|vino|delivery|pedido|propina|app|juego|juegos)",
                        t, re.IGNORECASE)
    label = labels[0].capitalize() if labels else "Este gasto"

    # Comparisons
    smvm_mensual = 380_000
    cbt_mensual = 1_200_000

    # Opportunity cost: if invested instead
    # At 3% monthly return (approx inflation-beating)
    interes_mensual = 0.03
    def valor_futuro(pmt, n):
        # Future value of monthly payments
        return pmt * ((1 + interes_mensual) ** n - 1) / interes_mensual if interes_mensual > 0 else pmt * n

    fv_1a = valor_futuro(gasto_mensual_ars, 12)
    fv_5a = valor_futuro(gasto_mensual_ars, 60)
    fv_10a = valor_futuro(gasto_mensual_ars, 120)

    months_cbt = gasto_anual_ars / cbt_mensual
    months_smvm = gasto_anual_ars / smvm_mensual
    days_per_month = 21.5
    hours_at_smvm = (gasto_mensual_ars / (smvm_mensual / (days_per_month * 8)))

    lines = [
        "=== GASTO HORMIGA ===",
        "{}: $ {:,.0f}/mes".format(label, gasto_mensual_ars),
        "",
        "Al mes: $ {:,.0f}".format(gasto_mensual_ars),
        "Al ano: $ {:,.0f}".format(gasto_anual_ars),
        "En 5 anos: $ {:,.0f}".format(gasto_5a if not usd_mode else gasto_5a * blue),
        "En 10 anos: $ {:,.0f}".format(gasto_10a if not usd_mode else gasto_10a * blue),
        "",
    ]

    # Daily equivalent
    diario = gasto_anual_ars / 365
    if diario > 1000:
        lines.append("Son $ {:,.0f}/dia. No parece mucho hasta que sumas.".format(diario))
    else:
        lines.append("Son $ {:.0f}/dia. Literalmente monedas. Pero las monedas suman.".format(diario))

    lines += [
        "",
        "Con eso podrias pagar:",
        "- {:.1f} meses de Canasta Basica al ano".format(months_cbt),
        "- {:.1f} meses de Salario Minimo al ano".format(months_smvm),
        "- Equivale a {:.1f} horas de salario minimo por mes".format(hours_at_smvm),
    ]

    # Class commentary by scale
    if gasto_mensual_ars < 50000:
        lines += [
            "",
            "Gasto chico. No te vas a hacer rico ahorrandolo,",
            "pero es el equivalente a dos docenas de facturas.",
        ]
    elif gasto_mensual_ars < 150000:
        lines += [
            "",
            "Gasto medio. Esto ya es una suscripcion que suma.",
            "En un ano son {:,.0f} meses de alquiler de un monoambiente.".format(
                gasto_anual_ars / 500_000),
        ]
    elif gasto_mensual_ars < 500000:
        lines += [
            "",
            "Gasto grande. Esto ya no es hormiga, es roedor.",
            "En 5 anos podrias tener un auto usado.",
        ]
    else:
        lines += [
            "",
            "Gasto enorme. Tu 'gasto hormiga' es el sueldo de alguien.",
            "Lo que para vos es un detalle, para otro es la jubilacion minima.",
        ]

    lines += [
        "",
        "=== COSTO DE OPORTUNIDAD ===",
    ]
    if usd_mode:
        lines += [
            "Si invertias eso al 3% mensual en USD:",
            "En 1 ano: USD {:,.2f}".format(fv_1a / blue),
            "En 5 anos: USD {:,.2f}".format(fv_5a / blue),
            "En 10 anos: USD {:,.2f}".format(fv_10a / blue),
        ]
    else:
        lines += [
            "Si invertias eso al 3% mensual:",
            "En 1 ano: $ {:,.0f}".format(fv_1a),
            "En 5 anos: $ {:,.0f}".format(fv_5a),
            "En 10 anos: $ {:,.0f}".format(fv_10a),
        ]

    lines += [
        "",
        "Pero probablemente no lo invertis porque no sobra.",
        "El verdadero lujo no es gastar: es poder ahorrar.",
    ]

    return "\n".join(lines)
