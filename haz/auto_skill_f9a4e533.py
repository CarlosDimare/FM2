import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual costo_prepaga [tipo_obra_social] [grupo_familiar]\n"
            "Compara costo de prepaga vs obra social por sindicato.\n"
            "Muestra diferencia mensual, anual, y que mas podrias hacer con esa plata.\n"
            "Tipo obra social: sindical (default), publica.\n"
            "Ej: 2500000 75000 sindical 3\n"
            "Ej: USD 4000 200 sindical 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (salario costo_prepaga [tipo] [grupo])."

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
        prepaga = parse_num(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    tipo = "sindical"
    grupo = 1
    if len(parts) >= offset + 3:
        t = parts[offset + 2].lower()
        if t in ("sindical", "publica"):
            tipo = t
    if len(parts) >= offset + 4:
        try:
            grupo = int(float(parts[offset + 3]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if tipo == "sindical":
        aporte_os = salary * 0.03
        aporte_sindicato = salary * 0.02
        total_obra = aporte_os + aporte_sindicato
        extra_por_grupo = 0
        if grupo > 1:
            extra_por_grupo = salary * 0.01 * (grupo - 1)
        total_obra += extra_por_grupo
    else:
        aporte_os = salary * 0.03
        total_obra = aporte_os
        extra_por_grupo = 0

    costo_prepaga_real = prepaga * grupo

    diff_monthly = costo_prepaga_real - total_obra
    diff_annual = diff_monthly * 12
    pct_salary_prepaga = (costo_prepaga_real / salary) * 100 if salary > 0 else 0
    pct_salary_obra = (total_obra / salary) * 100 if salary > 0 else 0

    if pct_salary_prepaga > 0 and pct_salary_obra > 0:
        veces_mas_caro = costo_prepaga_real / total_obra if total_obra > 0 else 0
    else:
        veces_mas_caro = 0

    lines = []
    lines.append(f"PREPAGA vs OBRA SOCIAL")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append(f"Grupo familiar: {grupo} persona(s)")
    lines.append(f"Tipo obra social: {tipo}")
    lines.append("---")
    lines.append("OBRA SOCIAL:")
    lines.append(f"  Aporte obra social (3%):  {c} {aporte_os:,.0f}")
    if tipo == "sindical":
        lines.append(f"  Aporte sindical (2%):     {c} {aporte_sindicato:,.0f}")
    if extra_por_grupo > 0:
        lines.append(f"  Extra grupo ({grupo}):       {c} {extra_por_grupo:,.0f}")
    lines.append(f"  Total:                    {c} {total_obra:,.0f} ({pct_salary_obra:.1f}% del salario)")
    lines.append("")
    lines.append("PREPAGA:")
    lines.append(f"  Cuota base:               {c} {prepaga:,.0f}")
    lines.append(f"  x {grupo} persona(s):          {c} {costo_prepaga_real:,.0f} ({pct_salary_prepaga:.1f}% del salario)")
    lines.append("")
    lines.append("DIFERENCIA:")

    if diff_monthly > 0:
        lines.append(f"  Prepaga es MAS CARA por:  {c} {diff_monthly:,.0f}/mes")
        lines.append(f"                             {c} {diff_annual:,.0f}/ano")
        lines.append(f"  Prepaga cuesta {veces_mas_caro:.1f}x lo que la obra social")

        interes_compuesto = diff_monthly * ((1 + 0.05/12)**60 - 1) / (0.05/12) if diff_monthly > 0 else 0
        lines.append("")
        lines.append(f"  Si INVIRTIERAS la diferencia al 5% anual:")
        lines.append(f"  En 5 anios tendrias: {c} {interes_compuesto:,.0f}")
    elif diff_monthly < 0:
        lines.append(f"  Prepaga es MAS BARATA por: {c} {abs(diff_monthly):,.0f}/mes")
    else:
        lines.append("  Cuestan igual (raro, revisa numeros)")

    lines.append("")
    lines.append("EQUIVALENCIA DE LA DIFERENCIA:")
    for item, cost in [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal pinta", 4000),
        ("cafe de especialidad", 3500),
    ]:
        cant = abs(diff_monthly) / cost
        if cant >= 1:
            lines.append(f"  {cant:.0f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Diferencia mensual: USD {diff_monthly/blue:,.0f}")
        lines.append(f"  Diferencia anual:   USD {diff_annual/blue:,.0f}")

    lines.append("")
    if veces_mas_caro > 3:
        lines.append(
            f"Posta: La prepaga cuesta MAS DEL TRIPLE que la obra social. "
            "La pregunta del millon: la atencion es 3 veces mejor? "
            "Probablemente no. La prepaga argentina es el lujo de "
            "saltarse la fila del hospital publico y pagar por "
            "un 'trato preferencial' que en cualquier pais del "
            "primer mundo es el estandar. Sos clase media alta "
            "pagando para no cruzarte con la clase media baja "
            "en la sala de espera. La salud es un derecho, pero "
            "en Argentina es un servicio con niveles de membresia."
        )
    elif veces_mas_caro > 1.5:
        lines.append(
            f"Posta: La prepaga cuesta entre 1.5 y 3 veces mas que "
            "la obra social. La diferencia no es tanta si tenes "
            "obra social sindical de las buenas (OSECAC, OSDE de "
            "sindicato, etc.). Si es obra social publica, la "
            "diferencia se siente en los tiempos de espera. La "
            "clase media argentina vive en este dilema: pagar "
            "mas para esperar menos, o esperar mas para pagar "
            "menos. No hay respuesta correcta, solo la certeza "
            "de que la salud nunca es gratis."
        )
    else:
        lines.append(
            f"Posta: La diferencia es marginal. Si tu obra social "
            "es buena y la prepaga sale casi lo mismo, quedate "
            "con la obra social. El dia que necesites un "
            "medico a las 3 AM o una cirugia programada, te "
            "vas a acordar de esta decision. La salud no es "
            "un gasto: es una apuesta. Y en Argentina, las "
            "apuestas siempre las pierde el que no tiene."
        )

    return "\n".join(lines)
