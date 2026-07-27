import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: valor_propiedad precio_noche ocupacion_pct gastos_mensuales\n"
            "Compara rentabilidad de alquiler temporario vs tradicional.\n"
            "Muestra ingreso mensual estimado, rentabilidad anual,\n"
            "y comparacion contra alquiler tradicional (0.5% del valor).\n"
            "Ej: 85000000 45000 65 35000\n"
            "Ej: USD 200000 150 65 300\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 4:
        return "Error: faltan parametros (valor precio_noche ocupacion gastos)."

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
        valor = parse_num(parts[offset])
        noche = parse_num(parts[offset + 1])
        ocupacion = float(parts[offset + 2])
        gastos = parse_num(parts[offset + 3])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"
    blue = 1400
    ocupacion_pct = ocupacion / 100

    noches_mes = 30 * ocupacion_pct
    ingreso_bruto_mensual = noche * noches_mes
    ingreso_neto_mensual = ingreso_bruto_mensual - gastos
    ingreso_neto_anual = ingreso_neto_mensual * 12

    rentabilidad_anual_pct = (ingreso_neto_anual / valor) * 100 if valor > 0 else 0

    alquiler_trad_mensual = valor * 0.005
    alquiler_trad_anual = alquiler_trad_mensual * 12
    rentabilidad_trad_pct = (alquiler_trad_anual / valor) * 100 if valor > 0 else 0

    diferencia_mensual = ingreso_neto_mensual - alquiler_trad_mensual
    diferencia_pct = rentabilidad_anual_pct - rentabilidad_trad_pct

    comision_airbnb = ingreso_bruto_mensual * 0.15
    limpieza = noches_mes * 5000
    if is_usd:
        limpieza = noches_mes * 15
    gastos_reales = gastos + comision_airbnb + limpieza
    ingreso_real_mensual = ingreso_bruto_mensual - gastos_reales
    rentabilidad_real_pct = (ingreso_real_mensual * 12 / valor) * 100 if valor > 0 else 0

    lines = []
    lines.append("ALQUILER TEMPORARIO vs TRADICIONAL")
    lines.append(f"Valor propiedad: {c} {valor:,.0f}")
    lines.append(f"Precio por noche: {c} {noche:,.0f}")
    lines.append(f"Ocupacion: {ocupacion:.0f}% ({noches_mes:.0f} noches/mes)")
    lines.append(f"Gastos fijos: {c} {gastos:,.0f}/mes")
    lines.append("---")
    lines.append("TEMPORARIO (AIRBNB):")
    lines.append(f"  Ingreso bruto:      {c} {ingreso_bruto_mensual:,.0f}/mes")
    lines.append(f"  Comision Airbnb(15%): {c} {comision_airbnb:,.0f}/mes")
    lines.append(f"  Limpieza:           {c} {limpieza:,.0f}/mes")
    lines.append(f"  Gastos fijos:       {c} {gastos:,.0f}/mes")
    lines.append(f"  Ingreso neto real:  {c} {ingreso_real_mensual:,.0f}/mes")
    lines.append(f"  Ingreso anual:      {c} {ingreso_real_mensual * 12:,.0f}")
    lines.append(f"  Rentabilidad:       {rentabilidad_real_pct:.1f}% anual")
    lines.append("")
    lines.append("TRADICIONAL (alquiler fijo):")
    lines.append(f"  Alquiler mensual:   {c} {alquiler_trad_mensual:,.0f}")
    lines.append(f"  Ingreso anual:      {c} {alquiler_trad_anual:,.0f}")
    lines.append(f"  Rentabilidad:       {rentabilidad_trad_pct:.1f}% anual")
    lines.append("")
    lines.append("COMPARACION:")
    if diferencia_mensual > 0:
        lines.append(f"  Temporario rinde {c} {diferencia_mensual:,.0f} MAS por mes")
    else:
        lines.append(f"  Tradicional rinde {c} {abs(diferencia_mensual):,.0f} MAS por mes")
    lines.append(f"  Diferencia rentabilidad: {diferencia_pct:+.1f}%")
    lines.append("")
    lines.append(f"PUNTO DE EQUILIBRIO (ocupacion necesaria para igualar):")
    ocupacion_eq = (alquiler_trad_mensual + gastos_reales) / (noche * 30) * 100 if noche > 0 else 0
    lines.append(f"  {ocupacion_eq:.0f}% de ocupacion")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Temp. mensual: USD {ingreso_real_mensual/blue:,.0f}")
        lines.append(f"  Trad. mensual: USD {alquiler_trad_mensual/blue:,.0f}")

    lines.append("")
    if rentabilidad_real_pct > rentabilidad_trad_pct + 5:
        lines.append(
            f"Posta: El temporario rinde mucho mas que el tradicional. "
            "Pero ojo: la ocupacion del {ocupacion:.0f}% es optimista. "
            "La realidad puede ser 40-50% en temporada baja. Y "
            "Airbnb no es una inversion pasiva: tenes que estar "
            "encima de reservas, limpieza, resenas, y lidiar con "
            "huespedes que te dejan el depto hecho un chiquero. "
            "El alquiler tradicional es aburrido, pero seguro. "
            "El temporario es emocionante, pero te puede dejar "
            "noches sin reservar y llorando en la puerta del "
            "consorcio porque el vecino se quejo del ruido."
        )
    elif rentabilidad_real_pct > rentabilidad_trad_pct:
        lines.append(
            f"Posta: El temporario rinde un poco mas. La diferencia "
            "no es enorme, pero existe. El problema es el trabajo "
            "extra: el alquiler tradicional es depositar el cheque "
            "y olvidarte. El temporario es una Pyme de hospitalidad. "
            "Si tenes tiempo y paciencia, rinde. Si no, el "
            "tradicional es menos plata pero mas libertad."
        )
    else:
        lines.append(
            f"Posta: El tradicional rinde mas que el temporario. "
            "Esto pasa cuando la ocupacion es baja o los precios "
            "por noche no justifican el laburo. La especulacion "
            "inmobiliaria del Airbnb esta cayendo en Argentina "
            "porque los alquileres tradicionales subieron mucho "
            "y la gente ya no puede pagar precios de vacaciones "
            "en su propia ciudad. El mercado ajusta, la clase "
            "obrera se queda sin donde vivir, y los inversores "
            "se preguntan por que bajo la ocupacion."
        )

    return "\n".join(lines)
