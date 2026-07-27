import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_plan_mensual [gb_del_plan] [costo_prepago_x_gb]\n"
            "Compara un plan de celular contra prepago.\n"
            "Muestra costo mensual, anual, punto de equilibrio y\n"
            "que conviene segun tu consumo.\n"
            "Ej: 15000 10 3000\n"
            "Ej: USD 30 20 5\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el costo del plan mensual."

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
        plan = parse_num(parts[offset])
    except ValueError:
        return "Error: no se pudo parsear el costo del plan."

    gb_plan = 10
    prepago_gb = 3000

    if len(parts) >= offset + 2:
        try:
            gb_plan = float(parts[offset + 1])
        except ValueError:
            pass

    if len(parts) >= offset + 3:
        prepago_gb = parse_num(parts[offset + 2])

    if is_usd:
        prepago_gb_ars = prepago_gb * 1400
        plan_ars = plan * 1400
    else:
        prepago_gb_ars = prepago_gb
        plan_ars = plan

    c = "USD" if is_usd else "ARS"
    blue = 1400

    costo_plan_mensual = plan_ars
    costo_plan_anual = costo_plan_mensual * 12
    costo_plan_5a = costo_plan_anual * 5
    costo_gb_plan = costo_plan_mensual / gb_plan if gb_plan > 0 else 0

    for gb_consumo in [2, 5, 10, 20, 50]:
        costo_prepago_mensual = gb_consumo * prepago_gb_ars
        if costo_prepago_mensual <= plan_ars:
            gb_equilibrio = gb_consumo
            break
    else:
        gb_equilibrio = 50

    consumo_equilibrio = plan_ars / prepago_gb_ars if prepago_gb_ars > 0 else 0

    gb_bajos = 5
    gb_medios = 15
    gb_altos = 30

    prepago_bajo = gb_bajos * prepago_gb_ars
    prepago_medio = gb_medios * prepago_gb_ars
    prepago_alto = gb_altos * prepago_gb_ars

    ahorro_bajo = plan_ars - prepago_bajo
    ahorro_medio = plan_ars - prepago_medio
    ahorro_alto = plan_ars - prepago_alto

    lines = []
    lines.append("PLAN DE CELULAR vs PREPAGO")
    lines.append(f"Plan mensual:     {c} {plan:,.0f}")
    lines.append(f"GB del plan:      {gb_plan:.0f} GB")
    lines.append(f"Prepago por GB:   {c} {prepago_gb:,.0f}")
    lines.append("---")
    lines.append("COSTO DEL PLAN:")
    lines.append(f"  Por mes:  {c} {costo_plan_mensual:,.0f}")
    lines.append(f"  Por anio: {c} {costo_plan_anual:,.0f}")
    lines.append(f"  En 5 anios: {c} {costo_plan_5a:,.0f}")
    lines.append(f"  Costo por GB: {c} {costo_gb_plan:,.0f}")
    lines.append("")
    lines.append("PUNTO DE EQUILIBRIO:")
    lines.append(f"  Si consumis menos de {consumo_equilibrio:.0f} GB/mes, te conviene prepago")
    lines.append(f"  Si consumis mas, te conviene el plan")
    lines.append("")
    lines.append("COMPARACION POR CONSUMO:")
    lines.append(f"  Consumo bajo ({gb_bajos} GB):  prepago {c} {prepago_bajo:,.0f}")
    if ahorro_bajo > 0:
        lines.append(f"    Plan es {c} {ahorro_bajo:,.0f} MAS CARO ({costo_plan_mensual/prepago_bajo*100-100:.0f}%)")
    else:
        lines.append(f"    Prepago es {c} {abs(ahorro_bajo):,.0f} MAS CARO")
    lines.append("")
    lines.append(f"  Consumo medio ({gb_medios} GB): prepago {c} {prepago_medio:,.0f}")
    if ahorro_medio > 0:
        lines.append(f"    Plan es {c} {ahorro_medio:,.0f} MAS CARO")
    else:
        lines.append(f"    Prepago es {c} {abs(ahorro_medio):,.0f} MAS CARO")
    lines.append("")
    lines.append(f"  Consumo alto ({gb_altos} GB):  prepago {c} {prepago_alto:,.0f}")
    if ahorro_alto > 0:
        lines.append(f"    Plan es {c} {ahorro_alto:,.0f} MAS CARO")
    else:
        lines.append(f"    Prepago es {c} {abs(ahorro_alto):,.0f} MAS CARO")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Plan mensual:   USD {plan:,.0f}")
        lines.append(f"  Prepago 10GB:   USD {10*prepago_gb:,.0f}")
        lines.append(f"  Prepago 30GB:   USD {30*prepago_gb:,.0f}")

    lines.append("")
    if consumo_equilibrio > 50:
        lines.append(
            f"Posta: El prepago es tan barato que necesitas consumir "
            "MAS DE 50 GB al mes para que el plan convenga. Con "
            "ese consumo, estas mirando Netflix en el celular "
            "12 horas al dia. Compra el plan solo si necesitas "
            "beneficios adicionales (roaming, velocidad, etc.). "
            "Si no, quedate con prepago y ahorrate la diferencia."
        )
    elif consumo_equilibrio > 15:
        lines.append(
            f"Posta: El punto de equilibrio esta en {consumo_equilibrio:.0f} GB. "
            "Si consumis menos de eso, prepago rinde mas. El mercado "
            "de telefonia en Argentina es un oligopolio (Personal, "
            "Movistar, Claro) que se reparte el 95% de los clientes "
            "y compite a base de promos temporarias, no de precios "
            "justos. Cambiar de plan cada 6 meses es un trabajo "
            "de tiempo completo."
        )
    else:
        lines.append(
            f"Posta: El plan conviene si consumis mas de {consumo_equilibrio:.0f} GB. "
            "Tipico de usuarios de redes sociales, streaming, y "
            "trabajo remoto desde el celular. Pero ojo: las "
            "telefonicas cuentan los GB como si fueran oro. "
            "Un video de TikTok de 30 segundos = 10 MB. "
            "10 videos por minuto = 600 MB/hora. Hace "
            "la cuenta de cuanto consumis realmente."
        )

    return "\n".join(lines)
