import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: fecha_nacimiento(dd/mm/aaaa)\n"
            "Calcula tu edad exacta en anios, meses, dias, horas,\n"
            "minutos y segundos. Muestra tu generacion y\n"
            "cuantos dias de vida llevas.\n"
            "Ej: 15/04/1990\n"
            "Ej: 01/01/2000"
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: falta la fecha de nacimiento (dd/mm/aaaa)."

    try:
        d, m, y = parts[0].split("/")
        bday = int(d)
        bmonth = int(m)
        byear = int(y)
    except (ValueError, IndexError):
        return "Error: formato invalido. Use dd/mm/aaaa."

    cyear = 2026
    cmonth = 6
    cday = 23

    if byear > cyear or (byear == cyear and bmonth > cmonth) or (byear == cyear and bmonth == cmonth and bday > cday):
        return "Error: la fecha de nacimiento es futura."

    def days_in_month(yr, mo):
        if mo in (1, 3, 5, 7, 8, 10, 12):
            return 31
        if mo in (4, 6, 9, 11):
            return 30
        if yr % 4 == 0 and (yr % 100 != 0 or yr % 400 == 0):
            return 29
        return 28

    def to_days(yr, mo, dy):
        total = 0
        for yy in range(1, yr):
            total += 366 if (yy % 4 == 0 and (yy % 100 != 0 or yy % 400 == 0)) else 365
        for mm in range(1, mo):
            total += days_in_month(yr, mm)
        total += dy
        return total

    birth_days = to_days(byear, bmonth, bday)
    today_days = to_days(cyear, cmonth, cday)
    total_days = today_days - birth_days

    years = cyear - byear
    if (cmonth, cday) < (bmonth, bday):
        years -= 1

    if cmonth >= bmonth and cday >= bday:
        months = cmonth - bmonth
        days = cday - bday
    elif cmonth > bmonth:
        months = cmonth - bmonth - 1
        prev_month = cmonth - 1
        prev_max = days_in_month(cyear, prev_month) if prev_month > 0 else 31
        days = prev_max - bday + cday
    else:
        months = 12 - (bmonth - cmonth)
        if cday < bday:
            months -= 1
            prev_max = days_in_month(cyear, cmonth - 1 if cmonth > 1 else 12)
            days = prev_max - bday + cday
        else:
            days = cday - bday

    total_hours = total_days * 24
    total_minutes = total_hours * 60
    total_seconds = total_minutes * 60

    if years < 12:
        generacion = "Alpha"
    elif years < 27:
        generacion = "Gen Z"
    elif years < 43:
        generacion = "Millennial"
    elif years < 59:
        generacion = "Gen X"
    elif years < 78:
        generacion = "Baby Boomer"
    else:
        generacion = "Silenciosa / Grandes"

    avg_life = 76
    remaining = avg_life - years
    pct_lived = (years / avg_life) * 100 if avg_life > 0 else 0

    equiv_viajes = []
    distances = [
        ("CABA a Cordoba", 700),
        ("CABA a Bariloche", 1600),
        ("CABA a Ushuaia", 3100),
        ("Tierra del fuego a Alaska", 20000),
        ("vuelta al mundo", 40000),
        ("a la luna", 384400),
    ]
    for name, km in distances:
        cant = total_days * 20 / km
        if cant >= 0.1:
            equiv_viajes.append((name, cant))

    lines = []
    lines.append("TU EDAD EXACTA")
    lines.append(f"Naciste: {bday:02d}/{bmonth:02d}/{byear}")
    lines.append(f"Hoy:     {cday:02d}/{cmonth:02d}/{cyear}")
    lines.append("---")
    lines.append(f"Anios:     {years}")
    lines.append(f"Meses:     {years*12 + months}")
    lines.append(f"Dias:      {total_days:,}")
    lines.append(f"Horas:     {total_hours:,}")
    lines.append(f"Minutos:   {total_minutes:,}")
    lines.append(f"Segundos:  {total_seconds:,}")
    lines.append("")
    lines.append(f"Generacion: {generacion}")
    lines.append(f"Ya viviste el {pct_lived:.1f}% de tu esperanza de vida ({avg_life} anios)")
    if remaining > 0:
        lines.append(f"Te quedan aprox. {remaining} anios")
    lines.append("")
    lines.append("SI CAMINASTE 20 KM/DIA EN PROMEDIO:")
    for name, cant in equiv_viajes[:5]:
        if cant >= 1:
            lines.append(f"  {cant:.0f} x {name}")
        elif cant >= 0.1:
            lines.append(f"  {cant:.1f} x {name}")
    lines.append("")
    lines.append(f"LATIDOS DEL CORAZON (estimado 80 lpm):")
    lines.append(f"  {total_minutes * 80:,} latidos")
    lines.append("")
    if years < 18:
        lines.append(
            "Todavia no llegaste a la mayoria de edad. Disfruta "
            "no tener que pagar impuestos ni pensar en la jubilacion. "
            "La clase trabajadora arranca a los 18 y no para hasta "
            "los 65. O hasta que el cuerpo aguante. Tu infancia "
            "es el unico periodo de tu vida donde el tiempo no "
            "es dinero. Despues, todo se mide en facturas."
        )
    elif years < 30:
        lines.append(
            f"Tenes {years} anios. Estas en la edad donde el sistema "
            "te pide que decidas todo: carrera, pareja, hijos, casa. "
            "La clase media argentina toma estas decisiones con "
            "inflacion del 40% y sueldos en pesos. Basicamente "
            "elegis tu destino con una venda en los ojos y las "
            "manos atadas. Suerte con eso."
        )
    elif years < 50:
        lines.append(
            f"{years} anios. Ya viste varias crisis argentinas: "
            "2001, 2008, 2018, 2024... Cada vez que pensaste "
            "'esto no puede empeorar', empeoro. Tu poder "
            "adquisitivo bajo, tu cintura se ensancho, y tu "
            "paciencia con el capitalismo tambien. La mitad "
            "de tu vida ya se fue en laburar para otros. "
            "La pregunta es: que vas a hacer con la"
            " otra mitad?"
        )
    else:
        lines.append(
            f"{years} anios. Sos un sobreviviente del sistema. "
            "Viste dictadura, democracia, hiper, covid, y "
            "siguen cayendo presidentes como si fueran "
            "jugadores de futbol. Si llegaste aca, es porque "
            "la clase obrera tiene espalda ancha. O porque "
            "no te alcanzo para jubilarte. En Argentina, "
            "la mayoria de la gente de tu edad labura "
            "porque sino no llega a fin de mes. La "
            "jubilacion es un mito."
        )

    return "\n".join(lines)
