import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual [hijos] [edad_hijo]\n"
            "Estima el costo mensual de criar un hijo segun ingresos.\n"
            "Incluye alimentos, paiales, educacion, salud, vestimenta.\n"
            "Muestra porcentaje del salario y proyeccion hasta 18 anios.\n"
            "Ej: 800000 1 2\n"
            "Ej: USD 3000 2 5\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el salario mensual."

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

    hijos = 1
    edad = 0
    if len(parts) >= offset + 2:
        hijos = int(float(parts[offset + 1]))
    if len(parts) >= offset + 3:
        edad = int(float(parts[offset + 3])) if len(parts) >= offset + 3 else 0

    c = "USD" if is_usd else "ARS"
    blue = 1400

    edad = max(0, min(edad, 17))

    cost_by_age = {
        0:  210_000,
        1:  195_000,
        2:  185_000,
        3:  175_000,
        4:  170_000,
        5:  170_000,
        6:  180_000,
        7:  190_000,
        8:  200_000,
        9:  210_000,
        10: 220_000,
        11: 230_000,
        12: 250_000,
        13: 270_000,
        14: 290_000,
        15: 310_000,
        16: 330_000,
        17: 350_000,
    }

    base_cost = cost_by_age.get(edad, 200_000)
    monthly_cost = base_cost * 1.5 if edad < 3 else base_cost
    monthly_cost *= hijos

    if is_usd:
        monthly_cost *= blue

    pct_salary = (monthly_cost / salary) * 100 if salary > 0 else 0

    inflation = 0.40
    total_remaining = 0
    yearly_cost_est = 0
    if is_usd:
        for y in range(edad, 18):
            yr = y - edad
            cst = cost_by_age.get(y, 200_000) * blue
            inflated = cst * (1 + inflation) ** yr
            total_remaining += inflated
            yearly_cost_est += cst * (1 + inflation) ** yr
    else:
        for y in range(edad, 18):
            yr = y - edad
            cst = cost_by_age.get(y, 200_000)
            inflated = cst * (1 + inflation) ** yr
            total_remaining += inflated

    total_cost_0_18 = 0
    if not is_usd:
        for y in range(0, 18):
            cst = cost_by_age.get(y, 200_000)
            total_cost_0_18 += cst * (1 + inflation) ** y
    else:
        for y in range(0, 18):
            cst = cost_by_age.get(y, 200_000) * blue
            total_cost_0_18 += cst * (1 + inflation) ** y

    years_remaining = 18 - edad

    lines = []
    lines.append(f"COSTO DE CRIAR UN HIJO")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append(f"Hijos: {hijos}")
    lines.append(f"Edad del hijo: {edad} anios")
    lines.append("---")
    lines.append(f"COSTO ESTIMADO MENSUAL:")
    lines.append(f"  Por hijo:    {c} {monthly_cost/hijos:,.0f}")
    lines.append(f"  Total:       {c} {monthly_cost:,.0f}")
    lines.append(f"  Porcentaje:  {pct_salary:.1f}% del salario")
    lines.append("")
    lines.append(f"COSTO RESTANTE HASTA 18 ANIOS:")
    lines.append(f"  {years_remaining} anios x {hijos} hijo(s):")
    lines.append(f"  Total estimado: {c} {total_remaining:,.0f}")
    lines.append("")
    lines.append(f"COSTO TOTAL DE 0 A 18 ANIOS:")
    lines.append(f"  Por hijo:    {c} {total_cost_0_18:,.0f}")
    lines.append(f"  {hijos} hijo(s):  {c} {total_cost_0_18 * hijos:,.0f}")
    lines.append("")
    lines.append(f"COSTO DIARIO: {c} {monthly_cost/30:,.0f}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:   USD {monthly_cost/blue:,.0f}")
        lines.append(f"  Hasta 18:  USD {total_remaining/blue:,.0f}")
        lines.append(f"  0 a 18:    USD {total_cost_0_18/blue:,.0f}")

    lines.append("")
    if pct_salary > 50:
        lines.append(
            f"Posta: El {pct_salary:.0f}% de tu salario se va en los pibes. "
            "Bienvenido a la clase media argentina con hijos. Si tenes mas "
            "de uno, estas regalando tu sueldo a los supermercados, la "
            "indumentaria infantil y la cuota del colegio. La paternidad "
            "es el impuesto mas grande que paga la clase trabajadora. "
            "Y nadie te avisa antes."
        )
    elif pct_salary > 25:
        lines.append(
            f"Posta: {pct_salary:.0f}% del salario en los hijos. Estas en "
            "el promedio. Los pibes te comen un cuarto del sueldo entre "
            "comida, ropa, educacion y salud. Y cuando crecen, mas caro. "
            "La buena noticia: los hijos son lo unico que no podes "
            "comprar con plata. La mala: la plata ayuda."
        )
    elif pct_salary > 10:
        lines.append(
            f"Posta: Solo el {pct_salary:.0f}% del salario en hijos. O "
            "ganas muy bien o tenes ayuda (familia, obra social copada, "
            "colegio publico). En cualquiera de los dos casos, estas "
            "en el grupo de privilegiados. El 90% de los padres "
            "argentinos gasta mucho mas y gana mucho menos."
        )
    else:
        lines.append(
            f"Posta: Menos del 10% del salario en hijos. O sos de clase "
            "alta o tenes un solo hijo grande o los numeros estan "
            "mal. Porque tener un hijo sale mas que eso incluso si "
            "no le compras ropa y lo alimentas a manteca."
        )

    return "\n".join(lines)
