import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual alquiler expensas servicios comida [USD]\n"
            "Compara el costo de vivir solo vs compartir gastos.\n"
            "Ej: 500000 200000 50000 30000 120000\n"
            "Ej: USD 2000 800 100 50 300\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 5:
        return "Error: faltan parametros (salario alquiler expensas servicios comida)."

    raw = {}
    labels = ["salario", "alquiler", "expensas", "servicios", "comida"]
    try:
        for i, label in enumerate(labels):
            r = parts[offset + i].upper()
            v = float(r.replace("K", "").replace("M", ""))
            if "K" in r:
                v *= 1000
            elif "M" in r:
                v *= 1_000_000
            raw[label] = v
    except (ValueError, IndexError):
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"
    salary = raw["salario"]
    rent = raw["alquiler"]
    expenses = raw["expensas"]
    utilities = raw["servicios"]
    food = raw["comida"]

    total_alone = rent + expenses + utilities + food

    shared_2_rent = rent * 0.5
    shared_2_expenses = expenses * 0.5
    shared_2_utilities = utilities * 0.5
    shared_2_food = food * 0.5
    total_shared_2 = shared_2_rent + shared_2_expenses + shared_2_utilities + shared_2_food

    shared_3_rent = rent * 0.35
    shared_3_expenses = expenses * 0.35
    shared_3_utilities = utilities * 0.35
    shared_3_food = food * 0.35
    total_shared_3 = shared_3_rent + shared_3_expenses + shared_3_utilities + shared_3_food

    pct_alone = (total_alone / salary) * 100
    pct_shared_2 = (total_shared_2 / salary) * 100
    pct_shared_3 = (total_shared_3 / salary) * 100

    savings_2 = total_alone - total_shared_2
    savings_3 = total_alone - total_shared_3

    lines = []
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append("---")
    lines.append(f"VIVIR SOLO:")
    lines.append(f"  Alquiler:      {c} {rent:,.0f}")
    lines.append(f"  Expensas:      {c} {expenses:,.0f}")
    lines.append(f"  Servicios:     {c} {utilities:,.0f}")
    lines.append(f"  Comida:        {c} {food:,.0f}")
    lines.append(f"  TOTAL:         {c} {total_alone:,.0f} ({pct_alone:.0f}% del salario)")
    lines.append("---")
    lines.append(f"VIVIR CON 1 PERSONA (50% cada uno):")
    lines.append(f"  TOTAL:         {c} {total_shared_2:,.0f} ({pct_shared_2:.0f}% del salario)")
    lines.append(f"  Ahorro mensual: {c} {savings_2:,.0f}")
    lines.append(f"  Ahorro anual:   {c} {savings_2*12:,.0f}")
    lines.append("---")
    lines.append(f"VIVIR CON 2 PERSONAS (~35% cada uno):")
    lines.append(f"  TOTAL:         {c} {total_shared_3:,.0f} ({pct_shared_3:.0f}% del salario)")
    lines.append(f"  Ahorro mensual: {c} {savings_3:,.0f}")
    lines.append(f"  Ahorro anual:   {c} {savings_3*12:,.0f}")

    if not is_usd:
        blue = 1400
        lines.append("")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  Solo:     USD {total_alone/blue:,.0f}/mes")
        lines.append(f"  Compartido(2): USD {total_shared_2/blue:,.0f}/mes (ahorro USD {savings_2/blue:,.0f})")
        lines.append(f"  Compartido(3): USD {total_shared_3/blue:,.0f}/mes (ahorro USD {savings_3/blue:,.0f})")

    lines.append("")
    if pct_alone > 70:
        lines.append(
            "Posta: Vivir solo te come mas del 70% del sueldo. Sos un caso "
            "de 'superviviente del alquiler'. El capitalismo inmobiliario "
            "te cobra el derecho a existir. Compartir no es opcion: "
            "es la unica forma de no morir en el intento."
        )
    elif pct_alone > 50:
        lines.append(
            "Posta: Vivir solo te come entre 50-70% del sueldo. Estas en "
            "la categoria 'me alcanza justo'. Cualquier gasto imprevisto "
            "te manda al rojo. Compartir te daria aire para respirar "
            "(literalmente, si la comida sale mas barata)."
        )
    elif pct_alone > 30:
        lines.append(
            "Posta: Vivir solo te come 30-50%. Estas en la categoria "
            "'clase media tirando'. Podes ahorrar un poco, pero no te "
            "entusiasmes: un aumento del alquiler y estas en la otra categoria."
        )
    else:
        lines.append(
            "Posta: Vivir solo te come menos del 30%. O ganas muy bien "
            "o vivis en un monoambiente sin expensas. En cualquiera de "
            "los dos casos: disfrutalo mientras puedas. El mercado "
            "inmobiliario siempre ajusta."
        )

    return "\n".join(lines)
