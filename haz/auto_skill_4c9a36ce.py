import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_auto precio_auto km_mensuales [anios] [nafta_litro]\n"
            "Calcula el costo total de tener un auto en Argentina:\n"
            "patente, seguro, nafta, mantenimiento, cubiertas, garage.\n"
            "Muestra costo mensual, anual, costo por km, y porcentaje del salario.\n"
            "Ej: 15000000 1000 5\n"
            "Ej: USD 10000 800 3\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (precio_auto km_mensuales [anios] [nafta_litro])."

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
        precio = parse_num(parts[offset])
        km = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    anios = 5
    nafta_litro = 1100
    if len(parts) >= offset + 3:
        anios = int(float(parts[offset + 2]))
    if len(parts) >= offset + 4:
        nafta_litro = parse_num(parts[offset + 3])

    c = "USD" if is_usd else "ARS"
    blue = 1400
    nafta_litro_c = nafta_litro

    if is_usd:
        precio_ars = precio * blue
        nafta_litro_ars = nafta_litro * blue
    else:
        precio_ars = precio
        nafta_litro_ars = nafta_litro

    km_anual = km * 12
    km_total = km_anual * anios

    depreciacion = precio_ars * 0.15
    patente = precio_ars * 0.035
    seguro_anual = precio_ars * 0.06
    nafta_anual = (km_anual / 12) * nafta_litro_ars
    mantenimiento_anual = precio_ars * 0.04
    cubiertas_anual = precio_ars * 0.015
    garage_anual = precio_ars * 0.012

    total_anual = depreciacion + patente + seguro_anual + nafta_anual + mantenimiento_anual + cubiertas_anual + garage_anual
    total_mensual = total_anual / 12
    costo_km = total_anual / km_anual if km_anual > 0 else 0

    salario_ref = 1000000
    if is_usd:
        salario_ref_ars = salario_ref * blue
    else:
        salario_ref_ars = salario_ref
    pct_salario = (total_mensual / salario_ref_ars) * 100

    lines = []
    lines.append("COSTO TOTAL DE TENER UN AUTO")
    lines.append(f"Precio:              {c} {precio:,.0f}")
    lines.append(f"Km/mes:              {km:.0f}")
    lines.append(f"Periodo:             {anios} anios")
    lines.append(f"Nafta:               {c} {nafta_litro_c:,.0f}/litro")
    lines.append("---")
    lines.append("COSTOS ANUALES ESTIMADOS:")
    lines.append(f"  Depreciacion (15%):     {c} {depreciacion/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Patente (3.5%):         {c} {patente/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Seguro (6%):            {c} {seguro_anual/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Nafta ({km_anual:.0f}km, 12km/l):  {c} {nafta_anual/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Mantenimiento (4%):     {c} {mantenimiento_anual/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Cubiertas (1.5%):       {c} {cubiertas_anual/ (1 if is_usd else 1):,.0f}")
    lines.append(f"  Garage/lavado (1.2%):   {c} {garage_anual/ (1 if is_usd else 1):,.0f}")
    lines.append("---")
    ars_mult = 1 if not is_usd else blue
    lines.append(f"TOTAL ANUAL:              {c} {total_anual/ars_mult:,.0f}")
    lines.append(f"TOTAL MENSUAL:            {c} {total_mensual/ars_mult:,.0f}")
    lines.append(f"COSTO POR KM:             {c} {costo_km/ars_mult:,.2f}/km")
    lines.append("")
    lines.append(f"PORCENTAJE DEL SALARIO:")
    lines.append(f"  {pct_salario:.1f}% de {c} {salario_ref:,.0f}")
    if pct_salario > 40:
        lines.append(
            "Posta: El auto te come MAS DEL 40% de tu ingreso. "
            "Basicamente laburas para mantener el auto. "
            "El transporte publico existe y sale 50 veces menos. "
            "No es un auto, es un agujero con ruedas donde "
            "tiras plata todos los meses. "
            "La libertad del auto propio es un mito: "
            "la realidad es que estas encadenado al "
            "taller, la patente, el seguro y el surtidor. "
        )
    elif pct_salario > 20:
        lines.append(
            f"Posta: El auto te come el {pct_salario:.0f}% de tu ingreso. "
            "Te da movilidad pero te la cobra cara. "
            "Si tuvieras ese dinero en un plazo fijo, "
            "viajabas en bondi y te ibas de vacaciones. "
            "El auto no es un lujo, es una decision. "
            "La pregunta es que preferis: libertad "
            "financiera o libertad de movimiento. "
            "La clase media elige las dos y termina "
            "sin ninguna."
        )
    else:
        lines.append(
            f"Posta: Solo el {pct_salario:.0f}% de tu ingreso. "
            "O tenes un auto eficiente o ganas bien. "
            "Probablemente el auto no es nuevo, "
            "o lo pagaste antes de la inflacion. "
            "Disfrutalo mientras dure: la proxima "
            "reparacion te puede cambiar la cuenta."
        )

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:     USD {total_mensual/blue:,.0f}")
        lines.append(f"  Costo/km:    USD {costo_km/blue:,.3f}")

    return "\n".join(lines)
