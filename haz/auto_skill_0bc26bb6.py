import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_bruto_mensual [gasto_mensual_estimado] [hijos]\n"
            "Calcula tu presion fiscal total en Argentina.\n"
            "Incluye Ganancias, IVA estimado sobre consumo, Bienes Personales,\n"
            "impuestos provinciales y municipales.\n"
            "Muestra cuanto de tu ingreso se va realmente en impuestos.\n"
            "Ej: 2500000 400000 0\n"
            "Ej: USD 4000 1500 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el salario bruto mensual."

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
    except ValueError:
        return "Error: no se pudo parsear el salario."

    gasto_mensual = salary * 0.6
    hijos = 0

    if len(parts) >= offset + 2:
        gasto_mensual = parse_num(parts[offset + 1])
    if len(parts) >= offset + 3:
        try:
            hijos = int(float(parts[offset + 2]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    SAC = salary / 2
    annual_gross = salary * 12 + SAC

    deduccion_general = 12 * 419_000
    deduccion_hijos = hijos * 12 * 251_000
    total_deducciones = deduccion_general + deduccion_hijos

    min_imponible = 12 * 1_400_000
    neto_imponible = max(0, annual_gross - total_deducciones)

    if neto_imponible <= min_imponible:
        ganancias_annual = 0
    else:
        scale = [
            (0, 1400000, 0.05),
            (1400001, 2800000, 0.09),
            (2800001, 4200000, 0.12),
            (4200001, 5600000, 0.15),
            (5600001, 7000000, 0.19),
            (7000001, 8400000, 0.23),
            (8400001, 9800000, 0.27),
            (9800001, 11200000, 0.31),
            (11200001, float("inf"), 0.35),
        ]
        ganancias_annual = 0
        remaining = neto_imponible - min_imponible
        for lo, hi, rate in scale:
            if remaining <= 0:
                break
            bracket = min(hi - lo, remaining) if hi != float("inf") else remaining
            ganancias_annual += bracket * rate
            remaining -= bracket

    ganancias_monthly = ganancias_annual / 12

    aportes_jubilatorios = salary * 0.11
    obra_social = salary * 0.03
    sindicato = salary * 0.02
    deducciones_legales = aportes_jubilatorios + obra_social + sindicato

    iva_estimado = gasto_mensual * 0.21
    impuesto_pais = gasto_mensual * 0.02
    ingresos_brutos_est = gasto_mensual * 0.025
    tasas_municipales_est = gasto_mensual * 0.01
    impuestos_consumo = iva_estimado + impuesto_pais + ingresos_brutos_est + tasas_municipales_est

    bienes_personales_est = 0
    if not is_usd:
        if salary * 12 > 30_000_000:
            bienes_personales_est = salary * 12 * 0.0025 / 12
    else:
        if salary * 12 * blue > 30_000_000:
            bienes_personales_est = salary * 12 * blue * 0.0025 / 12

    total_tax_monthly = ganancias_monthly + deducciones_legales + impuestos_consumo + bienes_personales_est
    neto_mano = salary - ganancias_monthly - deducciones_legales
    pct_tax = (total_tax_monthly / salary) * 100 if salary > 0 else 0
    pct_direct = ((ganancias_monthly + deducciones_legales) / salary) * 100 if salary > 0 else 0
    pct_indirect = (impuestos_consumo / salary) * 100 if salary > 0 else 0

    lines = []
    lines.append(f"PRESION FISCAL TOTAL - ARGENTINA")
    lines.append(f"Salario bruto: {c} {salary:,.0f}")
    lines.append(f"Gasto estimado: {c} {gasto_mensual:,.0f}")
    lines.append(f"Hijos: {hijos}")
    lines.append("---")
    lines.append("IMPUESTOS DIRECTOS (salen del recibo):")
    lines.append(f"  Ganancias:           {c} {ganancias_monthly:,.0f}")
    lines.append(f"  Aportes (11%):       {c} {aportes_jubilatorios:,.0f}")
    lines.append(f"  Obra social (3%):    {c} {obra_social:,.0f}")
    lines.append(f"  Sindicato (2%):      {c} {sindicato:,.0f}")
    lines.append(f"  Total directos:      {c} {ganancias_monthly + deducciones_legales:,.0f} ({pct_direct:.0f}%)")
    lines.append("")
    lines.append("IMPUESTOS INDIRECTOS (en cada compra):")
    lines.append(f"  IVA (21%):           {c} {iva_estimado:,.0f}")
    lines.append(f"  Impuesto PAIS:       {c} {impuesto_pais:,.0f}")
    lines.append(f"  IIBB (2.5%):         {c} {ingresos_brutos_est:,.0f}")
    lines.append(f"  Tasas municipales:   {c} {tasas_municipales_est:,.0f}")
    lines.append(f"  Total indirectos:    {c} {impuestos_consumo:,.0f} ({pct_indirect:.0f}%)")
    lines.append("")
    if bienes_personales_est > 0:
        lines.append(f"  Bienes Personales:   {c} {bienes_personales_est:,.0f}")
    lines.append("")
    lines.append(f"RESUMEN MENSUAL:")
    lines.append(f"  Bruto:               {c} {salary:,.0f}")
    lines.append(f"  Impuestos totales:   {c} {total_tax_monthly:,.0f} ({pct_tax:.0f}%)")
    lines.append(f"  Neto en mano:        {c} {neto_mano:,.0f}")

    lines.append("")
    if pct_tax > 50:
        lines.append(
            f"Posta: El {pct_tax:.0f}% de tu ingreso se va en impuestos. "
            "Sos un heroe fiscal: laburas la mitad del ano para el "
            "Estado y la otra mitad para vos. Argentina tiene una "
            "de las presiones fiscales mas altas de LATAM y "
            "servicios publicos mediocres. Pagas como en Suecia, "
            "vives como en ... bueno, como en Argentina. No es "
            "que los impuestos sean altos: es que los servicios "
            "son caros y malos. La ecuacion no cierra."
        )
    elif pct_tax > 35:
        lines.append(
            f"Posta: {pct_tax:.0f}% de presion fiscal. Estas en el "
            "promedio alto argentino. La clase media paga todo: "
            "ganancias, IVA, IIBB, tasas. Y recibe poco. El "
            "problema no es pagar impuestos: es que el 60% "
            "de la economia argentina esta en negro y no paga "
            "nada. Los impuestos los pagamos los que estamos "
            "en blanco. Es el impuesto a la honestidad."
        )
    elif pct_tax > 20:
        lines.append(
            f"Posta: {pct_tax:.0f}% de presion fiscal. No es tan alta "
            "para el estandar argentino. O ganas poco (no pagas "
            "Ganancias) o consumis menos. La buena noticia: "
            "tu carga fiscal es moderada. La mala: los servicios "
            "publicos son los mismos que para el que paga el 50%."
        )
    else:
        lines.append(
            f"Posta: {pct_tax:.0f}% de presion fiscal. Esta baja. "
            "Probablemente no pagas Ganancias y consumis poco. "
            "O sos muy pobre o muy inteligente evadiendo. "
            "En cualquiera de los dos casos, el Estado te "
            "saca menos. Pero te da lo mismo que al que "
            "paga el 50%. La paradoja argentina."
        )

    return "\n".join(lines)
