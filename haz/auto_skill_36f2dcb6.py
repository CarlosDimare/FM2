import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_mensual_guarderia horas_por_dia [hijos] [edad_meses]\n"
            "Calcula el costo de la guarderia o jardin maternal.\n"
            "Muestra gasto por mes, por anio, porcentaje del salario,\n"
            "y comparacion contra quedarse en casa o contratar cuidadora.\n"
            "Ej: 180000 8 1 18\n"
            "Ej: USD 400 8 2 24\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (costo_mensual horas_dia [hijos] [edad_meses])."

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
        cuota = parse_num(parts[offset])
        horas = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    hijos = 1
    edad = 18
    if len(parts) >= offset + 3:
        hijos = int(float(parts[offset + 2]))
    if len(parts) >= offset + 4:
        edad = int(float(parts[offset + 3]))

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        cuota_ars = cuota * blue
    else:
        cuota_ars = cuota

    cuota_ars_total = cuota_ars * hijos
    gasto_anual = cuota_ars_total * 11
    gasto_total_hasta_primaria = cuota_ars_total * 11 * 5

    salario_promedio = 1000000
    if is_usd:
        salario_promedio_ars = salario_promedio * blue
    else:
        salario_promedio_ars = salario_promedio

    pct_salario = (cuota_ars_total / salario_promedio_ars) * 100 if salario_promedio_ars > 0 else 0

    cuidadora_mensual = cuota_ars_total * 1.4
    ahorro_cuidadora = cuidadora_mensual - cuota_ars_total

    if is_usd:
        salario_neto_si_trabaja = salario_promedio * 0.75
        costo_trabajar = cuota
        neto_con_guarderia = salario_neto_si_trabaja - costo_trabajar
        neto_sin_trabajar = 0
    else:
        salario_neto_si_trabaja = salario_promedio_ars * 0.75
        costo_trabajar = cuota_ars
        neto_con_guarderia = salario_neto_si_trabaja - costo_trabajar
        neto_sin_trabajar = 0

    lines = []
    lines.append("COSTO DE GUARDERIA / JARDIN MATERNAL")
    lines.append(f"Cuota mensual:      {c} {cuota:,.0f}")
    lines.append(f"Horas por dia:      {horas:.0f}")
    lines.append(f"Hijos:              {hijos}")
    lines.append(f"Edad del nino:       ~{edad} meses")
    lines.append("---")
    lines.append(f"GASTO MENSUAL TOTAL:")
    lines.append(f"  {c} {cuota_ars_total:,.0f}")
    lines.append("")
    lines.append(f"GASTO ANUAL:")
    lines.append(f"  {c} {gasto_anual:,.0f} (11 meses)")
    lines.append("")
    lines.append(f"GASTO HASTA PRIMARIA (5 anios):")
    lines.append(f"  {c} {gasto_total_hasta_primaria:,.0f}")
    lines.append("")
    lines.append(f"PORCENTAJE DEL SALARIO:")
    lines.append(f"  {pct_salario:.0f}% del salario de referencia ({c} {salario_promedio:,.0f})")
    lines.append("")
    lines.append(f"COMPARACION CON CUIDADORA:")
    lines.append(f"  Cuidadora:         {c} {cuidadora_mensual:,.0f}")
    lines.append(f"  Guarderia:         {c} {cuota_ars_total:,.0f}")
    lines.append(f"  Ahorro con guarderia: {c} {ahorro_cuidadora:,.0f}")
    lines.append("")
    lines.append(f"CUENTA TRABAJAR vs QUEDARSE EN CASA:")
    lines.append(f"  Salario neto (si trabajas):  {c} {salario_neto_si_trabaja:,.0f}")
    lines.append(f"  Costo guarderia:             {c} {costo_trabajar:,.0f}")
    lines.append(f"  Neto despues de guarderia:   {c} {neto_con_guarderia:,.0f}")
    lines.append(f"  Si te quedas en casa:        0 (no aportas, no gastas)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:    USD {cuota_ars_total/blue:,.0f}")
        lines.append(f"  Anual:      USD {gasto_anual/blue:,.0f}")
        lines.append(f"  Hasta primaria: USD {gasto_total_hasta_primaria/blue:,.0f}")

    lines.append("")
    if pct_salario > 50:
        lines.append(
            f"Posta: La guarderia te come MAS DEL 50% de tu salario. "
            "A este ritmo, trabajar para pagar la guarderia no tiene "
            "sentido economico. La cuenta es simple: si tu sueldo "
            "neto es $ {salario_neto_si_trabaja:,.0f} y la guarderia "
            f"cuesta $ {cuota_ars_total:,.0f}, te quedan $ {neto_con_guarderia:,.0f} "
            "para todo lo demas. Muchas madres (porque siempre son "
            "ellas) dejan de trabajar porque no les da el numero. "
            "No es falta de voluntad: es matematica de clase."
        )
    elif pct_salario > 25:
        lines.append(
            f"Posta: La guarderia te come el {pct_salario:.0f}% de tu "
            "salario. Es un gasto grande pero no inviable. La pregunta "
            "es si el trabajo te da desarrollo profesional o es solo "
            "para pagar la guarderia. Muchas familias viven este "
            "dilema: el sueldo de uno se va casi completo en "
            "cuidado de los hijos. El otro sueldo mantiene "
            "la casa. La clase media con hijos ES la guarderia."
        )
    else:
        lines.append(
            f"Posta: Menos del 25% del salario. La guarderia es "
            "accesible para tu nivel de ingreso. O tenes un buen "
            "sueldo o la guarderia es barata (municipal, sindical). "
            "En cualquiera de los dos casos, el cuidado infantil "
            "no te esta fundiendo. Eso te pone en el grupo "
            "privilegiado: la mayoria de los padres argentinos "
            "gastan mucho mas y ganan mucho menos."
        )

    return "\n".join(lines)
