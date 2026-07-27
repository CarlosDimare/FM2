import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: valor_propiedad valor_auto valor_inversiones [otros_bienes]\n"
            "Calcula el impuesto a los Bienes Personales en Argentina (2026).\n"
            "Muestra si superas el minimo no imponible, el impuesto por tramo,\n"
            "y el total a pagar. Incluye la alicuota progresiva.\n"
            "Ej: 85000000 15000000 5000000 2000000\n"
            "Ej: USD 200000 30000 10000 5000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: faltan parametros (bienes en Argentina)."

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

    bienes = []
    idx = offset
    labels = ["propiedad", "automotor", "inversiones", "otros"]
    while idx < len(parts) and len(bienes) < 4:
        try:
            val = parse_num(parts[idx])
            bienes.append((labels[len(bienes)], val))
        except ValueError:
            break
        idx += 1

    if not bienes:
        return "Error: no se pudieron parsear los bienes."

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        total_ars = sum(v for _, v in bienes) * blue
    else:
        total_ars = sum(v for _, v in bienes)

    minimo_no_imponible = 30_000_000
    vivienda_unica_ded = 20_000_000

    if total_ars <= minimo_no_imponible:
        impuesto = 0
        exento = True
    else:
        exento = False
        base_imponible = total_ars - minimo_no_imponible

        if base_imponible <= 30_000_000:
            alicuota = 0.0025
        elif base_imponible <= 60_000_000:
            alicuota = 0.0050
        elif base_imponible <= 120_000_000:
            alicuota = 0.0075
        elif base_imponible <= 240_000_000:
            alicuota = 0.0100
        else:
            alicuota = 0.0125

        impuesto = base_imponible * alicuota

    if not is_usd:
        bienes_usd = [(n, v / blue) for n, v in bienes]
    else:
        bienes_usd = bienes

    lines = []
    lines.append("BIENES PERSONALES (2026)")
    lines.append("---")
    lines.append("BIENES DECLARADOS:")
    for name, val in bienes:
        if is_usd:
            lines.append(f"  {name:<15} USD {val:>12,.0f}  ($ {val*blue:>14,.0f})")
        else:
            lines.append(f"  {name:<15} $ {val:>12,.0f}  (USD {val/blue:>10,.0f})")
    lines.append("  " + "-" * 50)
    lines.append(f"  {'TOTAL':<15} $ {total_ars:>12,.0f}")
    if not is_usd:
        lines.append(f"  {'TOTAL USD':<15} USD {total_ars/blue:>12,.0f}")
    lines.append("")
    lines.append(f"Minimo no imponible: $ {minimo_no_imponible:,.0f}")
    lines.append(f"  (en USD: USD {minimo_no_imponible/blue:,.0f})")
    lines.append("")

    if exento:
        lines.append("RESULTADO: EXENTO")
        lines.append(f"  Tus bienes ($ {total_ars:,.0f}) no superan el minimo.")
        lines.append("  No pagas Bienes Personales.")
    else:
        lines.append("RESULTADO: A PAGAR")
        lines.append(f"  Base imponible:    $ {base_imponible:,.0f}")
        lines.append(f"  Alicuota:          {alicuota*100:.2f}%")
        lines.append(f"  Impuesto:          $ {impuesto:,.0f}")
        if not is_usd:
            lines.append(f"  Impuesto USD:      USD {impuesto/blue:,.0f}")

    lines.append("")
    if exento:
        lines.append(
            "Posta: Estas exento de Bienes Personales porque tus bienes "
            "no llegan al minimo de 30M. Sos clase media propietaria, "
            "que en Argentina significa que tenes una propiedad chica "
            "y un auto, pero no llegas al radar de AFIP. Disfrutalo "
            "mientras dure. El dia que tengas UN departamento mas "
            "o una propiedad heredada, entras al club de los que "
            "pagan impuesto al patrimonio. El unico pais del mundo "
            "donde tener un techo propio te hace 'rico' para el fisco."
        )
    elif impuesto < 500000:
        lines.append(
            f"Posta: Pagas {c} {impuesto:,.0f} de Bienes Personales. "
            "No es mucho, pero es el principio. Argentina es uno de los "
            "pocos paises del mundo con impuesto al patrimonio. El "
            "argumento es 'que paguen los ricos'. La realidad es que "
            "la clase media propietaria tambien paga. Y los ricos de "
            "verdad tienen todo en off-shore, fideicomisos y "
            "sociedades. No es evasion: es planificacion patrimonial. "
            "El impuesto a los pobres es IVA. El impuesto a los "
            "ricos es Bienes Personales... que pagan los pobres "
            "con propiedades."
        )
    else:
        lines.append(
            f"Posta: Pagas mas de 500k de Bienes Personales. O tenes "
            "varias propiedades o activos financieros importantes. "
            "Considera seriamente la planificacion patrimonial: "
            "los Bienes Personales son un impuesto al exito, y "
            "en Argentina el exito se castiga. No es consejo "
            "tributario, es observacion de clase."
        )

    return "\n".join(lines)
