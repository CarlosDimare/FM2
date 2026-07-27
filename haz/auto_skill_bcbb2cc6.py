import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_cosa salario_mensual [horas_por_dia] [dias_por_semana]\n"
            "Calcula cuantas horas, dias y meses de trabajo necesitas\n"
            "para pagar algo. Incluye descuentos de impuestos.\n"
            "Ej: 1500000 2500000 8 5\n"
            "Ej: 85000000 2500000\n"
            "Ej: USD 500 3000 8 5\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (precio salario [horas_dia] [dias_semana])."

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
        price = parse_num(parts[offset])
        salary = parse_num(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    horas_dia = 8
    dias_semana = 5

    if len(parts) >= offset + 3:
        horas_dia = float(parts[offset + 2])
    if len(parts) >= offset + 4:
        dias_semana = float(parts[offset + 3])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        price_ars = price * blue
        salary_ars = salary * blue
    else:
        price_ars = price
        salary_ars = salary

    tasa_impuesto = 0.20
    salario_neto_mes = salary_ars * (1 - tasa_impuesto)
    salario_neto_dia = salario_neto_mes / (dias_semana * 4.33) if dias_semana > 0 else 0
    salario_neto_hora = salario_neto_dia / horas_dia if horas_dia > 0 else 0

    horas_necesarias = price_ars / salario_neto_hora if salario_neto_hora > 0 else 0
    dias_necesarios = horas_necesarias / horas_dia if horas_dia > 0 else 0
    meses_necesarios = dias_necesarios / (dias_semana * 4.33) if dias_semana > 0 else 0
    anios_necesarios = meses_necesarios / 12

    pct_mes = (price / salary) * 100 if salary > 0 else 0
    pct_ano = pct_mes / 12

    lines = []
    lines.append("CUANTO TRABAJO CUESTA ALGO")
    lines.append(f"Precio:           {c} {price:,.0f}")
    lines.append(f"Salario bruto:    {c} {salary:,.0f}")
    lines.append(f"Salario neto mes: {c} {salario_neto_mes:,.0f} ({(1-tasa_impuesto)*100:.0f}% del bruto)")
    lines.append(f"Jornada:          {horas_dia:.0f} h/dia x {dias_semana:.0f} dias/sem")
    lines.append("---")
    lines.append(f"Horas de trabajo: {horas_necesarias:,.0f}")
    lines.append(f"Dias de trabajo:  {dias_necesarios:,.0f}")
    lines.append(f"Meses de trabajo: {meses_necesarios:,.1f}")
    if anios_necesarios >= 1:
        lines.append(f"Anios de trabajo: {anios_necesarios:,.1f}")
    lines.append("")
    lines.append(f"PORCENTAJE DE TU SALARIO:")
    lines.append(f"  Representa el {pct_mes:.0f}% de tu salario mensual")
    lines.append(f"  = {pct_ano:.1f}% de tu salario anual")

    lines.append("")
    if meses_necesarios > 24:
        lines.append(
            f"Posta: Necesitas {meses_necesarios:.0f} MESES ENTEROS "
            f"de trabajo para pagar esto. {c} {price:,.0f} no es un "
            "gustito: es una propiedad. La clase media argentina "
            "trabaja 30 anios para pagar un depto que el constructor "
            "levanto en 18 meses. La plusvalia no es un concepto "
            "marxista: es la cuenta de cuanto vales vs cuanto "
            "vale lo que compras."
        )
    elif meses_necesarios > 3:
        lines.append(
            f"Posta: {meses_necesarios:.0f} meses de trabajo. "
            "No es un capricho, es una decision grande. Preguntate: "
            "esto realmente vale 3 meses de tu vida? Porque "
            "cuando compras algo, no estas gastando plata: "
            "estas gastando tiempo que no vas a recuperar."
        )
    elif meses_necesarios > 0.5:
        lines.append(
            f"Posta: {dias_necesarios:.0f} dias de trabajo. "
            "Entre medio mes y 3 meses. Esta en el rango de "
            "los 'gustitos' de la clase media: te duele pero "
            "no te funde. La pregunta es: cuantos gustitos "
            "de estos te das al mes? Porque sumando varios, "
            "terminas trabajando gratis para el consumo."
        )
    else:
        lines.append(
            f"Posta: {horas_necesarias:.0f} horas de trabajo. "
            "Menos de medio mes. Es un gasto chico. No te "
            "preocupes por esto. Preocupate por las cosas "
            "que cuestan meses de tu vida y las compras "
            "sin pensar. El cafe de especialidad no te "
            "va a fundir. El auto nuevo, si."
        )

    return "\n".join(lines)
