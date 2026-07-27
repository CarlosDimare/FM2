import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_auto km_mensuales nafta_x_litro [seguro_mensual] [patente_anual] [mantenimiento_anual]\n"
            "Calcula el costo real de tener un auto por mes y por ano.\n"
            "Incluye nafta, seguro, patente, mantenimiento, y amortizacion.\n"
            "Ej: 15000000 800 1300 45000 70000 200000\n"
            "Ej: USD 20000 500 1.2 150 200 500\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (precio km nafta_x_litro [seguro] [patente] [mantenimiento])."

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
        car_price = parse_num(parts[offset])
        km_monthly = float(parts[offset + 1])
        fuel_price = parse_num(parts[offset + 2])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    seguro = 0
    patente = 0
    mantenimiento = 0
    if len(parts) >= offset + 4:
        seguro = parse_num(parts[offset + 3])
    if len(parts) >= offset + 5:
        patente = parse_num(parts[offset + 4])
    if len(parts) >= offset + 6:
        mantenimiento = parse_num(parts[offset + 5])

    c = "USD" if is_usd else "ARS"
    blue = 1400
    km_per_liter = 12.0
    depreciation_rate = 0.15

    fuel_monthly = (km_monthly / km_per_liter) * fuel_price
    patente_monthly = patente / 12
    mantenimiento_monthly = mantenimiento / 12
    depreciation_monthly = car_price * depreciation_rate / 12

    total_monthly = fuel_monthly + seguro + patente_monthly + mantenimiento_monthly + depreciation_monthly
    total_annual = total_monthly * 12

    cost_per_km = total_monthly / km_monthly if km_monthly > 0 else 0

    if not is_usd:
        total_usd_monthly = total_monthly / blue
        total_usd_annual = total_annual / blue
    else:
        total_usd_monthly = total_monthly
        total_usd_annual = total_annual

    lines = []
    lines.append(f"COSTO REAL DE TENER UN AUTO")
    if not is_usd:
        lines.append(f"Precio: $ {car_price:,.0f} (USD {car_price/blue:,.0f})")
    else:
        lines.append(f"Precio: USD {car_price:,.0f}")
    lines.append(f"Km por mes: {km_monthly:,.0f}")
    lines.append(f"Rendimiento: {km_per_liter:.0f} km/l")
    lines.append("---")
    lines.append("COSTOS MENSUALES:")
    lines.append(f"  Nafta:           {c} {fuel_monthly:,.0f}")
    lines.append(f"  Seguro:          {c} {seguro:,.0f}")
    lines.append(f"  Patente:         {c} {patente_monthly:,.0f}")
    lines.append(f"  Mantenimiento:   {c} {mantenimiento_monthly:,.0f}")
    lines.append(f"  Amortizacion:    {c} {depreciation_monthly:,.0f} (15% anual)")
    lines.append(f"  TOTAL:           {c} {total_monthly:,.0f}")
    lines.append("")
    lines.append(f"COSTO POR KM: {c} {cost_per_km:,.0f}")
    lines.append(f"COSTO ANUAL:  {c} {total_annual:,.0f}")
    lines.append("")
    lines.append(f"DESGLOSE PORCENTUAL:")
    pct_fuel = (fuel_monthly / total_monthly) * 100
    pct_seguro = (seguro / total_monthly) * 100
    pct_patente = (patente_monthly / total_monthly) * 100
    pct_mant = (mantenimiento_monthly / total_monthly) * 100
    pct_dep = (depreciation_monthly / total_monthly) * 100
    lines.append(f"  Nafta:         {pct_fuel:.0f}%")
    lines.append(f"  Seguro:        {pct_seguro:.0f}%")
    lines.append(f"  Patente:       {pct_patente:.0f}%")
    lines.append(f"  Mantenimiento: {pct_mant:.0f}%")
    lines.append(f"  Amortizacion:  {pct_dep:.0f}%")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual: USD {total_usd_monthly:,.0f}")
        lines.append(f"  Anual:   USD {total_usd_annual:,.0f}")
        lines.append(f"  Por km:  USD {cost_per_km/blue:,.0f}")

    pct_amort = pct_dep
    lines.append("")
    if pct_amort > 40:
        lines.append(
            f"Posta: La amortizacion del auto es el {pct_amort:.0f}% del costo "
            "total. Esto significa que tu auto pierde mas plata por existir "
            "que por moverse. Un auto 0km pierde 15-20% de su valor el "
            "primer ano, y 10-15% los siguientes. Si lo pagaste financiado, "
            "la deuda vale mas que el auto durante los primeros 2 anos. "
            "Comprar un auto nuevo en Argentina es el lujo mas caro que "
            "podes tener despues de un divorcio."
        )
    elif pct_fuel > 40:
        lines.append(
            f"Posta: La nafta es el {pct_fuel:.0f}% del costo. O viajas "
            "muchos km o tenes un auto que bebe como marinero en puerto. "
            "En Argentina la nafta esta subsidiada (mas barata que en Europa) "
            "pero igual te rompe el bolsillo. Y cada vez que el gobierno "
            "devalua, la nafta sube al dia siguiente. Es el impuesto "
            "invisible al que labura y vive lejos."
        )
    elif pct_seguro > 25:
        lines.append(
            f"Posta: El seguro es el {pct_seguro:.0f}% del costo. "
            "Tipico de auto caro o zona cara. El seguro en Argentina "
            "es caro porque TODO el mundo maneja mal (incluyendote) "
            "y porque los arreglos de chapa y pintura cuestan lo mismo "
            "que un viaje a Brasil. Asegurate de tener seguro contra "
            "terceros completo, porque el de tu vieja no cubre un "
            "choque contra un cero km."
        )
    else:
        lines.append(
            f"Posta: Tus costos estan distribuidos relativamente parejos. "
            "Pero sumando todo, tener un auto cuesta mas que la mayoria "
            "de la gente cree. La pregunta que nadie se hace: 'si en "
            "lugar de tener auto, pusiera esa plata en un plazo fijo "
            "y usara Uber, me rinde?' La respuesta suele ser si. "
            "Pero un auto no es transporte: es libertad. O la ilusion de."
        )

    return "\n".join(lines)
