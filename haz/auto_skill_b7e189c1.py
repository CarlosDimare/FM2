import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: gasto_diario nombre_del_habito [veces_por_semana]\n"
            "Calcula cuanto te cuesta un habito cotidiano a largo plazo.\n"
            "Muestra gasto por mes, ano, 5 y 10 anios.\n"
            "Ej: 3500 cafe 5\n"
            "Ej: 1200 bondi 10\n"
            "Ej: 7000 puchos 7\n"
            "Ej: USD 5 cafe 7\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (gasto_diario nombre [veces_semana])."

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
        daily_cost = parse_num(parts[offset])
    except ValueError:
        return "Error: no se pudo parsear el gasto."

    name_parts = []
    idx = offset + 1
    veces_semana = 7

    while idx < len(parts):
        try:
            veces_semana = int(float(parts[idx]))
            break
        except ValueError:
            name_parts.append(parts[idx])
            idx += 1

    name = " ".join(name_parts) if name_parts else "este habito"
    veces_semana = max(1, min(veces_semana, 7))

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if veces_semana == 7:
        dias_mes = 30
    else:
        dias_mes = veces_semana * 4.33

    gasto_mensual = daily_cost * dias_mes
    gasto_anual = daily_cost * veces_semana * 52
    gasto_5 = gasto_anual * 5
    gasto_10 = gasto_anual * 10
    gasto_30 = gasto_anual * 30

    rendimiento_5 = 8
    if gasto_anual > 0:
        futuro_5 = gasto_anual * ((1 + rendimiento_5 / 100) ** 5 - 1) / (rendimiento_5 / 100)
        futuro_10 = gasto_anual * ((1 + rendimiento_5 / 100) ** 10 - 1) / (rendimiento_5 / 100)
    else:
        futuro_5 = 0
        futuro_10 = 0

    equivalencias = [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("pinta de cerveza", 4000),
        ("cafe de especialidad", 3500),
        ("viaje en bondi", 1200),
        ("Big Mac", 8500),
        ("entrada de cine", 5000),
        ("cuota de gimnasio", 25000),
    ]

    lines = []
    lines.append(f"COSTO DE UN HABITO: {name}")
    lines.append(f"Gasto por vez: {c} {daily_cost:,.0f}")
    lines.append(f"Veces por semana: {veces_semana}")
    lines.append("---")
    lines.append(f"Por dia:    {c} {daily_cost:,.0f}")
    lines.append(f"Por mes:    {c} {gasto_mensual:,.0f}")
    lines.append(f"Por anio:   {c} {gasto_anual:,.0f}")
    lines.append(f"En 5 anios: {c} {gasto_5:,.0f}")
    lines.append(f"En 10 anios: {c} {gasto_10:,.0f}")
    lines.append(f"En 30 anios: {c} {gasto_30:,.0f}")
    lines.append("")
    lines.append(f"SI INVIERTES ESO AL {rendimiento_5}% ANUAL:")
    lines.append(f"  En 5 anios:  {c} {futuro_5:,.0f}")
    lines.append(f"  En 10 anios: {c} {futuro_10:,.0f}")
    lines.append("")
    lines.append(f"EQUIVALENCIA (gasto mensual):")
    for item, cost in equivalencias:
        cant = gasto_mensual / cost
        if cant >= 3:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Por dia:    USD {daily_cost/blue:,.0f}")
        lines.append(f"  Por mes:    USD {gasto_mensual/blue:,.0f}")
        lines.append(f"  En 10 anios: USD {gasto_10/blue:,.0f}")

    lines.append("")
    if gasto_mensual > 100000:
        lines.append(
            f"Posta: Gastas MAS DE 100 LUCAS por mes en {name}. "
            "Eso es un alquiler, un credito, o 4 cuotas de "
            "algo que te dure. Si es cafe, son como 30 cafes "
            "por mes a 3500 cada uno. Si son puchos, son 14 "
            "atados. Si es delivery, son 10 comidas. La "
            "pregunta no es 'podes dejar esto?' sino 'que "
            "mas podrias hacer con esa plata?'"
        )
    elif gasto_mensual > 30000:
        lines.append(
            f"Posta: Entre 30k y 100k por mes en {name}. Estas en "
            "el rango de la clase media con vicios moderados. "
            "No es para alarmarse pero tampoco para ignorarlo. "
            "Un cafe por dia son 105k al mes. Dos birras "
            "por semana son 35k al mes. Sumando todo, te "
            "sorprenderia cuanta plata se va en 'pequenos "
            "gustos' que no recordas."
        )
    elif gasto_mensual > 5000:
        lines.append(
            f"Posta: Menos de 30k por mes. Es un gasto menor pero "
            "no menor. En 10 anios son {c} {gasto_10:,.0f}. "
            "No es para obsesionarse pero si para tener "
            "conciencia. La clase media argentina se funde "
            "en pequenos gastos, no en grandes compras."
        )
    else:
        lines.append(
            f"Posta: Menos de 5k por mes. Esto es casi imperceptible. "
            "No te preocupes por esto. Preocupate por las cosas "
            "grandes que no podes controlar: alquiler, inflacion, "
            "impuestos. El capitalismo te hace pelear por "
            "migajas mientras te roba por toneladas."
        )

    return "\n".join(lines)
