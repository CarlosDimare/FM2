import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: consumo_watts horas_dia [costo_kwh] [dias_mes]\n"
            "Calcula el costo de consumir un electrodomestico.\n"
            "Muestra kWh por mes, costo, y emisiones de CO2 estimadas.\n"
            "Ej: 2000 4 45 30 (un aire acondicionado de 2000W)\n"
            "Ej: 150 8 45 (una heladera de 150W)\n"
            "Soporta sufijos k/M para costo_kwh."
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: faltan parametros (watts horas [costo_kwh] [dias])."

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
        watts = float(parts[0])
        hours = float(parts[1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    cost_kwh = 45.0
    if len(parts) >= 3:
        cost_kwh = parse_num(parts[2])
    days = 30
    if len(parts) >= 4:
        days = int(float(parts[3]))

    kw = watts / 1000
    kwh_per_day = kw * hours
    kwh_per_month = kwh_per_day * days
    kwh_per_year = kwh_per_month * 12

    cost_per_day = kwh_per_day * cost_kwh
    cost_per_month = kwh_per_month * cost_kwh
    cost_per_year = kwh_per_year * cost_kwh

    co2_per_kwh = 0.35
    co2_monthly = kwh_per_month * co2_per_kwh

    equivalent_appliances = {
        "Aire acondicionado (2200W)": 2200,
        "Heladera (150W)": 150,
        "Lavarropas (500W)": 500,
        "Microondas (1200W)": 1200,
        "Plancha (1500W)": 1500,
        "TV LED (100W)": 100,
        "PC escritorio (300W)": 300,
        "Notebook (60W)": 60,
        "Ventilador (75W)": 75,
        "Cargador celu (10W)": 10,
        "Termotanque (1500W)": 1500,
        "Horno electrico (2000W)": 2000,
    }

    eq_lines = []
    for name, eq_w in sorted(equivalent_appliances.items(), key=lambda x: abs(x[1] - watts)):
        if abs(eq_w - watts) > 50:
            equivalent = round(watts / eq_w, 1)
            if equivalent >= 0.5:
                eq_lines.append(f"    {equivalent:.1f}x {name}")

    lines = []
    lines.append(f"CONSUMO ELECTRICO")
    lines.append(f"Artefacto: {watts:.0f}W")
    lines.append(f"Uso: {hours:.0f} h/dia x {days} dias/mes")
    lines.append(f"Costo kWh: $ {cost_kwh:.0f}")
    lines.append("---")
    lines.append(f"CONSUMO:")
    lines.append(f"  Por dia:  {kwh_per_day:.2f} kWh")
    lines.append(f"  Por mes:  {kwh_per_month:.1f} kWh")
    lines.append(f"  Por ano:  {kwh_per_year:.0f} kWh")
    lines.append("")
    lines.append(f"COSTO:")
    lines.append(f"  Por dia:  $ {cost_per_day:,.0f}")
    lines.append(f"  Por mes:  $ {cost_per_month:,.0f}")
    lines.append(f"  Por ano:  $ {cost_per_year:,.0f}")
    lines.append("")
    lines.append(f"EMISIONES DE CO2:")
    lines.append(f"  Por mes: {co2_monthly:.1f} kg ({co2_monthly*12:.0f} kg/ano)")
    lines.append(f"  Equivale a {co2_monthly*12/2000:.1f} autos por ano")
    lines.append("")
    lines.append(f"EQUIVALENCIA (comparado con otros artefactos):")
    for e in eq_lines[:5]:
        lines.append(e)

    if not eq_lines:
        pass

    lines.append("")
    if watts >= 2000:
        lines.append(
            f"Posta: {watts:.0f}W es un artefacto de alto consumo. "
            "Un aire acondicionado prendido 8 horas por dia durante "
            "todo el verano te cuesta casi 30 lucas por mes. Y cuando "
            "llegue la boleta de Edenor/Edesur, te vas a preguntar "
            "si realmente vale la pena tener 22 grados en febrero."
        )
    elif watts >= 500:
        lines.append(
            f"Posta: {watts:.0f}W es consumo medio. No es un "
            "vampiro energetico pero tampoco es un LED. Si tenes "
            "varios artefactos de este tipo encendidos al mismo "
            "tiempo, la boleta se va al carajo. El pico de consumo "
            "de la clase media argentina: la heladera, el tele y "
            "la compu prendidos mientras el aire no llega."
        )
    elif watts >= 50:
        lines.append(
            f"Posta: {watts:.0f}W es bajo consumo. Estos artefactos "
            "no te van a fundir pero suman. 10 dispositivos de 50W "
            "prendidos todo el dia son 500W constantes. El capitalismo "
            "te vende eficiencia en cada aparato pero tenes 20 "
            "aparatos. Eficiencia energetica no es tener LEDs, es "
            "apagar lo que no usas. Pero nadie apaga nada."
        )
    else:
        lines.append(
            f"Posta: {watts:.0f}W es consumo minimo. Esto es lo que "
            "gasta un cargador o un LED. No te preocupes por esto. "
            "Preocupate por el vecino que tiene el aire a 18 grados "
            "y la puerta abierta. El que mas gasta, mas contamina. "
            "Y en Argentina, el que mas gasta es el que menos paga "
            "por kWh (subsidios a los barrios ricos)."
        )

    return "\n".join(lines)
