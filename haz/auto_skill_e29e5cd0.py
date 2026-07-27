import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: fecha_inicio(dd/mm/aaaa) fecha_fin(dd/mm/aaaa)\n"
            "Calcula la diferencia entre dos fechas.\n"
            "Muestra dias, semanas, meses, anos, y laborales entre ambas.\n"
            "Ej: 01/01/2026 25/05/2026\n"
            "Ej: 20/11/2025 31/12/2026"
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: necesitas dos fechas en formato dd/mm/aaaa."

    def parse_date(s):
        s = s.strip()
        if "/" in s:
            d, m, y = s.split("/")
            return int(y), int(m), int(d)
        elif "-" in s:
            parts_d = s.split("-")
            if len(parts_d) == 3:
                if len(parts_d[0]) == 4:
                    return int(parts_d[0]), int(parts_d[1]), int(parts_d[2])
                else:
                    return int(parts_d[2]), int(parts_d[1]), int(parts_d[0])
        return None

    def days_in_month(y, m):
        if m in (1, 3, 5, 7, 8, 10, 12):
            return 31
        if m in (4, 6, 9, 11):
            return 30
        if y % 4 == 0 and (y % 100 != 0 or y % 400 == 0):
            return 29
        return 28

    def to_days(y, m, d):
        total = 0
        for yy in range(1, y):
            total += 366 if (yy % 4 == 0 and (yy % 100 != 0 or yy % 400 == 0)) else 365
        for mm in range(1, m):
            total += days_in_month(y, mm)
        total += d
        return total

    d1 = parse_date(parts[0])
    d2 = parse_date(parts[1])

    if not d1 or not d2:
        return "Error: formato de fecha invalido. Use dd/mm/aaaa."

    y1, m1, d1d = d1
    y2, m2, d2d = d2

    days1 = to_days(y1, m1, d1d)
    days2 = to_days(y2, m2, d2d)
    diff = abs(days2 - days1)

    years_diff = abs(y2 - y1)
    months_diff = abs((y2 * 12 + m2) - (y1 * 12 + m1))
    weeks_diff = diff // 7
    days_remainder = diff % 7

    weekdays = 0
    d = min(days1, days2)
    end = max(days1, days2)
    for dd in range(d, end + 1):
        dow = (dd + 3) % 7
        if 1 <= dow <= 5:
            weekdays += 1

    pct_year = (diff / 365) * 100 if diff > 0 else 0

    months_full = diff // 30
    days_extra = diff % 30

    feriados_aprox = weekdays // 30

    lines = []
    lines.append("DIFERENCIA ENTRE FECHAS")
    lines.append(f"  {d1d:02d}/{m1:02d}/{y1}  a  {d2d:02d}/{m2:02d}/{y2}")
    lines.append("---")
    lines.append(f"Dias totales:      {diff}")
    lines.append(f"Semanas:           {weeks_diff} semanas y {days_remainder} dias")
    lines.append(f"Meses:             {months_diff} meses")
    lines.append(f"Meses (30d):       {months_full} meses y {days_extra} dias")
    lines.append(f"Anios:             {years_diff} anios")
    lines.append(f"Porcentaje del anio: {pct_year:.1f}%")
    lines.append("")
    lines.append(f"Dias laborales (lun-vie): {weekdays}")
    lines.append(f"Fines de semana:           {diff - weekdays}")
    lines.append(f"Feriados aprox. en periodo: ~{feriados_aprox}")
    lines.append("")
    lines.append("EQUIVALENCIAS:")
    if diff >= 365:
        lines.append(f"  {years_diff} anios es:")
        lines.append(f"    {months_diff} meses")
        lines.append(f"    {weeks_diff} semanas")
        lines.append(f"    {diff * 24} horas")
        lines.append(f"    {diff * 24 * 60} minutos")
    elif diff >= 30:
        lines.append(f"  {months_diff} meses es:")
        lines.append(f"    {weeks_diff} semanas")
        lines.append(f"    {diff} dias")
        lines.append(f"    {diff * 24} horas")
    elif diff >= 7:
        lines.append(f"  {weeks_diff} semanas y {days_remainder} dias")
        lines.append(f"    = {diff} dias")
        lines.append(f"    = {diff * 24} horas")
    else:
        lines.append(f"  {diff} dias")
        if diff > 0:
            lines.append(f"    = {diff * 24} horas")
            lines.append(f"    = {diff * 24 * 60} minutos")

    today_d = to_days(2026, 6, 23)
    if days1 <= today_d <= days2 or days2 <= today_d <= days1:
        remaining = abs(days2 - today_d) if today_d < days2 else abs(days1 - today_d)
        lines.append("")
        lines.append(f"Nota: Hoy (23/06/2026) esta dentro del periodo.")
        lines.append(f"  Quedan {remaining} dias hasta la fecha mas lejana.")

    return "\n".join(lines)
