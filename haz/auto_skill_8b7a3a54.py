import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_bruto_mensual [USD]\n"
            "Calcula el valor real de los beneficios laborales en relacion\n"
            "de dependencia: aguinaldo, vacaciones, obra social, ART,\n"
            "indemnizacion, etc. Muestra el costo total para el empleador.\n"
            "Ej: 500000\n"
            "Ej: USD 2000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el salario bruto mensual."

    raw_salary = parts[offset].upper()
    try:
        salary = float(raw_salary.replace("K", "").replace("M", ""))
        if "K" in raw_salary:
            salary *= 1000
        elif "M" in raw_salary:
            salary *= 1_000_000
    except ValueError:
        return "Error: salario invalido."

    c = "USD" if is_usd else "ARS"

    if is_usd:
        contrib_patronal_pct = 0
        obra_social_pct = 0
        art_pct = 0
    else:
        contrib_patronal_pct = 21.0
        obra_social_pct = 6.0
        art_pct = 3.0

    monthly_contrib = salary * contrib_patronal_pct / 100
    monthly_os = salary * obra_social_pct / 100
    monthly_art = salary * art_pct / 100

    aguinaldo_monthly = salary / 12
    vacaciones_monthly = (salary * 1.0) / 12
    indemnizacion_monthly = (salary * 1.0) / 12 * 0.5

    total_monthly_cost = salary + monthly_contrib + monthly_os + monthly_art + aguinaldo_monthly + vacaciones_monthly + indemnizacion_monthly
    annual_cost = total_monthly_cost * 12
    annual_salary = salary * 12
    annual_extra = annual_cost - annual_salary

    extra_pct = ((total_monthly_cost / salary) - 1) * 100

    lines = []
    lines.append(f"Salario bruto mensual: {c} {salary:,.0f}")
    lines.append("---")
    lines.append(f"Costos mensuales para el empleador:")
    lines.append(f"  Salario bruto:          {c} {salary:,.0f}")
    lines.append(f"  Contrib. patronales:     {c} {monthly_contrib:,.0f} ({contrib_patronal_pct:.0f}%)")
    lines.append(f"  Obra social:             {c} {monthly_os:,.0f} ({obra_social_pct:.0f}%)")
    lines.append(f"  ART:                     {c} {monthly_art:,.0f} ({art_pct:.0f}%)")
    lines.append(f"  Aguinaldo (prorrateado): {c} {aguinaldo_monthly:,.0f}")
    lines.append(f"  Vacaciones (prorr.):     {c} {vacaciones_monthly:,.0f}")
    lines.append(f"  Indemnizacion (prorr.):  {c} {indemnizacion_monthly:,.0f}")
    lines.append("---")
    lines.append(f"  Costo total x mes:       {c} {total_monthly_cost:,.0f}")
    lines.append(f"  Diferencia sobre bruto:  +{extra_pct:.1f}%")
    lines.append("---")
    lines.append(f"  Costo anual total:       {c} {annual_cost:,.0f}")
    lines.append(f"  De los cuales extras:    {c} {annual_extra:,.0f}")

    if not is_usd:
        blue = 1400
        total_usd = annual_cost / blue
        salary_usd = annual_salary / blue
        extra_usd = annual_extra / blue
        lines.append("")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  Tu salario anual:         USD {salary_usd:,.0f}")
        lines.append(f"  Costo TOTAL del empleador: USD {total_usd:,.0f}")
        lines.append(f"  (Tu empleador paga USD {extra_usd:,.0f} extras que no ves)")

    lines.append("")
    if extra_pct > 70:
        lines.append(
            "Posta: Tu empleador paga casi 70% mas de lo que figura en tu recibo. "
            "Esa diferencia es el 'costo argentino' de tener un empleado en blanco. "
            "El empleador lo cuenta como 'carga', vos como 'derecho'. "
            "La diferencia de perspectiva se llama lucha de clases."
        )
    elif extra_pct > 50:
        lines.append(
            "Posta: El 50%+ extra que paga tu empleador no es caridad: es el precio "
            "de tener un trabajador formal que no lo va a demandar (tan facil). "
            "El aguinaldo, las vacaciones y la indemnizacion no son beneficio: "
            "son parte de tu salario diferido que el empleador administra."
        )
    else:
        lines.append(
            "Posta: Extra bajo. O estas en USD (sin cargas sociales) o tu empleador "
            "te esta pagando en negro partes del salario. Si es lo segundo, "
            "recorda: esa plata que no ves ahora es la jubilacion que no vas a tener."
        )

    return "\n".join(lines)
