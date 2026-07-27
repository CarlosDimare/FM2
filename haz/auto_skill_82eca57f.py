import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_diario_estacionamiento dias_por_semana [costo_mensual_cochera]\n"
            "Calcula el costo de estacionar el auto.\n"
            "Compara estacionamiento diario vs mensual vs cochera.\n"
            "Muestra gasto por mes, anio, y que % de tu salario\n"
            "se va en estacionar.\n"
            "Ej: 5000 5 35000\n"
            "Ej: USD 10 5 150\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (costo_diario dias_semana [cochera_mensual])."

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
        diario = parse_num(parts[offset])
        dias = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    cochera = 0
    if len(parts) >= offset + 3:
        cochera = parse_num(parts[offset + 2])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        diario_ars = diario * blue
        cochera_ars = cochera * blue
    else:
        diario_ars = diario
        cochera_ars = cochera

    semanas_mes = 4.33
    dias_mes = dias * semanas_mes

    costo_diario_mes = diario_ars * dias_mes
    costo_diario_ano = costo_diario_mes * 12

    if cochera_ars > 0:
        ahorro_mensual = costo_diario_mes - cochera_ars
        ahorro_anual = ahorro_mensual * 12

    if cochera_ars > 0 and diario_ars > 0:
        punto_equilibrio_dias = cochera_ars / diario_ars if diario_ars > 0 else 0
    else:
        punto_equilibrio_dias = 0

    lines = []
    lines.append("COSTO DE ESTACIONAMIENTO")
    lines.append(f"Estacionamiento diario: {c} {diario:,.0f}")
    lines.append(f"Dias por semana:        {dias:.0f}")
    lines.append(f"Cochera mensual:        {c} {cochera:,.0f}")
    lines.append("---")
    lines.append("ESTACIONAMIENTO DIARIO:")
    lines.append(f"  Dias por mes: {dias_mes:.0f}")
    lines.append(f"  Costo mensual: {c} {costo_diario_mes:,.0f}")
    lines.append(f"  Costo anual:   {c} {costo_diario_ano:,.0f}")
    lines.append("")
    if cochera_ars > 0:
        lines.append("COCHERA MENSUAL:")
        lines.append(f"  Costo mensual: {c} {cochera_ars:,.0f}")
        lines.append(f"  Costo anual:   {c} {cochera_ars*12:,.0f}")
        lines.append("")
        lines.append("COMPARACION:")
        if ahorro_mensual > 0:
            lines.append(f"  Cochera es {c} {ahorro_mensual:,.0f} MAS BARATA por mes")
            lines.append(f"  Ahorro anual: {c} {ahorro_anual:,.0f}")
            lines.append(f"  Si estacionas mas de {punto_equilibrio_dias:.0f} dias/mes, cochera conviene")
        elif ahorro_mensual < 0:
            lines.append(f"  Diario es {c} {abs(ahorro_mensual):,.0f} MAS BARATO por mes")
            lines.append(f"  Cochera no conviene, estacionas menos de {punto_equilibrio_dias:.0f} dias")
        else:
            lines.append("  Cuestan igual")
    else:
        lines.append("(sin cochera para comparar)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Diario mensual:  USD {costo_diario_mes/blue:,.0f}")
        lines.append(f"  Diario anual:    USD {costo_diario_ano/blue:,.0f}")
        if cochera_ars > 0:
            lines.append(f"  Cochera mensual: USD {cochera_ars/blue:,.0f}")

    lines.append("")
    if cochera_ars > 0:
        lines.append(
            f"Posta: La diferencia entre estacionar en la calle y "
            "tener cochera es {c} {abs(ahorro_mensual) if ahorro_mensual != 0 else 0:,.0f} por mes. "
            "Pero la cochera no es solo plata: es no tener que "
            "buscar lugar 20 minutos, no rayarte el auto, no "
            "que te lo rocen, no que te lo multen, no que te "
            "lo lleve la grua. En CABA, una multa por mal "
            "estacionamiento esta $ 15,000. Dos multas y "
            "ya pagaste la diferencia. La calle es gratis "
            "pero tiene costo oculto: el tiempo."
        )
    else:
        lines.append(
            f"Posta: Sin cochera fija, el estacionamiento diario "
            "te cuesta {c} {costo_diario_ano:,.0f} al ano. "
            "Si trabajas 48 semanas al ano, son "
            "{c} {diario_ars:,.0f} por dia de trabajo. "
            "Eso es cafe, almuerzo, o parte del combustible. "
            "El auto no es solo nafta: es estacionamiento, "
            "peajes, lavados, y mil cosas mas que nadie "
            "suma hasta que hace la cuenta."
        )

    return "\n".join(lines)
