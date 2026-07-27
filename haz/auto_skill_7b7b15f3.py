import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_bruto_mensual [hijos] [conyuge] [deduccion_adicional]\n"
            "Calcula el Impuesto a las Ganancias 4ta categoria (2026).\n"
            "Muestra neto mensual, retencion, alicuota efectiva, y comparacion USD.\n"
            "Ej: 3500000 2 1\n"
            "Ej: 5000000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()

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
        gross_monthly = parse_num(parts[0])
    except ValueError:
        return "Error: no se pudo parsear el salario bruto."

    dependants = 0
    spouse = False
    extra_deduction = 0

    if len(parts) >= 2:
        try:
            dependants = int(parts[1])
        except ValueError:
            pass

    if len(parts) >= 3:
        spouse_str = parts[2].lower()
        if spouse_str in ("s", "si", "1", "true"):
            spouse = True

    if len(parts) >= 4:
        try:
            extra_deduction = parse_num(parts[3])
        except ValueError:
            pass

    SAC = gross_monthly / 2
    annual_gross = gross_monthly * 12 + SAC

    deduccion_general = 12 * 419_000
    deduccion_esposa = 12 * 419_000 if spouse else 0
    deduccion_hijos = dependants * 12 * 251_000
    deduccion_extra = extra_deduction * 12

    total_deductions = deduccion_general + deduccion_esposa + deduccion_hijos + deduccion_extra

    min_imponible = 12 * 1_400_000
    neto_imponible = max(0, annual_gross - total_deductions)

    if neto_imponible <= min_imponible:
        tax_annual = 0
    else:
        scale = [
            (0, 1_400_000, 0.05),
            (1_400_001, 2_800_000, 0.09),
            (2_800_001, 4_200_000, 0.12),
            (4_200_001, 5_600_000, 0.15),
            (5_600_001, 7_000_000, 0.19),
            (7_000_001, 8_400_000, 0.23),
            (8_400_001, 9_800_000, 0.27),
            (9_800_001, 11_200_000, 0.31),
            (11_200_001, float("inf"), 0.35),
        ]
        tax_annual = 0
        remaining = neto_imponible
        for lo, hi, rate in scale:
            if remaining <= 0:
                break
            bracket = min(hi - lo, remaining) if hi != float("inf") else remaining
            tax_annual += bracket * rate
            remaining -= bracket

    tax_monthly = tax_annual / 12
    net_monthly = gross_monthly - tax_monthly
    effective_rate = (tax_monthly / gross_monthly) * 100 if gross_monthly > 0 else 0

    blue = 1400

    lines = []
    lines.append("GANANCIAS 4TA CATEGORIA (2026)")
    lines.append(f"Salario bruto mensual:  $ {gross_monthly:,.0f}")
    lines.append(f"SAC proporcional:       $ {SAC:,.0f}")
    lines.append(f"Bruto anual:            $ {annual_gross:,.0f}")
    lines.append("---")
    lines.append("DEDUCCIONES ANUALES:")
    lines.append(f"  General:   $ {deduccion_general:,.0f}")
    if spouse:
        lines.append(f"  Conyuge:   $ {deduccion_esposa:,.0f}")
    if dependants:
        lines.append(f"  Hijos ({dependants}): $ {deduccion_hijos:,.0f}")
    if extra_deduction:
        lines.append(f"  Adicional: $ {deduccion_extra:,.0f}")
    lines.append(f"  Total:     $ {total_deductions:,.0f}")
    lines.append("")
    lines.append(f"Neto imponible anual:   $ {neto_imponible:,.0f}")
    lines.append(f"Minimo no imponible:    $ {min_imponible:,.0f}")
    lines.append("")
    lines.append("RESULTADO:")
    lines.append(f"  Retencion mensual:    $ {tax_monthly:,.0f}")
    lines.append(f"  Neto mensual:         $ {net_monthly:,.0f}")
    lines.append(f"  Alicuota efectiva:    {effective_rate:.1f}%")
    lines.append("")
    lines.append(f"USD blue ({blue}):")
    lines.append(f"  Bruto mensual:  USD {gross_monthly/blue:,.0f}")
    lines.append(f"  Retencion:      USD {tax_monthly/blue:,.0f}")
    lines.append(f"  Neto mensual:   USD {net_monthly/blue:,.0f}")

    lines.append("")
    if tax_annual == 0:
        lines.append(
            "Posta: No pagas Ganancias. Felicitaciones, estas dentro del "
            "margen. Ojala dure, porque en Argentina cada vez que el "
            "gobierno necesita plata, lo primero que hace es correr el "
            "piso de Ganancias para que mas gente pague. Es el impuesto "
            "mas politico de todos: cuando conviene, pagan los que ganan "
            "mas de 15 palos. Cuando no, pagan los que ganan mas de 2."
        )
    elif effective_rate < 5:
        lines.append(
            "Posta: Ganancias te come menos del 5%. Estas en el escalon "
            "mas bajo del impuesto. Todavia no sufris la parte fea. "
            "Disfruta mientras puedas, porque el escalon siguiente duele."
        )
    elif effective_rate < 10:
        lines.append(
            "Posta: Retencion del 5-10%. No es terrible pero tampoco es "
            "nada. Estas en el grupo de los que 'ganan bien' para AFIP, "
            "lo que en la calle significa que llegas justo pero el Estado "
            "te considera rico. La clase media alta argentina: ganas bien "
            "en pesos, mal en dolares, y pagas como si fueras millonario."
        )
    elif effective_rate < 15:
        lines.append(
            "Posta: Retencion del 10-15%. Aca empieza el dolor real. "
            "Perdes mas de un mes de sueldo al año solo en Ganancias. "
            "No sos rico, pero el fisco te trata como tal. Sos "
            "profesional, probablemente de sistemas, y tu plusvalia "
            "se la lleva el Estado en lugar del patron. La pregunta "
            "existencial del dev argentino: 'Para esto estudio?'"
        )
    else:
        lines.append(
            "Posta: Mas del 15% de retencion. Estas en el escalon mas "
            "alto. Sos oficialmente 'clase alta' para AFIP, lo que en "
            "Argentina significa que tenes un buen pasar pero no te "
            "alcanza para comprar una propiedad sin credito. El Estado "
            "te cobra como si fueras EUROPEO pero te da servicios "
            "AFRICANOS. La paradoja del contribuyente argentino."
        )

    return "\n".join(lines)
