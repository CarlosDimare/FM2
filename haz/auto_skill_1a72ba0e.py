import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: ingreso_neto_deseado [gastos_mensuales] [categoria_monotributo]\n"
            "Calcula cuanto facturar por mes para llegar a un ingreso neto.\n"
            "Incluye monotributo, gastos, obra social, ahorro para vacaciones.\n"
            "Muestra facturacion necesaria, costo fiscal, y tarifa por hora.\n"
            "Ej: 1500000 200000 G\n"
            "Ej: USD 3000 500 F\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el ingreso neto deseado."

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
        neto = parse_num(parts[offset])
    except ValueError:
        return "Error: no se pudo parsear el ingreso neto."

    gastos = neto * 0.15
    categoria = None
    if len(parts) >= offset + 2:
        gastos = parse_num(parts[offset + 1])
    if len(parts) >= offset + 3:
        cat = parts[offset + 2].upper()
        if cat in ("A","B","C","D","E","F","G","H","I","J","K"):
            categoria = cat

    if is_usd:
        neto_ars = neto * 1400
        gastos_ars = gastos * 1400
    else:
        neto_ars = neto
        gastos_ars = gastos

    c = "USD" if is_usd else "ARS"
    blue = 1400

    categorias_costo = {
        "A": 28000, "B": 39000, "C": 55000, "D": 79000,
        "E": 114000, "F": 168000, "G": 242000, "H": 350000,
        "I": 505000, "J": 725000, "K": 1050000,
    }

    if categoria and categoria in categorias_costo:
        costo_monotributo = categorias_costo[categoria]
    else:
        for cat, lo in [("A",0),("B",1250000),("C",1850000),("D",2750000),("E",4250000),("F",6850000),("G",10500000),("H",16500000),("I",28500000),("J",42000000),("K",63000000)]:
            if neto_ars * 1.4 <= lo * 1.5:
                costo_monotributo = categorias_costo[cat]
                categoria = cat
                break
        else:
            costo_monotributo = 1050000
            categoria = "K"

    obra_social = 35000
    if not is_usd:
        obra_social_ars = obra_social
    else:
        obra_social_ars = obra_social * blue

    ahorro_vacaciones = neto_ars * 0.0833
    imprevistos = neto_ars * 0.05
    ahorro_jubilatorio = neto_ars * 0.05

    total_gastos_mes = gastos_ars + costo_monotributo + obra_social_ars + ahorro_vacaciones + imprevistos + ahorro_jubilatorio
    facturacion_necesaria = neto_ars + total_gastos_mes

    horas_mes = 160
    tasa_ocupacion = 0.80
    horas_facturables = horas_mes * tasa_ocupacion

    tarifa_hora = facturacion_necesaria / horas_facturables if horas_facturables > 0 else 0

    facturacion_anual = facturacion_necesaria * 12
    carga_fiscal_pct = ((costo_monotributo + obra_social_ars) / facturacion_necesaria) * 100 if facturacion_necesaria > 0 else 0

    lines = []
    lines.append("CUANTO FACTURAR COMO FREELANCE")
    lines.append(f"Ingreso neto deseado: {c} {neto:,.0f}")
    lines.append(f"Mensual:              {c} {neto_ars:,.0f}")
    if is_usd:
        lines.append(f"  (ARS: $ {neto_ars:,.0f})")
    lines.append("---")
    lines.append("GASTOS Y AHORROS:")
    lines.append(f"  Gastos operativos:        {c} {gastos:,.0f}")
    lines.append(f"  Monotributo ({categoria}):           {c} {costo_monotributo:,.0f}")
    lines.append(f"  Obra social:              {c} {obra_social_ars:,.0f}")
    lines.append(f"  Ahorro vacaciones:        {c} {ahorro_vacaciones:,.0f}")
    lines.append(f"  Imprevistos (5%):         {c} {imprevistos:,.0f}")
    lines.append(f"  Ahorro jubilatorio (5%):  {c} {ahorro_jubilatorio:,.0f}")
    lines.append(f"  TOTAL COSTOS:             {c} {total_gastos_mes:,.0f}")
    lines.append("")
    lines.append(f"FACTURACION NECESARIA:")
    lines.append(f"  Por mes:   {c} {facturacion_necesaria:,.0f}")
    lines.append(f"  Por ano:   {c} {facturacion_anual:,.0f}")
    lines.append(f"  Carga fiscal: {carga_fiscal_pct:.0f}% sobre facturacion")
    lines.append("")
    lines.append(f"TARIFA POR HORA:")
    lines.append(f"  Horas facturables/mes: {horas_facturables:.0f} (80% de {horas_mes}h)")
    lines.append(f"  Tarifa minima: {c} {tarifa_hora:,.0f}/h")
    lines.append("")
    lines.append(f"PORCENTAJE SOBRE FACTURACION:")
    lines.append(f"  Neto:    {(neto_ars/facturacion_necesaria)*100:.0f}%")
    lines.append(f"  Costos:  {(total_gastos_mes/facturacion_necesaria)*100:.0f}%")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Facturacion mensual:  USD {facturacion_necesaria/blue:,.0f}")
        lines.append(f"  Facturacion anual:    USD {facturacion_anual/blue:,.0f}")
        lines.append(f"  Tarifa hora:          USD {tarifa_hora/blue:,.0f}")

    lines.append("")
    lines.append(
        f"Posta: Para ganar {c} {neto:,.0f} netos, necesitas "
        f"facturar {c} {facturacion_necesaria:,.0f}. La diferencia "
        "son los costos de ser freelance: monotributo, obra social, "
        "y los ahorros que tu jefe no te da (vacaciones, aguinaldo, "
        "jubilacion). Si sumas todo, ser freelance cuesta entre un "
        "20 y 40% mas que la relacion de dependencia para el mismo "
        "neto. Por eso los freelancers cobran mas por hora: "
        "no es que sean caros, es que se pagan TODO ellos."
    )

    return "\n".join(lines)
