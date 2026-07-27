import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_coworking_diario dias_por_semana [costo_internet] [costo_luz] [costo_cafe]\n"
            "Compara el costo de trabajar en un coworking vs desde casa.\n"
            "Incluye internet, luz, cafe, y tiempo de viaje.\n"
            "Ej: 5000 3 15000 12000 8000\n"
            "Ej: USD 15 5 50 30 20\n"
            "Soporta sufijos k/M para costos fijos."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (precio_coworking dias_semana [internet] [luz] [cafe])."

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
        coworking_daily = parse_num(parts[offset])
        days_week = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    costo_internet = 15000
    costo_luz = 12000
    costo_cafe = 8000
    if len(parts) >= offset + 3:
        costo_internet = parse_num(parts[offset + 2])
    if len(parts) >= offset + 4:
        costo_luz = parse_num(parts[offset + 3])
    if len(parts) >= offset + 5:
        costo_cafe = parse_num(parts[offset + 4])

    c = "USD" if is_usd else "ARS"
    blue = 1400
    weeks_per_month = 4.33
    days_month = days_week * weeks_per_month

    costo_coworking_mensual = coworking_daily * days_month

    pct_hogar = 0.3
    costo_hogar_mensual = (costo_internet + costo_luz + costo_cafe) * pct_hogar
    costo_hogar_total = costo_internet + costo_luz + costo_cafe

    diff_mensual = costo_coworking_mensual - costo_hogar_mensual
    diff_anual = diff_mensual * 12

    viaje_diario = 1.5
    horas_viaje_mes = viaje_diario * days_week * weeks_per_month
    costo_viaje_diario = 1200
    if is_usd:
        costo_viaje_diario = 2
    costo_viaje_mensual = costo_viaje_diario * days_week * weeks_per_month

    total_coworking_real = costo_coworking_mensual + costo_viaje_mensual
    total_hogar_real = costo_hogar_total

    lines = []
    lines.append("COWORKING vs TRABAJAR DESDE CASA")
    lines.append(f"Coworking diario:  {c} {coworking_daily:,.0f}")
    lines.append(f"Dias por semana:   {days_week:.0f} ({days_month:.0f} dias/mes)")
    lines.append("---")
    lines.append("COSTO COWORKING (mensual):")
    lines.append(f"  Espacio:           {c} {costo_coworking_mensual:,.0f}")
    lines.append(f"  Viaje:             {c} {costo_viaje_mensual:,.0f}")
    lines.append(f"  Total coworking:   {c} {total_coworking_real:,.0f}")
    lines.append("")
    lines.append("COSTO HOGAR (mensual) - total:")
    lines.append(f"  Internet:          {c} {costo_internet:,.0f}")
    lines.append(f"  Luz (oficina 30%): {c} {costo_luz * pct_hogar:,.0f}")
    lines.append(f"  Cafe/agua:         {c} {costo_cafe:,.0f}")
    lines.append(f"  Costo real hogar:  {c} {costo_hogar_total:,.0f}")
    lines.append(f"  Costo imputable:   {c} {costo_hogar_mensual:,.0f} (30% del total)")
    lines.append("")
    lines.append("COMPARACION REAL:")
    if total_coworking_real > costo_hogar_total:
        lines.append(f"  Coworking cuesta {c} {total_coworking_real - costo_hogar_total:,.0f} MAS por mes")
        lines.append(f"  = {c} {(total_coworking_real - costo_hogar_total) * 12:,.0f} MAS por ano")
    else:
        lines.append(f"  Coworking cuesta {c} {costo_hogar_total - total_coworking_real:,.0f} MENOS por mes")
        lines.append(f"  = {c} {(costo_hogar_total - total_coworking_real) * 12:,.0f} MENOS por ano")
    lines.append("")
    lines.append(f"TIEMPO DE VIAJE: {viaje_diario:.0f} h/dia = {horas_viaje_mes:.0f} h/mes")
    lines.append(f"  Que son {horas_viaje_mes / 173.33:.1f} meses laborales al ano perdidos viajando")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Coworking: USD {total_coworking_real/blue:,.0f}/mes")
        lines.append(f"  Hogar:     USD {costo_hogar_total/blue:,.0f}/mes")

    lines.append("")
    if total_coworking_real > costo_hogar_total * 1.5:
        lines.append(
            f"Posta: El coworking te sale MUCHO MAS CARO que estar en "
            "casa. Pero el coworking no es solo un escritorio: es "
            "no tener que cocinarte la comida, no estar solo, "
            "tener internet que no se corta, y separar la vida "
            "laboral de la personal. La pregunta es: cuanto "
            "vale tu salud mental? Si la respuesta es menos "
            "de {c} {diff_mensual:,.0f}, quedate en casa."
        )
    elif total_coworking_real > costo_hogar_total:
        lines.append(
            f"Posta: El coworking es un poco mas caro. Pero incluye "
            "cafe, limpieza, calefaccion/aire, y a veces eventos. "
            "Si ademas considera el tiempo de viaje como costo "
            "(y deberias), capaz que el coworking cerca de tu "
            "casa es mas barato que ir a una oficina lejana. "
            "La clase media freelancer descubrio que laburar "
            "en pijama no es gratis: pagas con aislamiento."
        )
    else:
        lines.append(
            f"Posta: El coworking sale mas barato. Raro, pero posible "
            "si tu casa es muy cara de mantener o el coworking "
            "tiene promo. En general, laburar desde casa es mas "
            "barato pero mas solitario. El coworking es el "
            "bar de los programadores: pagas por la compania."
        )

    return "\n".join(lines)
