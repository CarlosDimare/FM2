import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: deuda tasa_mensual pago_minimo_porcentaje\n"
            "Ej: 100000 6 5  (deuda $100k, 6% interes mensual, 5% pago minimo)\n"
            "Ej: 500k 7 3  (deuda $500k, 7% interes, 3% minimo)\n"
            "Calcula cuantos meses toma pagar la deuda pagando solo el minimo\n"
            "y el interes total pagado. Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 3:
        return "Error: faltan parametros (deuda tasa_mensual pago_minimo_%)."

    raw_debt = parts[0].upper()
    try:
        debt = float(raw_debt.replace("K", "").replace("M", ""))
        if "K" in raw_debt:
            debt *= 1000
        elif "M" in raw_debt:
            debt *= 1_000_000
        monthly_rate = float(parts[1].replace("%", "")) / 100
        min_pct = float(parts[2].replace("%", "")) / 100
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    monthly_inflation = 3.0
    if len(parts) > 3:
        try:
            monthly_inflation = float(parts[3].replace("%", ""))
        except ValueError:
            pass

    remaining = debt
    total_paid = 0
    months = 0
    max_months = 600

    while remaining > 0 and months < max_months:
        interest = remaining * monthly_rate
        min_payment = max(remaining * min_pct, interest + 0.01)
        if min_payment > remaining + interest:
            min_payment = remaining + interest
        total_paid += min_payment
        remaining = remaining + interest - min_payment
        months += 1

    total_interest = total_paid - debt
    inflation_erosion = debt * ((1 + monthly_inflation / 100) ** (months / 30) - 1) if months < 600 else 0

    lines = []
    lines.append(f"Deuda inicial: ARS {debt:,.0f}")
    lines.append(f"Interes mensual: {monthly_rate*100:.1f}%")
    lines.append(f"Pago minimo: {min_pct*100:.1f}% del saldo")
    lines.append("---")
    lines.append(f"Tiempo para pagar: {months} meses ({months//12} anios y {months%12} meses)")
    lines.append(f"Total pagado: ARS {total_paid:,.0f}")
    lines.append(f"Interes total pagado: ARS {total_interest:,.0f} ({ (total_interest/debt)*100:.0f}% de la deuda original)")
    lines.append(f"Relacion interes/deuda original: {(total_paid/debt):.1f}x")

    lines.append("")
    if months > 120:
        lines.append(
            "Posta: Te va a llevar mas de 10 anios pagar esto solo con el minimo. "
            "El banco no quiere que pagues la deuda: quiere que pagues intereses para siempre. "
            "Es como un plazo fijo, pero al reves: ellos ganan, vos perdes."
        )
    elif months > 60:
        lines.append(
            "Posta: 5 anios pagando el minimo. Para entonces, la deuda original va a valer "
            "la mitad en terminos reales por inflacion, pero los intereses que pagaste "
            "ya superaron el capital. El banco gana igual."
        )
    elif months > 24:
        lines.append(
            "Posta: 2 anios pagando el minimo. No es lo peor que puede pasar, "
            "pero es como comprar algo en cuotas fijas: pagas el doble y encima "
            "tardas el doble. La unica diferencia es que aca no hay producto."
        )
    else:
        lines.append(
            "Posta: Menos de 2 anios. Sos un caso de exito en finanzas personales. "
            "O tu deuda era chica. En cualquiera de los dos casos: no lo hagas de nuevo. "
            "Las tarjetas de credito son el prestamo mas caro que existe, "
            "disenadas para que nunca salgas de la rueda."
        )

    return "\n".join(lines)
