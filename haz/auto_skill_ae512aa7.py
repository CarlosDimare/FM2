import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: nombre1:precio1 nombre2:precio2 ... [horas_uso_diarias]\n"
            "Calcula el costo total de tus suscripciones de software.\n"
            "Muestra total por mes, por anio, costo por hora de uso,\n"
            "y si podes deducir impuestos (monotributo/responsable inscripto).\n"
            "Ej: figma:25000 notion:15000 github:12000 slack:18000 8\n"
            "Ej: USD figma:20 notion:15 github:10 slack:12 6\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: no se ingresaron suscripciones. Formato: nombre:precio ..."

    subs = []
    horas_uso = 8

    for p in parts:
        p = p.strip()
        if ":" in p:
            name, val_str = p.split(":", 1)
            val_str = val_str.upper()
            mult = 1
            if "K" in val_str:
                mult = 1000
                val_str = val_str.replace("K", "")
            elif "M" in val_str:
                mult = 1_000_000
                val_str = val_str.replace("M", "")
            try:
                val = float(val_str) * mult
                subs.append((name, val))
            except ValueError:
                pass
        else:
            try:
                horas_uso = float(p)
            except ValueError:
                pass

    if not subs:
        return "Error: no se reconocieron suscripciones. Formato: nombre:precio nombre:precio ..."

    c = "USD" if is_usd else "ARS"
    blue = 1400

    if is_usd:
        subs_ars = [(n, p * blue) for n, p in subs]
    else:
        subs_ars = [(n, p) for n, p in subs]

    total_mensual = sum(p for _, p in subs)
    total_anual = total_mensual * 12

    if is_usd:
        total_mensual_display = sum(p for _, p in subs)
    else:
        total_mensual_display = total_mensual
        total_anual_display = total_anual

    horas_mes = horas_uso * 30
    costo_por_hora = total_mensual / horas_mes if horas_mes > 0 else 0

    if is_usd:
        deduccion_mensual = total_mensual * 1.0
    else:
        deduccion_mensual = total_mensual * 1.0

    ahorro_anual_impositivo = 0
    if not is_usd:
        ahorro_anual_impositivo = total_anual * 0.35
    else:
        ahorro_anual_impositivo = 0

    lines = []
    lines.append("GASTOS EN SOFTWARE / SAAS")
    lines.append(f"Horas de uso diarias: {horas_uso:.0f} ({horas_mes:.0f} h/mes)")
    lines.append("---")
    lines.append("SUSCRIPCIONES:")
    for name, price in sorted(subs, key=lambda x: -x[1]):
        if is_usd:
            pct = (price / total_mensual_display) * 100
            lines.append(f"  {name:<20} {c} {price:>8,.0f}  ({pct:.0f}%)")
        else:
            pct = (price / total_mensual_display) * 100
            lines.append(f"  {name:<20} {c} {price:>8,.0f}  ({pct:.0f}%)")
    lines.append("  " + "-" * 40)
    lines.append(f"  {'TOTAL':<20} {c} {total_mensual_display:>8,.0f}/mes")
    lines.append(f"  {'':<20} {c} {total_anual_display:>8,.0f}/ano")
    lines.append("")
    lines.append("COSTO POR HORA DE USO:")
    lines.append(f"  {c} {costo_por_hora:,.0f}/hora")
    lines.append(f"  (si usas las {len(subs)} herramientas {horas_uso} h/dia)")
    lines.append("")
    lines.append(f"DEDUCCION IMPOSITIVA:")
    lines.append(f"  Total deducible:   {c} {deduccion_mensual:,.0f}/mes")
    if not is_usd:
        lines.append(f"  Ahorro fiscal (35%): $ {ahorro_anual_impositivo:,.0f}/ano")
    lines.append("")
    lines.append("EQUIVALENCIA DEL GASTO ANUAL:")
    for item, cost in [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cafe", 3500),
        ("viaje en bondi", 1200),
        ("pinta de birra", 4000),
    ]:
        if is_usd:
            cant = total_anual / (cost / 1400)
        else:
            cant = total_anual / cost
        if cant >= 3:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:   USD {total_mensual_display/blue:,.0f}")
        lines.append(f"  Anual:     USD {total_anual_display/blue:,.0f}")
        lines.append(f"  Por hora:  USD {costo_por_hora/blue:,.0f}")

    lines.append("")
    if total_mensual > 150000 and not is_usd:
        lines.append(
            f"Posta: Gastas MAS DE 150 LUCAS por mes en herramientas "
            "de software. Sos un power user del capitalismo SaaS. "
            "Figma, Notion, Linear, GitHub, Slack, VSCode extensions... "
            "cada herramienta te cobra USD 15-30, y sumando son "
            "USD 300-500 por mes. Si facturas en USD, es parte del "
            "negocio. Si facturas en pesos, estas regalando plata."
        )
    elif total_mensual > 50000 and not is_usd:
        lines.append(
            f"Posta: Entre 50 y 150 lucas de software. Estas en el "
            "rango del freelance profesional. No es un gasto menor "
            "pero son herramientas de trabajo. La buena: Son "
            "deducibles de impuestos. La mala: Si no facturas "
            "lo suficiente, el software te come el margen. "
            "Cada vez que renovas una licencia, preguntate: "
            "esta herramienta me hace ganar mas plata de "
            "la que me cuesta?"
        )
    else:
        lines.append(
            f"Posta: Menos de 50 lucas en software. Sos austero "
            "o usas todo open source (bien ahi). El software "
            "es una de las herramientas mas baratas por hora "
            "de uso si facturas bien. Si tus herramientas "
            "cuestan menos que un cafe por dia, estas "
            "invirtiendo bien. O no estas usando "
            "las herramientas que necesitas."
        )

    return "\n".join(lines)
