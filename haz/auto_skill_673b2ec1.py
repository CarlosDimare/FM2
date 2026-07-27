import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: cuota_mensual matricula_anual [materiales_anual] [hijos]\n"
            "Calcula el costo total de un colegio privado.\n"
            "Incluye cuota, matricula, materiales, uniforme, viajes.\n"
            "Muestra total por mes, por anio, por hijo, y % del salario.\n"
            "Ej: 180000 2500000 800000 1\n"
            "Ej: USD 400 3000 1500 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (cuota matricula [materiales] [hijos])."

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
        matricula = parse_num(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear cuota y matricula."

    materiales = cuota * 2
    hijos = 1
    if len(parts) >= offset + 3:
        materiales = parse_num(parts[offset + 2])
    if len(parts) >= offset + 4:
        try:
            hijos = int(float(parts[offset + 3]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    cuotas_anuales = 11
    extra_por_hijo = 0.85

    if is_usd:
        cuota_ars = cuota * blue
        matricula_ars = matricula * blue
        materiales_ars = materiales * blue
    else:
        cuota_ars = cuota
        matricula_ars = matricula
        materiales_ars = materiales

    costo_anual_por_hijo = (cuota_ars * cuotas_anuales) + matricula_ars + materiales_ars
    costo_mensual_por_hijo = costo_anual_por_hijo / 12

    if hijos == 1:
        costo_anual_total = costo_anual_por_hijo
    else:
        costo_anual_total = costo_anual_por_hijo + costo_anual_por_hijo * extra_por_hijo * (hijos - 1)

    costo_mensual_total = costo_anual_total / 12

    uniforme_anual = 120000
    viajes_anual = 80000
    eventos_anual = 60000

    if not is_usd:
        uniforme_anual_ars = uniforme_anual
        viajes_anual_ars = viajes_anual
        eventos_anual_ars = eventos_anual
    else:
        uniforme_anual_ars = uniforme_anual * blue
        viajes_anual_ars = viajes_anual * blue
        eventos_anual_ars = eventos_anual * blue

    extras_anuales = (uniforme_anual_ars + viajes_anual_ars + eventos_anual_ars) * hijos
    costo_anual_total += extras_anuales
    costo_mensual_total += extras_anuales / 12

    total_primaria = costo_anual_total * 7
    total_secundaria = costo_anual_total * 6
    total_12a = total_primaria + total_secundaria

    lines = []
    lines.append("COSTO DE COLEGIO PRIVADO")
    lines.append(f"Cuota mensual:    {c} {cuota:,.0f}")
    lines.append(f"Matricula anual:  {c} {matricula:,.0f}")
    lines.append(f"Materiales anual: {c} {materiales:,.0f}")
    lines.append(f"Hijos:            {hijos}")
    lines.append("---")
    lines.append("COSTO POR HIJO:")
    lines.append(f"  {cuotas_anuales} cuotas:       {c} {cuota_ars*cuotas_anuales:,.0f}")
    lines.append(f"  Matricula:        {c} {matricula_ars:,.0f}")
    lines.append(f"  Materiales:       {c} {materiales_ars:,.0f}")
    lines.append(f"  Uniforme:         {c} {uniforme_anual_ars:,.0f}")
    lines.append(f"  Viajes/eventos:   {c} {viajes_anual_ars+eventos_anual_ars:,.0f}")
    lines.append(f"  TOTAL ANUAL:      {c} {costo_anual_por_hijo + uniforme_anual_ars + viajes_anual_ars + eventos_anual_ars:,.0f}")
    lines.append(f"  TOTAL MENSUAL:    {c} {(costo_anual_por_hijo + uniforme_anual_ars + viajes_anual_ars + eventos_anual_ars)/12:,.0f}")
    lines.append("")
    lines.append("COSTO TOTAL (" + str(hijos) + " hijo(s)):")
    lines.append(f"  Mensual:          {c} {costo_mensual_total:,.0f}")
    lines.append(f"  Anual:            {c} {costo_anual_total:,.0f}")
    lines.append("")
    lines.append("PROYECCION:")
    lines.append(f"  Primaria (7 anios):  {c} {total_primaria:,.0f}")
    lines.append(f"  Secundaria (6 anios):{c} {total_secundaria:,.0f}")
    lines.append(f"  Total 12 anios:      {c} {total_12a:,.0f}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:  USD {costo_mensual_total/blue:,.0f}")
        lines.append(f"  Anual:    USD {costo_anual_total/blue:,.0f}")
        lines.append(f"  12 anios: USD {total_12a/blue:,.0f}")

    lines.append("")
    salario_comparacion = cuota_ars * 15
    pct_salario_necesario = (costo_mensual_total / salario_comparacion) * 100 if salario_comparacion > 0 else 0
    if not is_usd:
        lines.append(
            f"Posta: La educacion privada en Argentina cuesta entre "
            "$ 100k y $ 300k por mes segun el colegio. Para un hijo, "
            "son 12 anios de colegio = mas de {c} {total_12a:,.0f}. "
            "Eso es una propiedad. La clase media argentina se endeuda "
            "para mandar a los hijos al colegio privado porque el "
            "publico esta en crisis. No es eleccion: es estrategia "
            "de supervivencia de clase. El problema es que la "
            "cuota sube cada 3 meses y el sueldo no."
        )
    else:
        lines.append(
            f"Posta: La educacion privada en USD es cara hasta para "
            "el estandar internacional. En 12 anios por hijo, son "
            f"USD {total_12a/blue:,.0f} si vivis en Argentina al blue. "
            "Es mas barato que en EEUU pero el sueldo argentino "
            "es en pesos. La cuenta no cierra nunca."
        )

    return "\n".join(lines)
