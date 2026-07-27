import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: cantidad [USD] plazo_dias tasa_anual [inflacion_mensual]\n"
            "Ej: 100000 30 42\n"
            "Ej: 500k 60 38 4\n"
            "Ej: USD 1000 90 8 2\n"
            "Calcula el rendimiento real de un plazo fijo restando inflacion.\n"
            "Soporta sufijos k/M y modo USD."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (cantidad, plazo, tasa)."

    raw_amount = parts[offset].upper()
    raw_days = parts[offset + 1]
    raw_rate = parts[offset + 2].replace("%", "")

    try:
        amount = float(raw_amount.replace("K", "").replace("M", ""))
        if "K" in raw_amount:
            amount *= 1000
        elif "M" in raw_amount:
            amount *= 1_000_000
        days = float(raw_days)
        tna = float(raw_rate)
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    monthly_inflation = 3.0
    if len(parts) > offset + 3:
        try:
            monthly_inflation = float(parts[offset + 3].replace("%", ""))
        except ValueError:
            pass

    daily_rate = tna / 100 / 365
    gross_return = amount * ((1 + daily_rate) ** days - 1)
    net_nominal = amount + gross_return

    period_inflation = (1 + monthly_inflation / 100) ** (days / 30) - 1
    real_value = net_nominal / (1 + period_inflation)
    real_return = real_value - amount
    real_rate_pct = (real_return / amount) * 100

    inflation_erosion = amount * period_inflation

    lines = []
    c = "USD" if is_usd else "ARS"
    lines.append(f"Plazo fijo: {c} {amount:,.0f} a {tna:.1f}% TNA x {days:.0f} dias")
    lines.append(f"Inflacion estimada: {monthly_inflation:.1f}% mensual ({((1+monthly_inflation/100)**12-1)*100:.1f}% anual)")
    lines.append("---")
    lines.append(f"Interes bruto:       +{c} {gross_return:,.0f}")
    lines.append(f"Perdida x inflacion: -{c} {inflation_erosion:,.0f}")
    lines.append(f"Rendimiento real:    {c} {real_return:,.0f} ({real_rate_pct:+.2f}%)")

    if not is_usd:
        blue = 1400
        usd_start = amount / blue
        usd_end = net_nominal / blue
        lines.append("---")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  USD al depositar:  {usd_start:,.2f}")
        lines.append(f"  USD al vencer:     {usd_end:,.2f}")
        lines.append(f"  Diferencia:        {usd_end - usd_start:+,.2f} USD")

    lines.append("")
    if real_rate_pct < -15:
        lines.append(
            "Posta: Perdes mas del 15% real. No es un plazo fijo, "
            "es una donacion con derecho a reclamo. "
            "El que invento la frase 'ahorre en pesos' deberia ir preso."
        )
    elif real_rate_pct < -5:
        lines.append(
            "Posta: Perdes plata, pero con estilo. "
            "La inflacion te come el interes y la cuota del club de los que pierden plata "
            "sigue subiendo."
        )
    elif real_rate_pct < 0:
        lines.append(
            "Posta: Estas en el torno. Perdes un poco, pero no tanto como para llorar. "
            "El plazo fijo argentino: un instrumento financiero donde tu objetivo es "
            "perder menos que el de al lado."
        )
    elif real_rate_pct < 5:
        lines.append(
            "Posta: Le ganaste a la inflacion por poco. "
            "No te emociones: sigue siendo menos de lo que rinde un colchon "
            "bien lleno de verdes."
        )
    else:
        lines.append(
            "Posta: Rendimiento real positivo. Inusual en Argentina. "
            "O el gobierno te esta pagando un subsidio encubierto o "
            "la inflacion que usamos esta mal. En cualquiera de los dos casos: "
            "aprovecha mientras dure."
        )

    return "\n".join(lines)
