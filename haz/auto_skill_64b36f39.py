import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_auto entrega_pct cuotas_tasa_anual\n"
            "Calcula credito prendario para comprar un auto.\n"
            "Muestra cuota fija, total con intereses, costo mensual total\n"
            "incluyendo seguro y patente, y comparacion contra ahorrar.\n"
            "Ej: 15000000 30 24 85\n"
            "Ej: USD 20000 20 36 12\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 4:
        return "Error: faltan parametros (precio entrega_pct cuotas tasa_anual)."

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
        car_price = parse_num(parts[offset])
        down_pct = float(parts[offset + 1])
        months = int(float(parts[offset + 2]))
        tna = float(parts[offset + 3])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"
    blue = 1400

    down_payment = car_price * (down_pct / 100)
    financed = car_price - down_payment

    monthly_rate = (tna / 100) / 12
    if monthly_rate > 0:
        quota = financed * (monthly_rate * (1 + monthly_rate) ** months) / ((1 + monthly_rate) ** months - 1)
    else:
        quota = financed / months

    total_paid = quota * months
    total_interest = total_paid - financed
    interest_pct = (total_interest / financed) * 100 if financed > 0 else 0

    tem = ((total_paid / financed) ** (1 / months) - 1) * 100 if financed > 0 else 0
    tea = ((1 + tem / 100) ** 12 - 1) * 100

    seguro_auto = car_price * 0.005 / 12
    patente_mensual = car_price * 0.01 / 12

    costo_mensual_total = quota + seguro_auto + patente_mensual
    costo_anual_total = costo_mensual_total * 12

    ahorro_mensual = costo_mensual_total
    meses_ahorro = car_price / ahorro_mensual if ahorro_mensual > 0 else 0
    tasa_ahorro = 0.05 / 12
    if tasa_ahorro > 0:
        futuro_ahorro = ahorro_mensual * ((1 + tasa_ahorro) ** months - 1) / tasa_ahorro
    else:
        futuro_ahorro = ahorro_mensual * months

    lines = []
    lines.append(f"CREDITO PRENDARIO - AUTO")
    lines.append(f"Precio: {c} {car_price:,.0f}")
    lines.append(f"Entrega ({down_pct:.0f}%): {c} {down_payment:,.0f}")
    lines.append(f"Financia: {c} {financed:,.0f}")
    lines.append(f"Plazo: {months} meses")
    lines.append(f"TNA: {tna:.1f}%")
    lines.append("---")
    lines.append(f"CUOTA FIJA: {c} {quota:,.0f}")
    lines.append(f"Total a pagar: {c} {total_paid:,.0f}")
    lines.append(f"Intereses totales: {c} {total_interest:,.0f} ({interest_pct:.1f}% del financiado)")
    lines.append(f"TEM: {tem:.2f}% / TEA: {tea:.2f}%")
    lines.append("")
    lines.append("COSTOS ASOCIADOS (mensuales):")
    lines.append(f"  Cuota:             {c} {quota:,.0f}")
    lines.append(f"  Seguro (0.5%):     {c} {seguro_auto:,.0f}")
    lines.append(f"  Patente (1% anual):{c} {patente_mensual:,.0f}")
    lines.append(f"  Costo total/mes:   {c} {costo_mensual_total:,.0f}")
    lines.append(f"  Costo total/ano:   {c} {costo_anual_total:,.0f}")
    lines.append("")
    lines.append(f"COSTO TOTAL DEL AUTO FINANCIADO:")
    lines.append(f"  Entrega:        {c} {down_payment:,.0f}")
    lines.append(f"  Total cuotas:   {c} {total_paid:,.0f}")
    lines.append(f"  Seguros ({months} meses): {c} {seguro_auto * months:,.0f}")
    lines.append(f"  Patentes:       {c} {patente_mensual * months:,.0f}")
    lines.append(f"  TOTAL:          {c} {down_payment + total_paid + seguro_auto * months + patente_mensual * months:,.0f}")
    lines.append("")
    lines.append("COMPARACION: FINANCIAR vs AHORRAR")
    lines.append(f"  Si ahorras {c} {ahorro_mensual:,.0f}/mes al 5% anual:")
    lines.append(f"  En {months} meses tendrias: {c} {futuro_ahorro:,.0f}")
    if futuro_ahorro >= car_price:
        lines.append(f"  Te alcanza para comprarlo al contado (sobran {c} {futuro_ahorro - car_price:,.0f})")
    else:
        lines.append(f"  No te alcanza (faltan {c} {car_price - futuro_ahorro:,.0f})")
    lines.append(f"  Meses necesarios ahorrando: {meses_ahorro:.0f}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Cuota:     USD {quota/blue:,.0f}")
        lines.append(f"  Costo total: USD {(down_payment + total_paid + seguro_auto * months + patente_mensual * months)/blue:,.0f}")

    lines.append("")
    if interest_pct > 60:
        lines.append(
            f"Posta: Pagas {interest_pct:.0f}% de intereses sobre el financiado. "
            "El credito prendario en Argentina es carisimo. Los bancos "
            "te prestan para el auto porque el auto es la garantia: si "
            "no pagas, te lo sacan. Es el negocio redondo: te prestan "
            "tu propia plata contra tu propio auto. La tasa es alta "
            "porque la inflacion es alta, asi que en pesos conviene "
            "si tu sueldo sube. En USD, con tasa fija, tenes "
            "certidumbre pero pagas mas."
        )
    elif interest_pct > 30:
        lines.append(
            f"Posta: {interest_pct:.0f}% de intereses. Es el costo de "
            "no tener la plata. Financiar un auto no es malo si "
            "tu ingreso sube con la inflacion. Pero el auto se "
            "deprecia mientras pagas intereses. La cuenta: el "
            "auto pierde 15-20% de valor al primer ano. Si "
            "pagas 30% de intereses, estas perdiendo por los "
            "dos lados. El negocio es comprar usado de contado."
        )
    else:
        lines.append(
            f"Posta: {interest_pct:.0f}% de intereses. Tasa baja para "
            "el estandar argentino. Probablemente sea un plan de "
            "ahorro o una tasa promocional de concesionaria. Si "
            "es en USD, revisa bien: las tasas bajas en USD "
            "suelen esconder seguros caros o gastos administrativos. "
            "Siempre pregunta el CFT (Costo Financiero Total)."
        )

    return "\n".join(lines)
