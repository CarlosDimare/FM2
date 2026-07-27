import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu facturacion mensual. Ej: '$2M' o 'USD3000'."

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()

    nums = re.findall(r"(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|mm|usd)?", t, re.IGNORECASE)
    if not nums:
        return "No entendi el ingreso. Ej: '$2M' o 'USD3000'."

    val_raw = float(nums[0][0].replace(",", ""))
    suffix = nums[0][1].lower().strip() if nums[0][1] else ""

    if suffix in ("k", "mil"):
        ingreso = val_raw * 1_000
    elif suffix in ("m", "millones", "mm"):
        ingreso = val_raw * 1_000_000
    elif not suffix and not usd_mode and val_raw < 10000:
        ingreso = val_raw * 1_000
    else:
        ingreso = val_raw

    if usd_mode:
        if ingreso < 1000:
            ingreso *= 1_000_000
        blue = 1400
        factura_mensual = ingreso
        factura_anual = factura_mensual * 12
    else:
        factura_mensual = ingreso
        factura_anual = factura_mensual * 12

    # Monotributo 2026 categories (approximate, in ARS)
    categorias = [
        ("A", 2_112_000, 7_289, 3_200),
        ("B", 3_139_000, 8_021, 4_600),
        ("C", 4_396_000, 9_439, 5_750),
        ("D", 5_458_000, 11_316, 7_550),
        ("E", 6_422_000, 13_315, 8_150),
        ("F", 8_033_000, 15_130, 9_900),
        ("G", 9_642_000, 17_522, 13_600),
        ("H", 11_495_000, 19_514, 16_500),
        ("I", 13_614_000, 21_280, 19_200),
        ("J", 16_338_000, 23_216, 22_800),
        ("K", 19_606_000, 25_198, 26_500),
    ]

    factura_total = factura_anual
    cat_actual = None
    for cat, limite, cuota_social, ap_social in categorias:
        if factura_total <= limite:
            cat_actual = (cat, limite, cuota_social, ap_social)
            break

    if not cat_actual:
        # Exceeds all categories -> responsable inscripto
        lines = ["=== MONOTRIBUTO 2026 ==="]
        if usd_mode:
            lines.append("Facturacion mensual: USD {:,.2f}".format(factura_mensual))
            lines.append("Facturacion anual: USD {:,.2f}".format(factura_anual))
        else:
            lines.append("Facturacion mensual: $ {:,.0f}".format(factura_mensual))
            lines.append("Facturacion anual: $ {:,.0f}".format(factura_anual))
        lines += [
            "Categoria: N/A",
            "",
            "Superas el limite maximo del monotributo ($ {:,.0f}/ano).".format(categorias[-1][1]),
            "Te corresponde Responsable Inscripto (IVA + Ganancias).",
            "",
            "Bienvenido al infierno fiscal. Conseguite un buen contador.",
        ]
        return "\n".join(lines)

    cat, limite, cuota, ap = cat_actual

    if usd_mode:
        cuota_total = cuota * blue
        ap_total = ap * blue
    else:
        cuota_total = cuota
        ap_total = ap

    total_mensual = cuota_total + ap_total
    carga_pct = total_mensual / factura_mensual * 100 if factura_mensual > 0 else 0
    neto_mensual = factura_mensual - total_mensual

    lines = [
        "=== MONOTRIBUTO 2026 ===",
    ]

    if usd_mode:
        lines.append("Facturacion mensual: USD {:,.2f}".format(factura_mensual))
        lines.append("Facturacion anual: USD {:,.2f}".format(factura_anual))
    else:
        lines.append("Facturacion mensual: $ {:,.0f}".format(factura_mensual))
        lines.append("Facturacion anual: $ {:,.0f}".format(factura_anual))

    lines += [
        "Categoria sugerida: {}".format(cat),
        "Tope anual: $ {:,.0f}".format(limite),
        "",
        "Cuota mensual (monotributo): $ {:,.0f}".format(cuota_total),
        "Aporte social (obra social): $ {:,.0f}".format(ap_total),
        "Total mensual: $ {:,.0f}".format(total_mensual),
        "Neto despues de monotributo: $ {:,.0f}/mes".format(neto_mensual),
        "Carga tributaria: {:.1f}%".format(carga_pct),
    ]

    if cat in ("A", "B", "C"):
        lines += [
            "",
            "Categoria baja. Estas en la base de la piramide monotributista.",
            "No llegas a facturar mucho, pero al menos no tenes IVA.",
            "El consuelo: pagas poco. La realidad: facturas poco.",
        ]
    elif cat in ("D", "E", "F", "G"):
        lines += [
            "",
            "Categoria media. El monotributo ya duele pero no mata.",
            "Estas en el limbo: facturas bien pero no podes deducir nada.",
            "Si creces un poco mas, te caes a Responsable Inscripto.",
            "Disfruta mientras dure la categoria.",
        ]
    else:
        lines += [
            "",
            "Categoria alta. Estas al borde de caer a Responsable Inscripto.",
            "Un buen mes y te pasas al regimen general. Prepará el contador.",
        ]

    return "\n".join(lines)
