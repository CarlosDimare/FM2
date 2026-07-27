import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: ingreso_mensual_bruto [USD] categoria_monotributo [horas_semana]\n"
            "Calcula el ingreso real despues de monotributo, obra social,\n"
            "y el valor de cada hora efectiva de trabajo.\n"
            "Ej: 500000 A 40\n"
            "Ej: USD 3000\n"
            "Ej: 800k B 30\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el ingreso mensual bruto."

    raw_income = parts[offset].upper()
    try:
        income = float(raw_income.replace("K", "").replace("M", ""))
        if "K" in raw_income:
            income *= 1000
        elif "M" in raw_income:
            income *= 1_000_000
    except ValueError:
        return "Error: ingreso invalido."

    categoria = ""
    hora_offset = offset + 1
    if len(parts) > hora_offset and re.match(r"^[A-H]$", parts[hora_offset].upper()):
        categoria = parts[hora_offset].upper()
        hora_offset += 1

    hours_per_week = 40
    if len(parts) > hora_offset:
        try:
            hours_per_week = float(parts[hora_offset])
        except ValueError:
            pass

    currency = "USD" if is_usd else "ARS"

    # Monotributo 2026 approximate monthly cost by category
    mono_costs = {
        "A": 0,  # placeholder - lowest
        "B": 0,
        "C": 0,
        "D": 0,
        "E": 0,
        "F": 0,
        "G": 0,
        "H": 0,
    }

    if not is_usd:
        mono_costs = {
            "A": 35000,
            "B": 52000,
            "C": 72000,
            "D": 98000,
            "E": 130000,
            "F": 170000,
            "G": 220000,
            "H": 280000,
        }

    weekly_hours = hours_per_week
    monthly_hours = weekly_hours * 4.33
    annual_hours = monthly_hours * 12

    # Deductions
    if categoria and categoria in mono_costs:
        mono_cost = mono_costs[categoria]
    else:
        # Auto-detect category from income in ARS
        if is_usd:
            mono_cost = 0
        else:
            if income < 200000:
                mono_cost = mono_costs["A"]
            elif income < 350000:
                mono_cost = mono_costs["B"]
            elif income < 500000:
                mono_cost = mono_costs["C"]
            elif income < 700000:
                mono_cost = mono_costs["D"]
            elif income < 950000:
                mono_cost = mono_costs["E"]
            elif income < 1300000:
                mono_cost = mono_costs["F"]
            elif income < 1700000:
                mono_cost = mono_costs["G"]
            else:
                mono_cost = mono_costs["H"]

    obra_social_pct = 0.03  # approximate
    obra_social = income * obra_social_pct

    # Effective work stats (discount 20% for admin, downtime, vacation)
    util_pct = 0.80
    effective_monthly_hours = monthly_hours * util_pct
    effective_annual_hours = annual_hours * util_pct

    total_deductions = mono_cost + obra_social
    net_monthly = income - total_deductions
    net_monthly_rate = (net_monthly / income) * 100 if income > 0 else 0

    gross_hourly = income / monthly_hours if monthly_hours > 0 else 0
    net_hourly = net_monthly / effective_monthly_hours if effective_monthly_hours > 0 else 0

    annual_income = income * 12
    annual_net = net_monthly * 12
    annual_deductions = total_deductions * 12

    lines = []
    lines.append(f"Facturacion mensual bruta: {currency} {income:,.0f}")
    if categoria:
        lines.append(f"Monotributo categoria: {categoria}")
    lines.append(f"Horas semanales: {weekly_hours:.0f} ({monthly_hours:.0f}/mes)")
    lines.append(f"Tasa de ocupacion efectiva: {util_pct*100:.0f}% (admins, downtime, vacaciones)")
    lines.append("---")
    lines.append(f"Deducciones mensuales:")
    lines.append(f"  Monotributo: {currency} {mono_cost:,.0f}" if not is_usd else f"  Monotributo: exento (USD)")
    lines.append(f"  Obra social (3%): {currency} {obra_social:,.0f}")
    lines.append(f"  Total deducciones: {currency} {total_deductions:,.0f}")
    lines.append(f"  Ingreso neto mensual: {currency} {net_monthly:,.0f} ({net_monthly_rate:.0f}% del bruto)")
    lines.append("---")
    lines.append(f"Valor hora:")
    lines.append(f"  Bruto x hora (nominal): {currency} {gross_hourly:,.0f}")
    lines.append(f"  Neto x hora (real, c/ocu. 80%): {currency} {net_hourly:,.0f}")
    lines.append("---")
    lines.append(f"Proyeccion anual:")
    lines.append(f"  Bruto: {currency} {annual_income:,.0f}")
    lines.append(f"  Neto: {currency} {annual_net:,.0f}")
    lines.append(f"  Perdido en deducciones: {currency} {annual_deductions:,.0f}")

    if not is_usd and net_hourly > 0:
        blue = 1400
        net_hourly_usd = net_hourly / blue
        net_monthly_usd = net_monthly / blue
        lines.append("---")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  Neto mensual: USD {net_monthly_usd:,.0f}")
        lines.append(f"  Hora neta: USD {net_hourly_usd:,.0f}")

    lines.append("")
    if net_monthly_rate < 70:
        lines.append(
            "Posta: Te estas comiendo un 30%+ de tu facturacion en costos fijos. "
            "Si estas en relacion de dependencia, tu empleador paga otro 30% arriba "
            "que vos no ves. La diferencia entre lo que te pagan y lo que le cuestas "
            "a la empresa es la plusvalia mas transparente del sistema."
        )
    elif net_monthly_rate < 85:
        lines.append(
            "Posta: Perdes entre 15 y 30% en deducciones. En relacion de dependencia, "
            "tu empleador paga contribuciones patronales adicionales que ni figura"
            "n en tu recibo. El costo laboral total es ~50% mas de lo que ves."
        )
    else:
        lines.append(
            "Posta: Deducciones bajas. Estas en monotributo bajo o sos tan pobre "
            "que no llegas a las categorias altas. En cualquiera de los dos casos: "
            "cobra mas. O factura en USD."
        )

    return "\n".join(lines)
