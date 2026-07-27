import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: monto cuotas tasa_nominal_anual [inflacion_mensual]\n"
            "Calcula prestamo personal: cuota fija, total con intereses,\n"
            "costo real ajustado por inflacion, y comparacion contra.\n"
            "Ej: 1000000 12 85\n"
            "Ej: USD 5000 24 15\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (monto cuotas tasa_anual [inflacion_mensual])."

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
        amount = parse_num(parts[offset])
        months = int(parts[offset + 1])
        tna = float(parts[offset + 2])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    monthly_inflation = 3.0
    if len(parts) > offset + 3:
        try:
            monthly_inflation = float(parts[offset + 3])
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    monthly_rate = (tna / 100) / 12
    if monthly_rate > 0:
        quota = amount * (monthly_rate * (1 + monthly_rate) ** months) / ((1 + monthly_rate) ** months - 1)
    else:
        quota = amount / months

    total_paid = quota * months
    total_interest = total_paid - amount
    interest_pct = (total_interest / amount) * 100
    tem = ((total_paid / amount) ** (1 / months) - 1) * 100
    tea = ((1 + tem / 100) ** 12 - 1) * 100

    real_factor = 0
    for m in range(months):
        real_factor += (1 + monthly_inflation / 100) ** (-m)
    real_quota_total = quota * real_factor if months > 0 else 0
    real_interest = real_quota_total - amount
    real_interest_pct = (real_interest / amount) * 100

    first_month_amount = amount
    first_month_quota = quota
    last_month_amount = amount * ((1 + monthly_inflation / 100) ** (months - 1))
    last_month_quota_real = quota / ((1 + monthly_inflation / 100) ** (months - 1))

    lines = []
    lines.append(f"PRESTAMO PERSONAL")
    lines.append(f"Monto: {c} {amount:,.0f}")
    lines.append(f"Cuotas: {months}")
    lines.append(f"TNA: {tna:.1f}%")
    lines.append(f"Tasa mensual: {monthly_rate*100:.2f}%")
    lines.append("---")
    lines.append(f"CUOTA FIJA: {c} {quota:,.0f}")
    lines.append(f"Total a pagar: {c} {total_paid:,.0f}")
    lines.append(f"Intereses totales: {c} {total_interest:,.0f} ({interest_pct:.1f}% del prestamo)")
    lines.append(f"TEM: {tem:.2f}% / TEA: {tea:.2f}%")
    lines.append("")
    lines.append(f"AJUSTADO POR INFLACION ({monthly_inflation:.0f}%/mes):")
    lines.append(f"  Valor real del total pagado: {c} {real_quota_total:,.0f}")
    lines.append(f"  Interes real: {c} {real_interest:,.0f} ({real_interest_pct:.1f}%)")
    lines.append("")
    lines.append(f"  Primera cuota: {c} {first_month_quota:,.0f} (hoy)")
    lines.append(f"  Ultima cuota:  {c} {last_month_quota_real:,.0f} (en valor hoy)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Monto:      USD {amount/blue:,.0f}")
        lines.append(f"  Total pago: USD {total_paid/blue:,.0f}")
        lines.append(f"  Intereses:  USD {total_interest/blue:,.0f}")
        lines.append(f"  Cuota:      USD {quota/blue:,.0f}")

    lines.append("")
    if interest_pct > 100:
        lines.append(
            f"Posta: Pagas el doble de lo que pediste. Un clasico argentino. "
            "La tasa nominal no dice nada porque no incluye inflacion ni "
            "gastos administrativos. Siempre pregunte por el CFT (Costo "
            "Financiero Total) que incluye todo. Y si el CFT no lo quieren "
            "decir, salga de ahi corriendo."
        )
    elif interest_pct > 50:
        lines.append(
            f"Posta: Mas de la mitad del prestamo se va en intereses. "
            "No es necesariamente malo si la inflacion esta arriba del "
            "3% mensual -- porque la cuota fija pierde valor real con "
            "el tiempo. Pero revisa bien el CFT porque los bancos "
            "siempre esconden algo en la letra chica."
        )
    elif interest_pct > 20:
        lines.append(
            f"Posta: Intereses moderados para el estandar argentino. "
            "Con inflacion del {monthly_inflation:.0f}% mensual, la cuota "
            "fija se te va licuando. El que toma prestamo en pesos a "
            "tasa fija en Argentina le esta apostando a que la inflacion "
            "siga alta. Si baja, perdiste. Si sube, ganaste. Es un "
            "futuro de inflacion disfrazado de prestamo personal."
        )
    else:
        lines.append(
            f"Posta: Intereses bajisimos. O tasas subsidiadas o "
            "prestamo en USD. Si es en USD, cuidado con la devaluacion: "
            "la cuota es fija en dolares pero tu sueldo es en pesos. "
            "Si se te devalua el peso un 10%, tu cuota aumento 10% "
            "sin que el banco mueva un dedo. Las deudas en USD son "
            "trampas de clase: parecen mas baratas hasta que el "
            "dolar se escapa y tu sueldo no."
        )

    return "\n".join(lines)
