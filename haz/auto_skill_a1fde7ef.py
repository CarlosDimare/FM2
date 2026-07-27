import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual gasto_mensual_total [porcentaje_iva]\n"
            "Calcula cuanto IVA pagas por mes y por anio.\n"
            "Muestra el IVA sobre tu consumo, que porcentaje de tu\n"
            "salario se va en IVA, y comparacion contra Ganancias.\n"
            "Ej: 2500000 400000 21\n"
            "Ej: USD 3000 1500 10\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (salario gasto_mensual [iva_pct])."

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
        salary = parse_num(parts[offset])
        gasto = parse_num(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    iva_pct = 21.0
    if len(parts) >= offset + 3:
        iva_pct = float(parts[offset + 2])

    c = "USD" if is_usd else "ARS"
    blue = 1400
    iva_rate = iva_pct / 100

    iva_mensual = gasto * iva_rate
    iva_anual = iva_mensual * 12
    pct_salario_iva = (iva_mensual / salary) * 100 if salary > 0 else 0

    iva_sobre_ingreso = salary * 0.4 * iva_rate
    iva_total_estimado = iva_sobre_ingreso * 12

    canasta_basica = 350000
    if is_usd:
        canasta_basica = 500
    iva_canasta = canasta_basica * iva_rate

    equivalencias = [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal", 4000),
        ("cafe", 3500),
        ("viaje en bondi", 1200),
        ("entrada de cine", 5000),
    ]

    lines = []
    lines.append(f"IVA - IMPUESTO AL CONSUMO")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append(f"Gasto mensual: {c} {gasto:,.0f}")
    lines.append(f"Tasa IVA: {iva_pct:.0f}%")
    lines.append("---")
    lines.append("CUANTO IVA PAGAS:")
    lines.append(f"  IVA sobre tu consumo:   {c} {iva_mensual:,.0f}/mes")
    lines.append(f"                          {c} {iva_anual:,.0f}/ano")
    lines.append(f"  = {pct_salario_iva:.1f}% de tu salario solo en IVA")
    lines.append("")
    lines.append("IVA ESTIMADO SOBRE GASTO TOTAL:")
    lines.append(f"  Si gastas el 60% de tu salario en cosas con IVA:")
    lines.append(f"  IVA mensual: {c} {iva_sobre_ingreso:,.0f}")
    lines.append(f"  IVA anual:   {c} {iva_total_estimado:,.0f}")
    lines.append("")
    lines.append("IVA EN LA CANASTA BASICA MENSUAL:")
    lines.append(f"  Canasta basica: {c} {canasta_basica:,.0f}")
    lines.append(f"  IVA incluido:   {c} {iva_canasta:,.0f}")
    lines.append("")
    lines.append(f"COMPARACION: IVA vs GANANCIAS")
    lines.append(f"  IVA mensual:       {c} {iva_mensual:,.0f} ({pct_salario_iva:.1f}% del salario)")
    lines.append(f"  Ganancias tipica:  ~{c} {salary*0.08:,.0f} (~8% del salario)")
    lines.append(f"  El IVA es {iva_mensual/(salary*0.08):.1f}x lo que pagas de Ganancias")

    lines.append("")
    lines.append("EQUIVALENCIA DEL IVA ANUAL:")
    for item, cost in equivalencias:
        cant = iva_anual / cost
        if cant >= 10:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 2:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  IVA mensual: USD {iva_mensual/blue:,.0f}")
        lines.append(f"  IVA anual:   USD {iva_anual/blue:,.0f}")

    lines.append("")
    lines.append(
        f"Posta: El IVA es el impuesto mas regresivo de Argentina. "
        "Paga lo mismo el que gana 500 lucas que el que gana 5 "
        "millones, porque el IVA es sobre el consumo, no sobre "
        "el ingreso. La clase baja gasta el 100% de su sueldo "
        "en consumo (paga IVA sobre todo). La clase alta ahorra "
        "e invierte (no paga IVA sobre lo que ahorra). Resultado: "
        "el pobre paga mas IVA proporcionalmente que el rico. "
        "No es un impuesto, es un impuestazo a la pobreza."
    )

    return "\n".join(lines)
