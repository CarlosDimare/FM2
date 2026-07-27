import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: ingresos_mensuales [categoria]\n"
            "Calcula costo real del monotributo segun categoria e ingresos.\n"
            "Muestra impuesto total, obra social, y tasa efectiva sobre facturacion.\n"
            "Ej: 1200000 G\n"
            "Ej: USD 2500 H\n"
            "Categorias: A (0-1.25M), B (1.25-1.85M), C (1.85-2.75M), "
            "D (2.75-4.25M), E (4.25-6.85M), F (6.85-10.5M), "
            "G (10.5-16.5M), H (16.5-28.5M), I (28.5-42M), "
            "J (42-63M), K (63-105M).\n"
            "Si categoria no se especifica, estima la que corresponde."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el ingreso mensual."

    try:
        raw = parts[offset].upper()
        income = float(raw.replace("K", "").replace("M", ""))
        if "K" in raw:
            income *= 1000
        elif "M" in raw:
            income *= 1_000_000
    except ValueError:
        return "Error: no se pudo parsear el ingreso."

    category = parts[offset + 1].upper() if len(parts) > offset + 1 else None

    blue = 1400
    income_ars = income * blue if is_usd else income
    income_usd = income / blue if not is_usd else income

    categories = {
        "A": (0, 1_250_000, "Servicios"),
        "B": (1_250_001, 1_850_000, "Servicios"),
        "C": (1_850_001, 2_750_000, "Servicios"),
        "D": (2_750_001, 4_250_000, "Servicios"),
        "E": (4_250_001, 6_850_000, "Servicios"),
        "F": (6_850_001, 10_500_000, "Servicios"),
        "G": (10_500_001, 16_500_000, "Servicios"),
        "H": (16_500_001, 28_500_000, "Servicios"),
        "I": (28_500_001, 42_000_000, "Servicios"),
        "J": (42_000_001, 63_000_000, "Servicios"),
        "K": (63_000_001, 105_000_000, "Servicios"),
    }

    # Monthly tax (impuesto integrado + obra social) per category in ARS, mid-2026 approx
    monthly_taxes = {
        "A": (12000, 16000),
        "B": (17000, 22000),
        "C": (24000, 31000),
        "D": (35000, 44000),
        "E": (51000, 63000),
        "F": (76000, 92000),
        "G": (110000, 132000),
        "H": (160000, 190000),
        "I": (230000, 275000),
        "J": (330000, 395000),
        "K": (480000, 570000),
    }

    monthly_income_ars = income_ars
    annual_income_ars = monthly_income_ars * 12

    detected_cat = None
    if category and category in categories:
        detected_cat = category
    else:
        for c, (lo, hi, _) in sorted(categories.items(), key=lambda x: x[1][1]):
            if lo <= monthly_income_ars <= hi:
                detected_cat = c
                break
        if not detected_cat and monthly_income_ars > 105_000_000:
            detected_cat = "K"
        elif not detected_cat:
            detected_cat = "A"

    cat_lo, cat_hi, cat_type = categories[detected_cat]
    imp, os = monthly_taxes[detected_cat]
    total_monthly = imp + os
    annual_tax = total_monthly * 12

    effective_rate_monthly = (total_monthly / monthly_income_ars) * 100 if monthly_income_ars > 0 else 0
    effective_rate_annual = (annual_tax / annual_income_ars) * 100 if annual_income_ars > 0 else 0

    net_monthly = monthly_income_ars - total_monthly
    net_annual = annual_income_ars - annual_tax

    if not is_usd:
        net_usd = net_monthly / blue
    else:
        net_usd = net_monthly / blue

    lines = []
    ars_label = "ARS" if not is_usd else f"USD (al blue {blue})"
    lines.append(f"MONOTRIBUTO - {detected_cat}")
    lines.append(f"Rango categoria: $ {cat_lo:,.0f} - $ {cat_hi:,.0f}")
    lines.append(f"Tipo: {cat_type}")
    lines.append("---")
    lines.append(f"INGRESOS:")
    lines.append(f"  Mensual:     $ {monthly_income_ars:,.0f} ({arfmt(monthly_income_ars, is_usd, blue)})")
    lines.append(f"  Anual:       $ {annual_income_ars:,.0f}")
    lines.append("")
    lines.append(f"COSTOS MENSUALES:")
    lines.append(f"  Impuesto:    $ {imp:,.0f}")
    lines.append(f"  Obra social: $ {os:,.0f}")
    lines.append(f"  Total:       $ {total_monthly:,.0f} ({effective_rate_monthly:.1f}% de facturacion)")
    lines.append("")
    lines.append(f"NETO MENSUAL:")
    lines.append(f"  En mano:     $ {net_monthly:,.0f} ({arfmt(net_monthly, is_usd, blue)})")
    lines.append(f"  Tasa efectiva anual: {effective_rate_annual:.1f}%")
    lines.append("")
    lines.append(f"PROYECCION ANUAL:")
    lines.append(f"  Facturado:   $ {annual_income_ars:,.0f}")
    lines.append(f"  Impuestos:   $ {annual_tax:,.0f}")
    lines.append(f"  Neto:        $ {net_annual:,.0f}")
    lines.append("")
    lines.append(f"USD (blue {blue}):")
    lines.append(f"  Fact. mensual: USD {income_usd:,.0f}")
    lines.append(f"  Costo mensual: USD {total_monthly/blue:,.0f}")
    lines.append(f"  Neto mensual:  USD {net_monthly/blue:,.0f}")

    lines.append("")
    if effective_rate_monthly < 5:
        lines.append(
            f"Posta: Categoria {detected_cat} es donde la carrera monotributista "
            "se pone linda. Tasas efectivas por debajo del 5% sobre facturacion "
            "es el negocio mas redondo del capitalismo argentino. Pero ojo: "
            "llegaste aca facturando mas de 10 palos por mes, y el limite de "
            "K es 105M anuales. Cuando lo pases, te espera el regimen general "
            "con Ganancias, IVA, y la tristeza de pagar como corresponde."
        )
    elif effective_rate_monthly < 10:
        lines.append(
            f"Posta: Categoria {detected_cat}. La tasa efectiva es razonable "
            "para la presion fiscal argentina. El monotributo es el "
            "cordero de la AFIP: te cobra menos que a los grandes pero te "
            "controla todo porque sos chico. Sos el famoso 'pequeno "
            "contribuyente' -- pequeno para el fisco, grande para las "
            "obligaciones."
        )
    elif effective_rate_monthly < 15:
        lines.append(
            f"Posta: Categoria {detected_cat}. Estas pagando mas del 10% "
            "de tu facturacion en monotributo. Empeza a pensar si te "
            "conviene saltar a responsable inscripto. El monotributo es "
            "para los que arrancan, no para los que facturan 20 palos. "
            "Es como vivir en un monoambiente toda la vida: llega un "
            "momento en que necesitas una casa."
        )
    else:
        lines.append(
            "Posta: Si tenes esta categoria y pagas esta tasa, estas "
            "en el borde superior del monotributo. Considera seriamente "
            "pasarte a responsable inscripto: mas carga administrativa "
            "pero podes deducir gastos y compensar IVA. O segui "
            "facturando feliz mientras dure. La AFIP siempre mira primero "
            "al que se pasa del limite."
        )

    return "\n".join(lines)

def arfmt(amount, is_usd, blue):
    if is_usd:
        return f"ARS {amount:,.0f}"
    return f"USD {amount/blue:,.0f}"
