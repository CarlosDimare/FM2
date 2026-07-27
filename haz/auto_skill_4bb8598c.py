import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_actual aumento_pct inflacion_periodo [meses]\n"
            "Ej: 500000 25 20   (sueldo $500k, aumento 25%, inflacion 20% en el periodo)\n"
            "Ej: 800k 30 25 6   (mismo pero en 6 meses)\n"
            "Calcula si un aumento salarial es real o solo nominal.\n"
            "Soporta sufijos k/M y modo USD."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (salario aumento inflacion)."

    raw_salary = parts[offset].upper()
    try:
        salary = float(raw_salary.replace("K", "").replace("M", ""))
        if "K" in raw_salary:
            salary *= 1000
        elif "M" in raw_salary:
            salary *= 1_000_000
        raise_pct = float(parts[offset + 1].replace("%", ""))
        inflation_pct = float(parts[offset + 2].replace("%", ""))
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    months = 1
    if len(parts) > offset + 3:
        try:
            months = float(parts[offset + 3])
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"

    new_salary = salary * (1 + raise_pct / 100)
    adjusted_salary = new_salary / (1 + inflation_pct / 100)
    real_raise = ((adjusted_salary / salary) - 1) * 100

    monthly_inflation = ((1 + inflation_pct / 100) ** (1 / max(months, 1)) - 1) * 100 if months > 1 else inflation_pct

    lines = []
    lines.append(f"Salario actual: {c} {salary:,.0f}")
    lines.append(f"Aumento propuesto: {raise_pct:.1f}%")
    lines.append(f"Inflacion del periodo ({months:.0f} {'mes' if months==1 else 'meses'}): {inflation_pct:.1f}%")
    lines.append(f"  Inflacion mensual equivalente: {monthly_inflation:.2f}%")
    lines.append("---")
    lines.append(f"Nuevo salario nominal: {c} {new_salary:,.0f}")
    lines.append(f"Ajustado por inflacion: {c} {adjusted_salary:,.0f}")
    lines.append(f"Aumento real: {real_raise:+.2f}%")

    if not is_usd:
        blue = 1400
        old_usd = salary / blue
        new_usd = new_salary / blue
        adj_usd = adjusted_salary / blue
        lines.append("---")
        lines.append(f"Al blue ({blue:.0f}):")
        lines.append(f"  Antes: USD {old_usd:,.0f}/mes")
        lines.append(f"  Despues (nominal): USD {new_usd:,.0f}/mes")
        lines.append(f"  Despues (real): USD {adj_usd:,.0f}/mes")

    lines.append("")
    if real_raise > 10:
        lines.append(
            "Posta: Aumento real positivo de dos digitos. O laburas en un sector "
            "sindicalizado con paritaria firme, o tu jefe tuvo un ataque de "
            "generosidad (poco probable). Disfrutalo mientras dure: el capitalismo "
            "siempre recupera lo prestado."
        )
    elif real_raise > 0:
        lines.append(
            "Posta: Aumento real positivo, pero chico. Le ganaste a la inflacion "
            "por centesimas. Es como ganar un partido 1-0 con un gol en offside: "
            "ganaste, pero no te emociones."
        )
    elif real_raise > -10:
        lines.append(
            "Posta: Aumento nominal que no alcanza la inflacion. Perdiste poder "
            "de compra, pero tu jefe te puede decir 'te aumentamos'. Es el clasico "
            "verso argentino: 'ganamos todos' cuando en realidad solo gana el que "
            "vende y el que cobra el aumento sos vos, pero la cuenta la perdes."
        )
    else:
        lines.append(
            "Posta: Perdiste mas del 10% de poder adquisitivo. Eso no es un "
            "aumento: es una licuacion. Si estuvieras en blanco, tu sueldo sube "
            "por paritaria. Si estas en negro, no tenes aumento. Si estas en "
            "monotributo, ajusta la factura o cambiate a una cooperativa."
        )

    return "\n".join(lines)
