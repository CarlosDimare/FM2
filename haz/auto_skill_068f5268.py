import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: destino? salario_mensual dias transporte_diario alojamiento_diario comida_diaria [extras_diarios]\n"
            "Calcula presupuesto de viaje: costo total, ahorro necesario, y meses de trabajo que representa.\n"
            "Ej: 800000 7 50000 70000 35000 15000\n"
            "Ej: USD 3000 5 100 150 50 30\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 5:
        return "Error: faltan parametros (salario dias transporte alojamiento comida [extras])."

    def parse_num(s):
        s = s.upper()
        mult = 1
        if "K" in s:
            mult = 1000
            s = s.replace("K", "")
        elif "M" in s:
            mult = 1_000_000
            s = s.replace("M", "")
        return float(s) * mult

    try:
        salary = parse_num(parts[offset])
        days = int(float(parts[offset + 1]))
        transport = parse_num(parts[offset + 2])
        lodging = parse_num(parts[offset + 3])
        food = parse_num(parts[offset + 4])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    extras = 0
    if len(parts) >= offset + 6:
        extras = parse_num(parts[offset + 5])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    daily_costs = transport + lodging + food + extras
    total_cost = daily_costs * days

    daily_salary = salary / 30
    pct_daily_salary = (daily_costs / daily_salary) * 100 if daily_salary > 0 else 0
    months_of_salary = total_cost / salary if salary > 0 else 0
    days_of_work = total_cost / daily_salary if daily_salary > 0 else 0

    if days >= 7:
        weekly_discount = 0.10
        discounted_days = days
        total_with_discount = daily_costs * days * (1 - weekly_discount * (days // 7) / days) if days > 0 else total_cost
    else:
        total_with_discount = total_cost

    pct_salary_trip = (total_cost / salary) * 100 if salary > 0 else 0

    lines = []
    lines.append(f"PRESUPUESTO DE VIAJE")
    lines.append(f"Duracion: {days} dias")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append("---")
    lines.append("COSTOS DIARIOS:")
    lines.append(f"  Transporte:  {c} {transport:,.0f}")
    lines.append(f"  Alojamiento: {c} {lodging:,.0f}")
    lines.append(f"  Comida:      {c} {food:,.0f}")
    lines.append(f"  Extras:      {c} {extras:,.0f}")
    lines.append(f"  Total dia:   {c} {daily_costs:,.0f}")
    lines.append("")
    lines.append(f"COSTO TOTAL: {c} {total_cost:,.0f}")
    lines.append(f"Por dia equivale al {pct_daily_salary:.0f}% de tu salario diario")
    lines.append("")
    lines.append(f"EN TERMINOS DE TRABAJO:")
    lines.append(f"  El viaje cuesta {months_of_salary:.1f} meses de tu salario")
    lines.append(f"  = {days_of_work:.0f} dias de trabajo")

    savings_rate = 10
    months_to_save = total_cost / (salary * savings_rate / 100) if salary > 0 else 0
    lines.append("")
    lines.append(f"SI AHORRAS EL {savings_rate}% DE TU SUELDO:")
    lines.append(f"  Necesitas {months_to_save:.0f} meses de ahorro para este viaje")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Costo total: USD {total_cost/blue:,.0f}")
        lines.append(f"  Por dia:     USD {daily_costs/blue:,.0f}")
        lines.append(f"  Meses de ahorro ({savings_rate}%): {total_cost/(salary*savings_rate/100):.0f}")

    lines.append("")
    if months_of_salary > 3:
        lines.append(
            f"Posta: El viaje te cuesta MAS DE TRES MESES de sueldo. "
            "No es un viaje, es una mision de la clase media para "
            "demostrar que la vida no es solo laburar. Vas a volver "
            "y durante 3 meses vas a comer arroz con huevo para "
            "pagar las cuotas del credito que sacaste para el viaje. "
            "Pero las fotos en Instagram van a ser espectaculares."
        )
    elif months_of_salary > 1:
        lines.append(
            f"Posta: El viaje te cuesta entre 1 y 3 meses de salario. "
            "El clasico de la clase media argentina: un viaje al ano "
            "que te deja en cero pero te da tema de conversacion "
            "hasta el proximo. El capitalismo te vende la experiencia "
            "como inversion y la deuda como costo. Spoiler: la "
            "experiencia no paga las cuotas del resumen."
        )
    elif months_of_salary > 0.5:
        lines.append(
            f"Posta: Menos de un mes de salario. Un viaje accesible "
            "para tu nivel de ingresos. No es Europa, probablemente "
            "sea la costa, Cordoba, o algun destino regional. La "
            "clase media argentina viaja en micro, alquila algo "
            "modesto y come asados en lugar de restaurantes. Y "
            "la pasa igual de bien que el que gasta 5 veces mas."
        )
    else:
        lines.append(
            f"Posta: Menos de medio mes de sueldo. Esto no es un "
            "viaje, es un finde largo. O tenes un muy buen sueldo "
            "o el destino esta a dos cuadras de tu casa. En cualquier "
            "caso, bien ahi: vacaciones accesibles son el privilegio "
            "de los que ganan bien. El resto hace de cuenta que "
            "trabajar desde casa es 'staycation'."
        )

    return "\n".join(lines)
