import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual horas_viaje_dia costo_diario_transporte [dias_semana]\n"
            "Calcula el costo real de viajar al trabajo en tiempo y dinero.\n"
            "Muestra el porcentaje del salario y de la vida que se pierde viajando.\n"
            "Ej: 500000 2 1500 5\n"
            "Ej: USD 3000 1.5 10\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (salario horas_viaje costo_transporte [dias_semana])."

    c = "USD" if is_usd else "ARS"

    raw_salary = parts[offset].upper()
    try:
        salary = float(raw_salary.replace("K", "").replace("M", ""))
        if "K" in raw_salary:
            salary *= 1000
        elif "M" in raw_salary:
            salary *= 1_000_000
        hours_daily = float(parts[offset + 1])
        daily_cost = float(parts[offset + 2].replace("K", "").replace("M", ""))
        if "K" in parts[offset + 2].upper():
            daily_cost *= 1000
        elif "M" in parts[offset + 2].upper():
            daily_cost *= 1_000_000
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    days_week = 5
    if len(parts) > offset + 3:
        try:
            days_week = float(parts[offset + 3])
        except ValueError:
            pass

    weeks_year = 48
    days_year = days_week * weeks_year
    working_years = 40
    life_expectancy_days = 80 * 365

    hours_per_month = hours_daily * days_week * 4.33
    hours_per_year = hours_daily * days_year
    hours_per_lifetime = hours_per_year * working_years

    cost_per_month = daily_cost * days_week * 4.33
    cost_per_year = daily_cost * days_year
    cost_per_lifetime = cost_per_year * working_years

    pct_salary_time = (hours_per_month / 173.33) * 100
    pct_salary_money = (cost_per_month / salary) * 100 if salary > 0 else 0
    hourly_wage = salary / 173.33 if salary > 0 else 0
    time_value_cost = hours_per_month * hourly_wage

    total_loss = cost_per_month + time_value_cost
    total_loss_pct = (total_loss / salary) * 100 if salary > 0 else 0

    time_pct_of_day = (hours_daily / 24) * 100
    time_pct_of_life = (hours_per_lifetime / life_expectancy_days) * 100

    lines = []
    lines.append(f"Viaje diario (ida+vuelta): {hours_daily:.1f} horas, {c} {daily_cost:,.0f}")
    lines.append(f"Dias por semana: {days_week:.0f}")
    lines.append("---")
    lines.append(f"TIEMPO:")
    lines.append(f"  Por mes:  {hours_per_month:.0f} horas ({pct_salary_time:.0f}% de un mes laboral)")
    lines.append(f"  Por anio: {hours_per_year:.0f} horas")
    lines.append(f"  En 40 anios: {hours_per_lifetime:.0f} horas ({time_pct_of_life:.1f}% de tu vida)")
    lines.append(f"  Eso es {hours_per_lifetime/24/365:.1f} anios enteros viajando")
    lines.append("")
    lines.append(f"DINERO:")
    lines.append(f"  Por mes:  {c} {cost_per_month:,.0f} ({pct_salary_money:.1f}% del salario)")
    lines.append(f"  Por anio: {c} {cost_per_year:,.0f}")
    lines.append(f"  En 40 anios: {c} {cost_per_lifetime:,.0f}")
    lines.append("")
    lines.append(f"COSTO DE OPORTUNIDAD:")
    lines.append(f"  Valor de tu tiempo viajando: {c} {time_value_cost:,.0f}/mes (a {c} {hourly_wage:,.0f}/hora)")
    lines.append(f"  Perdida total (plata+tiempo): {c} {total_loss:,.0f}/mes ({total_loss_pct:.0f}% del salario)")

    if not is_usd:
        blue = 1400
        lines.append("")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  Costo transporte anual: USD {cost_per_year/blue:,.0f}")
        lines.append(f"  Tiempo valorado anual: USD {time_value_cost*12/blue:,.0f}")
        lines.append(f"  Perdida total anual: USD {total_loss*12/blue:,.0f}")

    lines.append("")
    if hours_daily > 3:
        lines.append(
            "Posta: Viajas mas de 3 horas por dia. Sos un superheroe de la "
            "resistencia metropolitana. El sistema urbano esta disenado para "
            "que vivas lejos de tu laburo y pagues el viaje con tiempo y plata. "
            "No es casualidad: es planificacion urbana de clase."
        )
    elif hours_daily > 2:
        lines.append(
            "Posta: 2-3 horas diarias viajando. Estas en el promedio del area "
            "metropolitana. Perdes el equivalente a un dia laboral por semana "
            "solo en viaje. Eso son 52 dias al anio. Casi 2 meses."
        )
    elif hours_daily > 1:
        lines.append(
            "Posta: 1-2 horas diarias. Estas en el margen aceptable. "
            "Todavia podes escuchar podcasts, leer o mirar series en el viaje. "
            "El capitalismo te vende el 'tiempo productivo' como consuelo."
        )
    else:
        lines.append(
            "Posta: Menos de 1 hora diaria. O vivis al lado del laburo o "
            "trabajas remoto. En cualquiera de los dos casos: estas en el "
            "1% que no pierde la vida viajando. Disfrutalo y acordate de "
            "los que viajan 3 horas para llegar al mismo lugar que vos."
        )

    return "\n".join(lines)
