import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_promedio_delivery veces_por_semana [costo_comida_casera]\n"
            "Compara el gasto en delivery vs cocinar en casa.\n"
            "Muestra cuanto gastas por mes, anio, 5 anios.\n"
            "y la diferencia contra cocinar.\n"
            "Ej: 12000 3 4000\n"
            "Ej: USD 15 5 5\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (costo_promedio veces_semana [costo_casera])."

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
        delivery = parse_num(parts[offset])
        veces = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    casera = delivery * 0.4
    if len(parts) >= offset + 3:
        casera = parse_num(parts[offset + 2])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    veces_semana = max(0.5, min(veces, 14))
    veces_mes = veces_semana * 4.33
    veces_ano = veces_semana * 52

    gasto_semanal_delivery = delivery * veces_semana
    gasto_mensual_delivery = delivery * veces_mes
    gasto_anual_delivery = delivery * veces_ano
    gasto_5a_delivery = gasto_anual_delivery * 5
    gasto_10a_delivery = gasto_anual_delivery * 10

    gasto_semanal_casera = casera * veces_semana
    gasto_mensual_casera = casera * veces_mes
    gasto_anual_casera = casera * veces_ano
    gasto_5a_casera = gasto_anual_casera * 5

    ahorro_semanal = gasto_semanal_delivery - gasto_semanal_casera
    ahorro_mensual = gasto_mensual_delivery - gasto_mensual_casera
    ahorro_anual = gasto_anual_delivery - gasto_anual_casera
    ahorro_5a = gasto_5a_delivery - gasto_5a_casera

    pct_ahorro = ((delivery - casera) / delivery) * 100 if delivery > 0 else 0

    lines = []
    lines.append("DELIVERY vs COCINAR EN CASA")
    lines.append(f"Costo delivery:    {c} {delivery:,.0f}")
    lines.append(f"Costo casera:      {c} {casera:,.0f}")
    lines.append(f"Veces por semana:  {veces_semana:.0f}")
    lines.append("---")
    lines.append("GASTO EN DELIVERY:")
    lines.append(f"  Por semana: {c} {gasto_semanal_delivery:,.0f}")
    lines.append(f"  Por mes:    {c} {gasto_mensual_delivery:,.0f}")
    lines.append(f"  Por anio:   {c} {gasto_anual_delivery:,.0f}")
    lines.append(f"  En 5 anios: {c} {gasto_5a_delivery:,.0f}")
    lines.append("")
    lines.append("GASTO EN COMIDA CASERA:")
    lines.append(f"  Por semana: {c} {gasto_semanal_casera:,.0f}")
    lines.append(f"  Por mes:    {c} {gasto_mensual_casera:,.0f}")
    lines.append(f"  Por anio:   {c} {gasto_anual_casera:,.0f}")
    lines.append(f"  En 5 anios: {c} {gasto_5a_casera:,.0f}")
    lines.append("")
    lines.append("AHORRO COCINANDO EN CASA:")
    lines.append(f"  Por semana:   {c} {ahorro_semanal:,.0f}")
    lines.append(f"  Por mes:      {c} {ahorro_mensual:,.0f}")
    lines.append(f"  Por anio:     {c} {ahorro_anual:,.0f}")
    lines.append(f"  En 5 anios:   {c} {ahorro_5a:,.0f}")
    lines.append(f"  Ahorras {pct_ahorro:.0f}% por comida")
    lines.append("")
    lines.append("EQUIVALENCIA DEL AHORRO ANUAL:")
    for item, cost in [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal", 4000),
        ("viaje en bondi", 1200),
        ("cuota de gimnasio", 25000),
    ]:
        cant = ahorro_anual / cost
        if cant >= 3:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Delivery anual:  USD {gasto_anual_delivery/blue:,.0f}")
        lines.append(f"  Casera anual:    USD {gasto_anual_casera/blue:,.0f}")
        lines.append(f"  Ahorro anual:    USD {ahorro_anual/blue:,.0f}")

    lines.append("")
    if veces_semana >= 7:
        lines.append(
            f"Posta: Pedis delivery {veces_semana:.0f} veces por semana. "
            "O no cocinas nunca o tenes un problema con el delivery. "
            "A este ritmo, gastas {c} {gasto_anual_delivery:,.0f} por "
            "ano solo en comida que podrias hacer en casa por "
            f"{c} {gasto_anual_casera:,.0f}. La diferencia es "
            f"{c} {ahorro_anual:,.0f}. Eso es un viaje, un "
            "curso, o varios meses de alquiler. Pero bueno, "
            "el delivery es el electrodomestico de la clase "
            "media que no tiene tiempo de cocinar porque "
            "esta laburando para pagar el delivery."
        )
    elif veces_semana >= 3:
        lines.append(
            f"Posta: {veces_semana:.0f} veces por semana. Estas en "
            "el promedio de la clase media urbana. El delivery "
            "es caro pero la gente paga por tiempo, no por "
            "comida. Cocinando la mitad de las veces, te "
            f"ahorras {c} {ahorro_anual/2:,.0f} al ano. No es "
            "menor. Pero el tiempo no se ahorra, se gasta "
            "en otra cosa. La pregunta es: preferis cocinar "
            "una hora o laburar una hora para pagar el delivery?"
        )
    else:
        lines.append(
            f"Posta: {veces_semana:.0f} veces por semana. Pedis "
            "poco delivery. Sos una persona ordenada que cocina "
            "en casa. O no te alcanza para delivery. En cualquiera "
            "de los dos casos, tenes la relacion mas sana con la "
            "comida. El delivery es el impuesto a la vagancia "
            "de la clase media. Y como todo impuesto, se paga "
            "en cuotas... de engorde."
        )

    return "\n".join(lines)
