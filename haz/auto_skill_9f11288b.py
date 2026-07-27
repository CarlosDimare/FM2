import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: gasto1:meses_sin_usar gasto2:meses_sin_usar ...\n"
            "Calcula cuanta plata tiras en cosas que pagas pero no usas.\n"
            "Muestra total desperdiciado, proyeccion anual, y que podrias\n"
            "haber comprado con esa plata.\n"
            "Ej: gym:50000:6 netflix:15000:4 seguro:30000:12\n"
            "Ej: USD gym:50:6 netflix:15:4\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: no se ingresaron gastos. Formato: nombre:monto:meses nombre:monto:meses ..."

    items = []
    total_wasted = 0
    for p in parts:
        sub = p.split(":")
        if len(sub) >= 3:
            name = sub[0]
            try:
                raw = sub[1].upper()
                mult = 1
                if "K" in raw:
                    mult = 1000
                    raw = raw.replace("K", "")
                elif "M" in raw:
                    mult = 1_000_000
                    raw = raw.replace("M", "")
                amount = float(raw) * mult
                months = int(float(sub[2]))
                wasted = amount * months
                items.append((name, amount, months, wasted))
                total_wasted += wasted
            except ValueError:
                pass

    if not items:
        return "Error: no se pudieron parsear los datos. Formato: nombre:monto:meses"

    c = "ARS"
    blue = 1400

    lines = []
    lines.append(f"PLATA QUE TIRAS - COSAS QUE PAGAS Y NO USAS")
    lines.append("---")
    lines.append("DESGLOSE:")
    lines.append(f"{'Concepto':<20} {'Precio':>12} {'Meses':>6}  {'Total tirado':>14}")
    lines.append("-" * 55)
    for name, amount, months, wasted in items:
        lines.append(f"{name:<20} $ {amount:>8,.0f}  {months:>3}     $ {wasted:>10,.0f}")
    lines.append("-" * 55)
    lines.append(f"{'TOTAL':<20} {'':>12} {'':>6}  $ {total_wasted:>10,.0f}")
    lines.append("")
    lines.append(f"EQUIVALE A:")
    equivalencias = [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal", 4000),
        ("cafe", 3500),
        ("viaje en bondi", 1200),
        ("Big Mac", 8500),
        ("entrada de cine", 5000),
        ("libro", 25000),
        ("cuota de gimnasio", 25000),
        ("mes de alquiler", 350000),
    ]
    for item, cost in equivalencias:
        cant = total_wasted / cost
        if cant >= 10:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 2:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    total_annual_projection = 0
    for name, amount, months, wasted in items:
        monthly_cost = amount
        if months >= 12:
            total_annual_projection += monthly_cost * 12
        else:
            total_annual_projection += monthly_cost * months + monthly_cost * (12 - months) * 0.5

    lines.append("")
    lines.append(f"PROYECCION ANUAL ESTIMADA:")
    lines.append(f"  Si no cancelas: $ {total_annual_projection:,.0f}")

    if not any(name.lower() == "usd" for name, _, _, _ in items):
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Total tirado: USD {total_wasted/blue:,.0f}")

    lines.append("")
    if total_wasted > 500000:
        lines.append(
            f"Posta: Estas tirando MAS DE MEDIO MILLON de pesos en cosas "
            "que ni usas. Eso es un alquiler, o 20 asados, o 50 libros. "
            "El capitalismo te cobra por membership, suscripcion y seguro "
            "sabiendo que te vas a olvidar de cancelar. No es tu culpa: "
            "es el negocio de la 'facturacion silenciosa'. Las empresas "
            "cuentan con tu desatencion como fuente de ingresos. "
            "Cancelar es un acto de resistencia de clase."
        )
    elif total_wasted > 100000:
        lines.append(
            f"Posta: Entre 100k y 500k tirados. No es una fortuna pero "
            "tampoco es moneda chica. Revisa tus debitos automaticos: "
            "seguro tenes el gym que no pisas, la suscripcion de HBO "
            "que no ves, el seguro del celular que cubre menos que "
            "una funda. Son 5 minutos de revision que te ahorran "
            "plata todos los meses. La pereza tiene precio."
        )
    else:
        lines.append(
            f"Posta: Menos de 100k tirados. O tenes pocas suscripciones "
            "o sos ordenado con las finanzas. En cualquiera de los "
            "dos casos, estas mejor que el 80% de la poblacion. "
            "Pero revisa igual: siempre hay algo que se renueva "
            "automaticamente y no sabias."
        )

    if total_wasted > 0:
        lines.append("")
        lines.append("SUGERENCIA:")
        lines.append("  Revisa tus debitos automaticos hoy. Cancela lo que no")
        lines.append("  usas. Con lo que ahorras en un ano, te financias")
        lines.append("  un pasaje, un curso, o simplemente llegas mas")
        lines.append("  tranquilo a fin de mes.")

    return "\n".join(lines)
