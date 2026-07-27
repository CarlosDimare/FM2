import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_sesion sesiones_por_mes [cubre_obra_social]\n"
            "Calcula el costo de la terapia psicologica.\n"
            "Muestra gasto por mes, por anio, y que porcentaje\n"
            "del salario representa tu salud mental.\n"
            "Ej: 15000 4 si\n"
            "Ej: 20000 8 no\n"
            "Ej: USD 60 4 no\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (costo_sesion sesiones_mes [cubre_os])."

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
        sesion = parse_num(parts[offset])
        sesiones = int(float(parts[offset + 1]))
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    cubre_os = False
    if len(parts) >= offset + 3:
        cubre_os = parts[offset + 2].lower() in ("si", "s", "true", "1")

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        sesion_ars = sesion * blue
    else:
        sesion_ars = sesion

    gasto_mensual = sesion_ars * sesiones
    gasto_anual = gasto_mensual * 12
    gasto_5a = gasto_anual * 5

    if cubre_os:
        reintegro_pct = 0.40
        reintegro_mensual = gasto_mensual * reintegro_pct
        gasto_mensual_real = gasto_mensual - reintegro_mensual
        gasto_anual_real = gasto_mensual_real * 12
    else:
        reintegro_pct = 0
        reintegro_mensual = 0
        gasto_mensual_real = gasto_mensual
        gasto_anual_real = gasto_anual

    costo_vida = gasto_mensual
    if not is_usd:
        salario_promedio = 800000
    else:
        salario_promedio = 1500

    pct_salario_promedio = (gasto_mensual / salario_promedio) * 100 if salario_promedio > 0 else 0

    sesiones_ano = sesiones * 12
    horas_terapia_ano = sesiones_ano * 1

    equivalencias = [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal", 4000),
        ("cafe de especialidad", 3500),
        ("viaje en bondi", 1200),
        ("cuota de gimnasio", 25000),
        ("libro", 25000),
    ]

    lines = []
    lines.append("COSTO DE LA TERAPIA")
    lines.append(f"Costo por sesion:   {c} {sesion:,.0f}")
    lines.append(f"Sesiones por mes:   {sesiones}")
    if cubre_os:
        lines.append(f"Obra social cubre:  {reintegro_pct*100:.0f}%")
    else:
        lines.append(f"Obra social cubre:  No")
    lines.append("---")
    lines.append("GASTO MENSUAL:")
    lines.append(f"  Bruto:  {c} {gasto_mensual:,.0f}")
    if cubre_os:
        lines.append(f"  Reintegro: {c} {reintegro_mensual:,.0f}")
        lines.append(f"  Neto:   {c} {gasto_mensual_real:,.0f}")
    lines.append("")
    lines.append(f"GASTO ANUAL:    {c} {gasto_anual_real:,.0f}")
    lines.append(f"EN 5 ANIOS:     {c} {gasto_5a:,.0f}")
    lines.append(f"EN 10 ANIOS:    {c} {gasto_anual_real*10:,.0f}")
    lines.append("")
    lines.append(f"SESIONES POR ANO: {sesiones_ano}")
    lines.append(f"HORAS EN TERAPIA: {horas_terapia_ano:.0f} h/ano")
    lines.append("")
    lines.append(f"PORCENTAJE DEL SALARIO PROMEDIO:")
    lines.append(f"  {pct_salario_promedio:.1f}% del salario de referencia")
    lines.append("")
    lines.append("EQUIVALENCIA DEL GASTO ANUAL:")
    for item, cost in equivalencias:
        cant = gasto_anual_real / cost
        if cant >= 3:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual: USD {gasto_mensual_real/blue:,.0f}")
        lines.append(f"  Anual:   USD {gasto_anual_real/blue:,.0f}")

    lines.append("")
    if pct_salario_promedio > 15:
        lines.append(
            f"Posta: Terapia te come MAS DEL 15% de tu salario. "
            "La salud mental es un lujo en Argentina. Pagas "
            "15 lucas por sesion, 4 veces al mes, y son 60 "
            "lucas que podrian ser un alquiler. Pero si no "
            "vas a terapia, capaz que ese alquiler no lo "
            "podes pagar porque estas deprimido. La paradoja "
            "de la clase media: necesita terapia para poder "
            "trabajar, pero no puede pagar terapia porque "
            "trabaja todo el dia."
        )
    elif pct_salario_promedio > 5:
        lines.append(
            f"Posta: Entre 5 y 15% del salario. Estas en el rango "
            "de la clase media que puede costear terapia pero "
            "con esfuerzo. La obra social cubre parte (40% "
            "si tenes reintegro), pero el resto sale del "
            "bolsillo. La pregunta es: cuantas sesiones "
            "necesitas realmente? No todas las semanas "
            "son iguales. Considera espaciar en epocas "
            "de vacas flacas."
        )
    else:
        lines.append(
            f"Posta: Menos del 5% del salario. O pagas muy poco, "
            "o tenes buen sueldo, o la obra social te cubre "
            "bien. En cualquier caso, bien ahi. La terapia "
            "es la unica inversion que no tiene ROI porque "
            "la salud mental no se mide en plata. Pero si "
            "se notara en tu productividad, probablemente "
            "las empresas deberian pagarla."
        )

    return "\n".join(lines)
