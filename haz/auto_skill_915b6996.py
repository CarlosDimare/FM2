import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_dispositivo vida_util_anios [nombre]\n"
            "Calcula el costo real de tus dispositivos tecnologicos.\n"
            "Muestra costo por mes, por ano, costo por hora de uso\n"
            "y comparacion con otros gastos cotidianos.\n"
            "Ej: 2500000 5 laptop\n"
            "Ej: 1500000 3 celular\n"
            "Ej: USD 2000 4 macbook\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (precio vida_util [nombre])."

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
        life = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    name = "dispositivo"
    if len(parts) >= offset + 3:
        name = parts[offset + 2]

    c = "USD" if is_usd else "ARS"
    blue = 1400
    hours_per_day = 8

    if is_usd:
        price_ars = price * blue
    else:
        price_ars = price

    valor_residual = price_ars * 0.1
    depreciacion_anual = (price_ars - valor_residual) / life
    depreciacion_mensual = depreciacion_anual / 12
    depreciacion_diaria = depreciacion_anual / 365

    horas_uso_vida = hours_per_day * 365 * life
    costo_por_hora = price_ars / horas_uso_vida if horas_uso_vida > 0 else 0

    reparaciones_anual = price_ars * 0.05
    reparaciones_mensual = reparaciones_anual / 12
    seguros_anual = price_ars * 0.03
    seguros_mensual = seguros_anual / 12

    costo_mensual_total = depreciacion_mensual + reparaciones_mensual + seguros_mensual
    costo_anual_total = costo_mensual_total * 12

    if not is_usd:
        en_usd = price / blue
    else:
        en_usd = price

    lines = []
    lines.append(f"COSTO DE TECNOLOGIA: {name.upper()}")
    lines.append(f"Precio: {c} {price:,.0f}")
    lines.append(f"Vida util: {life:.0f} anios")
    lines.append("---")
    lines.append(f"DEPRECIACION (perdida de valor):")
    lines.append(f"  Valor inicial:    {c} {price:,.0f}")
    lines.append(f"  Valor residual:   {c} {int(valor_residual if not is_usd else valor_residual/blue):,.0f} ({10:.0f}%)")
    lines.append(f"  Por ano:          {c} {depreciacion_anual:,.0f}")
    lines.append(f"  Por mes:          {c} {depreciacion_mensual:,.0f}")
    lines.append(f"  Por dia:          {c} {depreciacion_diaria:,.0f}")
    lines.append("")
    lines.append(f"COSTO MENSUAL TOTAL (dep + rep + seg):")
    lines.append(f"  Depreciacion:     {c} {depreciacion_mensual:,.0f}")
    lines.append(f"  Reparaciones:     {c} {reparaciones_mensual:,.0f}")
    lines.append(f"  Seguro:           {c} {seguros_mensual:,.0f}")
    lines.append(f"  Total:            {c} {costo_mensual_total:,.0f}")
    lines.append("")
    lines.append(f"COSTO POR HORA DE USO:")
    lines.append(f"  ({hours_per_day} h/dia x {life} anios = {horas_uso_vida:.0f} horas)")
    lines.append(f"  $ {costo_por_hora:,.0f}/hora")
    lines.append("")
    lines.append(f"COSTO ANUAL: {c} {costo_anual_total:,.0f}")
    lines.append(f"COSTO TOTAL (vida util): {c} {price_ars + reparaciones_anual*life + seguros_anual*life:,.0f}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Precio:     USD {price:,.0f}")
        lines.append(f"  Por mes:    USD {costo_mensual_total/blue:,.0f}")
        lines.append(f"  Por hora:   USD {costo_por_hora/blue:,.0f}")

    lines.append("")
    if costo_por_hora < 100:
        lines.append(
            f"Posta: {costo_por_hora:,.0f} pesos por hora de uso. "
            "Es una ganga si lo usas mucho. La tecnologia es de "
            "las cosas mas baratas por hora de uso si le das "
            "bola. El problema es que compramos dispositivos "
            "nuevos cada 2-3 anios porque el marketing nos "
            "convence de que el nuestro ya es obsoleto. "
            "Spoiler: no lo es."
        )
    elif costo_por_hora < 500:
        lines.append(
            f"Posta: {costo_por_hora:,.0f} pesos por hora. Razonable. "
            "Si trabajas con esto (programador, disenador, etc), "
            "el costo por hora es bajisimo comparado con lo que "
            "facturas. Si es solo para redes y Netflix, capaz "
            "que un equipo mas barato hubiera sido suficiente. "
            "Pero el capitalismo te vendio que necesitas "
            "una laptop de 3 lucas verdes para mirar "
            "YouTube en 4K."
        )
    else:
        lines.append(
            f"Posta: {costo_por_hora:,.0f} pesos por hora. Salado. "
            "O compraste algo muy caro o lo usas poco. Una "
            "MacBook Pro de 5 lucas verdes usada 4 horas "
            "por dia da un costo por hora alto. No es mala "
            "compra si laburas con eso. Si es para redes "
            "sociales, te regalaste."
        )

    return "\n".join(lines)
