import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_promedio participantes horas_por_reunion [reuniones_por_semana]\n"
            "Calcula el costo real de las reuniones en tiempo y plata.\n"
            "Muestra costo por reunion, por semana, por mes, por anio.\n"
            "Ej: 2500000 8 1 5\n"
            "Ej: USD 4000 6 0.5 3\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (salario_promedio participantes horas [reuniones_semana])."

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
        participants = int(float(parts[offset + 1]))
        hours = float(parts[offset + 2])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    meetings_per_week = 5
    if len(parts) >= offset + 4:
        try:
            meetings_per_week = int(float(parts[offset + 3]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400
    working_days_per_year = 240
    weeks_per_year = 48
    hours_per_month = 173.33

    hourly_cost_per_person = salary / hours_per_month
    cost_per_meeting_per_person = hourly_cost_per_person * hours
    cost_per_meeting = cost_per_meeting_per_person * participants

    meetings_per_month = meetings_per_week * 4.33
    meetings_per_year = meetings_per_week * weeks_per_year

    cost_per_week = cost_per_meeting * meetings_per_week
    cost_per_month = cost_per_meeting * meetings_per_month
    cost_per_year = cost_per_meeting * meetings_per_year

    hours_per_week_meetings = hours * meetings_per_week
    hours_per_month_meetings = hours * meetings_per_month
    hours_per_year_meetings = hours * meetings_per_year

    hours_per_year_total = participants * hours_per_year_meetings
    full_time_equivalents = hours_per_year_total / (hours_per_month * 12)

    pct_workweek = (hours_per_week_meetings / 40) * 100
    pct_salary_meetings = (cost_per_month / (salary * participants)) * 100 if salary > 0 else 0

    lines = []
    lines.append(f"COSTO DE LAS REUNIONES")
    lines.append(f"Salario promedio: {c} {salary:,.0f}")
    lines.append(f"Participantes: {participants}")
    lines.append(f"Duracion: {hours:.1f} h")
    lines.append(f"Frecuencia: {meetings_per_week} veces/semana")
    lines.append("---")
    lines.append("COSTO POR REUNION:")
    lines.append(f"  Por persona: {c} {cost_per_meeting_per_person:,.0f}")
    lines.append(f"  Total:       {c} {cost_per_meeting:,.0f}")
    lines.append("")
    lines.append("COSTO SEMANAL:")
    lines.append(f"  Tiempo: {hours_per_week_meetings:.1f} h ({pct_workweek:.0f}% de semana laboral)")
    lines.append(f"  Plata:  {c} {cost_per_week:,.0f}")
    lines.append("")
    lines.append("COSTO MENSUAL:")
    lines.append(f"  Tiempo: {hours_per_month_meetings:.1f} h")
    lines.append(f"  Plata:  {c} {cost_per_month:,.0f}")
    lines.append("")
    lines.append("COSTO ANUAL:")
    lines.append(f"  Tiempo: {hours_per_year_meetings:.0f} h")
    lines.append(f"  Plata:  {c} {cost_per_year:,.0f}")
    lines.append("")
    lines.append(f"TIEMPO TOTAL INVERTIDO (todos los participantes):")
    lines.append(f"  {hours_per_year_total:.0f} h/ano")
    lines.append(f"  = {full_time_equivalents:.1f} empleados full-time")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Por reunion:  USD {cost_per_meeting/blue:,.0f}")
        lines.append(f"  Por mes:      USD {cost_per_month/blue:,.0f}")
        lines.append(f"  Por anio:     USD {cost_per_year/blue:,.0f}")

    lines.append("")
    if pct_workweek > 50:
        lines.append(
            f"Posta: Las reuniones te ocupan el {pct_workweek:.0f}% de la "
            "semana laboral. O sos gerente o estas en una empresa que "
            "confunde 'reunirse' con 'trabajar'. Las reuniones son el "
            "mayor agujero negro de productividad del capitalismo moderno: "
            "una hora con 8 personas no es una hora, son 8 horas de "
            "salario evaporadas en una sala de conferencia discutiendo "
            "si el logo va en azul o en azul un poco mas oscuro."
        )
    elif pct_workweek > 20:
        lines.append(
            f"Posta: Entre 20 y 50% de la semana en reuniones. Estas en "
            "el rango de la 'cultura de reunion' corporativa. No es "
            "necesariamente malo si las reuniones producen decisiones. "
            "Pero la estadistica dice que el 60% del tiempo en reuniones "
            "es improductivo (fuente: estudios que nadie hizo porque "
            "estaban en una reunion). Pregunta del millon: esta reunion "
            "podria ser un mail? Si la respuesta es si, estas quemando "
            "plata."
        )
    else:
        lines.append(
            f"Posta: Menos del 20% de la semana en reuniones. O sos dev "
            "y te protegen del mal gerencial, o trabajas en una empresa "
            "que entiende que el codigo se escribe, no se discute. "
            "Disfrutalo mientras dure. Porque en cuanto llegue un "
            "nuevo PM, te van a inventar daily, weekly, retro, "
            "planning, grooming, y todas las ceremonias que el "
            "capitalismo agile invento para justificar scrum masters."
        )

    if cost_per_year > salary * 2:
        lines.append("")
        lines.append(
            "Bonus: el costo anual de tus reuniones supera el salario "
            "de un empleado mas. Basicamente estas quemando un puesto "
            "de trabajo entero en reuniones. La proxima vez que alguien "
            "diga 'contratemos a alguien para que nos ayude', recorda "
            "que ya tenes a esa persona, solo que esta en reuniones."
        )

    return "\n".join(lines)
