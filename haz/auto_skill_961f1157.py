import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: cuota_gimnasio_mensual [veces_semana] [costo_transporte]\n"
            "Compara el costo del gimnasio contra ejercitarse al aire libre.\n"
            "Muestra costo por visita, por mes, por anio, y que\n"
            "podrias comprar con la diferencia.\n"
            "Ej: 25000 4 5000\n"
            "Ej: USD 50 5 10\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta la cuota del gimnasio."

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
    except ValueError:
        return "Error: no se pudo parsear la cuota."

    veces = 4
    transporte = 0
    if len(parts) >= offset + 2:
        veces = float(parts[offset + 1])
    if len(parts) >= offset + 3:
        transporte = parse_num(parts[offset + 2])

    if is_usd:
        cuota_ars = cuota * 1400
        transporte_ars = transporte * 1400
    else:
        cuota_ars = cuota
        transporte_ars = transporte

    c = "USD" if is_usd else "ARS"
    blue = 1400

    veces_mes = veces * 4.33
    costo_por_visita = (cuota_ars + transporte_ars) / veces_mes if veces_mes > 0 else 0
    costo_mensual = cuota_ars + transporte_ars
    costo_anual = costo_mensual * 12
    costo_5a = costo_anual * 5

    equipo_inicial = 0
    if not is_usd:
        equipo_inicial = 50000
    else:
        equipo_inicial = 50

    if is_usd:
        equipo_inicial_ars = equipo_inicial * blue
    else:
        equipo_inicial_ars = equipo_inicial

    equipo_anual = equipo_inicial_ars / 3
    costo_libre_anual = equipo_anual
    costo_libre_mensual = costo_libre_anual / 12

    ahorro_mensual = costo_mensual - costo_libre_mensual
    ahorro_anual = costo_anual - costo_libre_anual
    ahorro_5a = costo_5a - costo_libre_anual * 5

    pct_ahorro = (ahorro_anual / costo_anual) * 100 if costo_anual > 0 else 0

    lines = []
    lines.append("GIMNASIO vs EJERCICIO AL AIRE LIBRE")
    lines.append(f"Cuota mensual:    {c} {cuota:,.0f}")
    lines.append(f"Veces por semana: {veces:.0f}")
    lines.append(f"Transporte:       {c} {transporte:,.0f}")
    lines.append("---")
    lines.append("COSTO GIMNASIO:")
    lines.append(f"  Cuota:         {c} {cuota_ars:,.0f}")
    lines.append(f"  Transporte:    {c} {transporte_ars:,.0f}")
    lines.append(f"  Costo/visita:  {c} {costo_por_visita:,.0f}")
    lines.append(f"  Total mes:     {c} {costo_mensual:,.0f}")
    lines.append(f"  Total anio:    {c} {costo_anual:,.0f}")
    lines.append("")
    lines.append("COSTO AIRE LIBRE:")
    lines.append(f"  Equipo inicial: {c} {equipo_inicial:,.0f}")
    lines.append(f"  Amortizacion:   {c} {equipo_anual:,.0f}/ano")
    lines.append(f"  Total mes:      {c} {costo_libre_mensual:,.0f}")
    lines.append(f"  Total anio:     {c} {costo_libre_anual:,.0f}")
    lines.append("")
    lines.append("COMPARACION:")
    lines.append(f"  Ahorro por mes:  {c} {ahorro_mensual:,.0f}")
    lines.append(f"  Ahorro por anio: {c} {ahorro_anual:,.0f}")
    lines.append(f"  En 5 anios:      {c} {ahorro_5a:,.0f}")
    lines.append(f"  El gimnasio es {pct_ahorro:.0f}% mas caro")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Costo gimnasio:  USD {costo_mensual/blue:,.0f}/mes")
        lines.append(f"  Costo libre:     USD {costo_libre_mensual/blue:,.0f}/mes")
        lines.append(f"  Ahorro anual:    USD {ahorro_anual/blue:,.0f}")

    lines.append("")
    if ahorro_anual > 200000:
        lines.append(
            f"Posta: Te ahorras MAS DE 200 LUCAS al ano haciendo "
            "ejercicio al aire libre. Con eso te compras zapatillas "
            "nuevas, ropa deportiva, y te sobra para un masaje. "
            "El gimnasio es el lujo de la clase media que necesita "
            "motivacion externa para moverse. Al aire libre es "
            "gratis, pero requiere disciplina. La pregunta es: "
            "necesitas una maquina de 50 lucas para hacer bici "
            "o podes salir a la calle y pedalear de verdad?"
        )
    elif ahorro_anual > 50000:
        lines.append(
            f"Posta: Te ahorras entre 50 y 200 lucas al ano. No es "
            "una fortuna, pero tampoco es moneda chica. El gimnasio "
            "tiene ventajas: maquinas, clima controlado, duchas, "
            "y gente (para conocer o para que te vean). Al aire "
            "libre tenes sol, lluvia, frio, y perros sueltos. "
            "Elegi segun tu presupuesto y tu tolerancia al "
            "clima argentino."
        )
    else:
        lines.append(
            f"Posta: La diferencia es minima. O el gimnasio es "
            "barato o ya tenes el equipo. En este caso, la "
            "decision no es economica sino de preferencia. "
            "El gimnasio es el hogar de la clase media que "
            "paga por sentirse saludable. Al aire libre es "
            "el refugio del que sabe que la salud no se "
            "compra, se construye."
        )

    return "\n".join(lines)
