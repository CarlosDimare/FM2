import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_bruto_relacion_dependencia [monotributo_categoria] [horas_semana]\n"
            "Compara ingresos netos en relacion de dependencia vs freelance.\n"
            "Incluye aguinaldo, vacaciones, aportes, obra social, monotributo.\n"
            "Ej: 2500000 G 40\n"
            "Ej: USD 4000 F 35\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el salario bruto."

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
    except ValueError:
        return "Error: no se pudo parsear el salario."

    categoria = None
    horas = 40
    if len(parts) >= offset + 2:
        cat = parts[offset + 2].upper()
        if cat in ("A","B","C","D","E","F","G","H","I","J","K"):
            categoria = cat
    if len(parts) >= offset + 3:
        try:
            horas = int(float(parts[offset + 3]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        salary_ars = salary * blue
    else:
        salary_ars = salary

    SAC = salary_ars / 2
    vacaciones_pct = 0.0833
    vacaciones_extra = salary_ars * vacaciones_pct

    anio_relacion = salary_ars * 12 + SAC + vacaciones_extra
    mes_relacion_promedio = anio_relacion / 12

    aportes_pct = 0.11
    obra_social_pct = 0.03
    sindicato_pct = 0.02
    deducciones_pct = aportes_pct + obra_social_pct + sindicato_pct

    deducciones_anual = anio_relacion * deducciones_pct
    neto_anual_relacion = anio_relacion - deducciones_anual
    neto_mensual_relacion = neto_anual_relacion / 12

    categorias_monotributo = {
        "A": (12000, 16000),
        "B": (17000, 22000),
        "C": (24000, 31000),
        "D": (35000, 44000),
        "E": (51000, 63000),
        "F": (76000, 92000),
        "G": (110000, 132000),
        "H": (160000, 190000),
        "I": (230000, 275000),
        "J": (330000, 395000),
        "K": (480000, 570000),
    }

    if categoria and categoria in categorias_monotributo:
        imp, os_val = categorias_monotributo[categoria]
        costo_monotributo = imp + os_val
    else:
        for cat, (lo, hi) in sorted(categorias_monotributo.items(), key=lambda x: categorias_monotributo[x[0]][1]):
            if salary_ars * 0.6 <= list(categorias_monotributo.keys()).index(cat) * 2_000_000:
                pass
        costo_monotributo = 130000

    ingreso_freelance_mensual = salary_ars * 0.75
    neto_freelance_mensual = ingreso_freelance_mensual - costo_monotributo
    neto_freelance_anual = neto_freelance_mensual * 12

    diff_mensual = neto_mensual_relacion - neto_freelance_mensual
    diff_anual = neto_anual_relacion - neto_freelance_anual

    tasa_ocupacion = 0.80
    horas_facturables_mes = horas * 4.33 * tasa_ocupacion
    tarifa_hora_freelance = ingreso_freelance_mensual / horas_facturables_mes if horas_facturables_mes > 0 else 0
    tarifa_hora_relacion = neto_mensual_relacion / (horas * 4.33) if horas > 0 else 0

    lines = []
    lines.append("RELACION DE DEPENDENCIA vs FREELANCE")
    lines.append(f"Salario bruto (o ingreso freelance): {c} {salary:,.0f}")
    lines.append(f"Categoria monotributo: {categoria or 'estimada'}")
    lines.append(f"Horas semanales: {horas}")
    lines.append("---")
    lines.append("RELACION DE DEPENDENCIA (anual):")
    lines.append(f"  Salario bruto 12 meses:  {c} {salary_ars*12:,.0f}")
    lines.append(f"  SAC (medio aguinaldo):   {c} {SAC:,.0f}")
    lines.append(f"  Vacaciones (8.33%):      {c} {vacaciones_extra:,.0f}")
    lines.append(f"  Total bruto anual:       {c} {anio_relacion:,.0f}")
    lines.append(f"  Deducciones ({deducciones_pct*100:.0f}%):    {c} {deducciones_anual:,.0f}")
    lines.append(f"  Neto anual:              {c} {neto_anual_relacion:,.0f}")
    lines.append(f"  Neto mensual prom.:      {c} {neto_mensual_relacion:,.0f}")
    lines.append("")
    lines.append("FREELANCE (anual):")
    lines.append(f"  Ingreso bruto mensual:   {c} {ingreso_freelance_mensual:,.0f}")
    lines.append(f"  Costo monotributo:       {c} {costo_monotributo:,.0f}")
    lines.append(f"  Neto mensual:            {c} {neto_freelance_mensual:,.0f}")
    lines.append(f"  Neto anual:              {c} {neto_freelance_anual:,.0f}")
    lines.append("")
    lines.append("COMPARACION:")
    if diff_mensual > 0:
        lines.append(f"  Rel. dependencia rinde {c} {diff_mensual:,.0f} MAS por mes")
        lines.append(f"  = {c} {diff_anual:,.0f} MAS por ano")
    else:
        lines.append(f"  Freelance rinde {c} {abs(diff_mensual):,.0f} MAS por mes")
        lines.append(f"  = {c} {abs(diff_anual):,.0f} MAS por ano")
    lines.append("")
    lines.append("TARIFA POR HORA:")
    lines.append(f"  Rel. dependencia: {c} {tarifa_hora_relacion:,.0f}/h")
    lines.append(f"  Freelance:        {c} {tarifa_hora_freelance:,.0f}/h")
    lines.append(f"  (freelance con {tasa_ocupacion*100:.0f}% ocupacion = {horas_facturables_mes:.0f} h/mes facturables)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Neto relacion:  USD {neto_mensual_relacion/blue:,.0f}/mes")
        lines.append(f"  Neto freelance: USD {neto_freelance_mensual/blue:,.0f}/mes")

    lines.append("")
    if diff_mensual > 0:
        lines.append(
            f"Posta: En relacion de dependencia ganas MAS neto. "
            "Tenes aguinaldo, vacaciones pagas, obra social, y "
            "aportes jubilatorios. El problema: no podes "
            "elegir clientes, no podes deducir gastos, y "
            "tenes jefe. La relacion de dependencia es mas "
            "plata fija pero menos libertad. El freelance "
            "es menos plata pero mas control. Elegi"
            " tu veneno."
        )
    else:
        lines.append(
            f"Posta: Como freelance ganas MAS neto. Pero ojo: "
            "no tenes aguinaldo, ni vacaciones pagas, ni "
            "obra social completa, ni aportes jubilatorios "
            "decentes, ni indemnizacion si te rajan (porque "
            "no te rajan, dejan de llamarte). El freelance "
            "paga menos impuestos pero tiene cero derechos. "
            "Es la economia del software: toda la ganancia, "
            "todo el riesgo."
        )

    return "\n".join(lines)
