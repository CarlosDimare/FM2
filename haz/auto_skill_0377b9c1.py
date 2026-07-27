import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: mejor_salario_mensual antiguedad_anios [USD]\n"
            "Calcula la indemnizacion por despido sin causa segun LCT.\n"
            "Considera el aguinaldo, vacaciones no gozadas e integracion.\n"
            "Ej: 500000 3\n"
            "Ej: USD 3000 5\n"
            "Ej: 600k 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (mejor_salario antiguedad_anios)."

    raw_salary = parts[offset].upper()
    try:
        salary = float(raw_salary.replace("K", "").replace("M", ""))
        if "K" in raw_salary:
            salary *= 1000
        elif "M" in raw_salary:
            salary *= 1_000_000
        years = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"

    months_per_year_of_service = 1.0
    severance_base = salary * years * months_per_year_of_service

    preaviso = salary * 1.0
    if years < 5:
        preaviso = salary * 1.0
    elif years < 10:
        preaviso = salary * 2.0
    else:
        preaviso = salary * 3.0

    sac_proporcional = salary / 12 * 6
    vacaciones_no_gozadas = salary / 25 * 14
    integracion_mes_despido = salary / 30 * 15

    total_indemnizacion = severance_base + preaviso + sac_proporcional + vacaciones_no_gozadas + integracion_mes_despido

    lines = []
    lines.append(f"Mejor salario mensual: {c} {salary:,.0f}")
    lines.append(f"Antiguedad: {years:.0f} anios")
    lines.append("---")
    lines.append(f"Indemnizacion por antiguedad ({years:.0f} sueldos): {c} {severance_base:,.0f}")
    lines.append(f"Preaviso ({max(1, min(3, years//5+1)):.0f} meses):              {c} {preaviso:,.0f}")
    lines.append(f"SAC proporcional (6 meses):                 {c} {sac_proporcional:,.0f}")
    lines.append(f"Vacaciones no gozadas (14 dias):            {c} {vacaciones_no_gozadas:,.0f}")
    lines.append(f"Integracion mes despido (15 dias):          {c} {integracion_mes_despido:,.0f}")
    lines.append("---")
    lines.append(f"TOTAL INDEMNIZACION ESTIMADA:               {c} {total_indemnizacion:,.0f}")
    lines.append(f"Equivalente a {total_indemnizacion/salary:.1f} sueldos")

    if not is_usd:
        blue = 1400
        lines.append("")
        lines.append(f"Al blue ({blue:.0f}): USD {total_indemnizacion/blue:,.0f}")

    lines.append("")
    if years < 1:
        lines.append(
            "Posta: Menos de un anio de antiguedad. No esperes mucho, "
            "pero algo es algo. Mas que nada sirve para pagar el alquiler "
            "de 2 meses mientras buscas otra cosa. El sistema laboral argentino "
            "te dice: 'gracias por tu tiempo, aca tenes un colchon que no alcanza'."
        )
    elif years < 3:
        lines.append(
            "Posta: Entre 1 y 3 anios. La indemnizacion te da unos meses "
            "de supervivencia. No es un golpe de suerte, pero tampoco es "
            "una condena. Dato curioso: tu empleador ya tenia esta plata "
            "calculada como 'costo de echarte' desde el dia 1."
        )
    elif years < 6:
        lines.append(
            "Posta: 3 a 6 anios. Ya es una indemnizacion seria. Te da "
            "para vivir 6-9 meses buscando laburo. O para hacer un curso "
            "y reconvertirte a cooperativista. Tu ex-empleador ya te "
            "habia presupuestado. No es rencor, es contabilidad."
        )
    else:
        lines.append(
            "Posta: Mas de 6 anios. Indemnizacion considerable. Sos casi "
            "un socio sin serlo. Tu indemnizacion refleja lo que realmente "
            "valias para la empresa: mucho. Lastima que te pagaban una "
            "fraccion de eso todos los meses. La diferencia se llama plusvalia, "
            "y recien ahora la ves en un solo pago."
        )

    return "\n".join(lines)
