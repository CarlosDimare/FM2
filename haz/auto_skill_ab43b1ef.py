import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_usd [flete_usd] [seguro_usd]\n"
            "Calcula el costo total de importar un producto a Argentina.\n"
            "Incluye arancel, IVA, impuesto PAIS, Ganancias, y ingresos brutos.\n"
            "Muestra desglose de impuestos y el precio final en ARS.\n"
            "Ej: 500 50 10\n"
            "Ej: 1200 100 0\n"
            "Soporta sufijos k/M para el precio."
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: falta el precio en USD."

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
        usd_price = parse_num(parts[0])
    except ValueError:
        return "Error: no se pudo parsear el precio."

    flete = 50
    seguro = 10
    if len(parts) >= 2:
        flete = parse_num(parts[1]) if parts[1].upper().endswith("K") or parts[1].upper().endswith("M") else float(parts[1])
    if len(parts) >= 3:
        seguro = parse_num(parts[2]) if parts[2].upper().endswith("K") or parts[2].upper().endswith("M") else float(parts[2])

    blue = 1400
    oficial = 1200

    valor_fob = usd_price
    valor_cif = usd_price + flete + seguro

    arancel_pct = 0.35
    iva_pct = 0.21
    impuesto_pais_pct = 0.30
    ganancias_pct = 0.20
    ingresos_brutos_pct = 0.025

    base_arancel = valor_cif
    arancel = base_arancel * arancel_pct

    base_iva = valor_cif + arancel
    iva = base_iva * iva_pct

    base_pais = valor_cif
    impuesto_pais = base_pais * impuesto_pais_pct

    base_ganancias = valor_cif
    ganancias = base_ganancias * ganancias_pct

    base_ib = valor_cif
    ingresos_brutos = base_ib * ingresos_brutos_pct

    total_impuestos_usd = arancel + iva + impuesto_pais + ganancias + ingresos_brutos
    total_usd = valor_cif + total_impuestos_usd

    total_ars_oficial = total_usd * oficial
    total_ars_blue = total_usd * blue

    pct_impuestos = (total_impuestos_usd / valor_cif) * 100 if valor_cif > 0 else 0
    pct_recargo = ((total_usd - valor_fob) / valor_fob) * 100 if valor_fob > 0 else 0

    lines = []
    lines.append(f"COSTO DE IMPORTACION - DESGLOSE")
    lines.append(f"Precio FOB:     USD {usd_price:,.2f}")
    lines.append(f"Flete:          USD {flete:,.2f}")
    lines.append(f"Seguro:         USD {seguro:,.2f}")
    lines.append(f"Valor CIF:      USD {valor_cif:,.2f}")
    lines.append("---")
    lines.append("IMPUESTOS:")
    lines.append(f"  Arancel ({arancel_pct*100:.0f}%):        USD {arancel:,.2f}")
    lines.append(f"  IVA ({iva_pct*100:.0f}%):              USD {iva:,.2f}")
    lines.append(f"  Impuesto PAIS ({impuesto_pais_pct*100:.0f}%):     USD {impuesto_pais:,.2f}")
    lines.append(f"  Ganancias ({ganancias_pct*100:.0f}%):         USD {ganancias:,.2f}")
    lines.append(f"  IIBB ({ingresos_brutos_pct*100:.1f}%):         USD {ingresos_brutos:,.2f}")
    lines.append("  " + "-" * 30)
    lines.append(f"  Total impuestos: USD {total_impuestos_usd:,.2f} ({pct_impuestos:.0f}% del CIF)")
    lines.append("")
    lines.append(f"COSTO TOTAL EN USD: USD {total_usd:,.2f}")
    lines.append(f"  Recargo sobre FOB: +{pct_recargo:.0f}%")
    lines.append("")
    lines.append(f"AL OFICIAL ({oficial:.0f}):")
    lines.append(f"  Precio FOB:     $ {usd_price * oficial:,.0f}")
    lines.append(f"  Impuestos:      $ {total_impuestos_usd * oficial:,.0f}")
    lines.append(f"  Total:          $ {total_ars_oficial:,.0f}")
    lines.append("")
    lines.append(f"AL BLUE ({blue:.0f}):")
    lines.append(f"  Precio FOB:     $ {usd_price * blue:,.0f}")
    lines.append(f"  Impuestos:      $ {total_impuestos_usd * blue:,.0f}")
    lines.append(f"  Total:          $ {total_ars_blue:,.0f}")
    lines.append("")
    lines.append(f"DESGLOSE ARS (blue {blue}):")
    lines.append(f"  Valor CIF:       $ {valor_cif * blue:,.0f}")
    lines.append(f"  Arancel:         $ {arancel * blue:,.0f}")
    lines.append(f"  IVA:             $ {iva * blue:,.0f}")
    lines.append(f"  Impuesto PAIS:   $ {impuesto_pais * blue:,.0f}")
    lines.append(f"  Ganancias:       $ {ganancias * blue:,.0f}")
    lines.append(f"  IIBB:            $ {ingresos_brutos * blue:,.0f}")
    lines.append(f"  TOTAL FINAL:     $ {total_ars_blue:,.0f}")

    lines.append("")
    if pct_recargo > 150:
        lines.append(
            f"Posta: Estas pagando un {pct_recargo:.0f}% de recargo sobre "
            "el precio original. Tus USD 100 se convierten en $ {total_ars_blue/usd_price*100:,.0f}"
            " por cada dolar de producto. Argentina es el unico pais "
            "donde comprar algo de 100 dolares te sale 600 lucas. "
            "No es proteccion industrial: es un impuesto a la "
            "clase media que quiere tener un libro, un respuesto "
            "o un electronico que no fabricamos. El Estado te "
            "dice 'compra nacional' mientras lo nacional cuesta "
            "lo mismo o mas y es peor. La bicicleta del "
            "proteccionismo: protege a los que no compiten."
        )
    elif pct_recargo > 80:
        lines.append(
            f"Posta: Recargo del {pct_recargo:.0f}%. Duele pero es "
            "el estandar argentino. Si estas comprando algo que "
            "no se consigue aca, es lo que hay. Si es algo que "
            "si se consigue, compara precios: a veces conviene "
            "mas comprar importado que nacional aunque paguenes "
            "todos los impuestos. La paradoja argentina."
        )
    else:
        lines.append(
            f"Posta: Recargo del {pct_recargo:.0f}%. Esta dentro de "
            "lo esperable para importaciones no esenciales. "
            "Si el producto cuesta menos de 50 USD, considera "
            "el envio por courier con regimen simplificado "
            "(menos impuestos). Si es mas de 1000 USD, "
            "contrata un despachante de aduana porque te "
            "va a salir mas barato que hacerlo vos."
        )

    return "\n".join(lines)
