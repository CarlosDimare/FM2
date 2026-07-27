import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: alquiler_mensual precio_propiedad [down_payment_pct] [plazo_anios]\n"
            "Compara alquilar vs comprar una propiedad a largo plazo.\n"
            "Incluye inflacion, expensas, impuesto inmobiliario, y costo de oportunidad.\n"
            "Ej: 350000 85000000 15 30\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: faltan parametros (alquiler precio [down_pct] [plazo])."

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
        rent = parse_num(parts[0])
        price = parse_num(parts[1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    down_pct = 15
    term_years = 30
    if len(parts) >= 3:
        down_pct = parse_num(parts[2]) if parts[2].upper().endswith("K") or parts[2].upper().endswith("M") else float(parts[2])
    if len(parts) >= 4:
        term_years = int(parse_num(parts[3])) if parts[3].upper().endswith("K") or parts[3].upper().endswith("M") else int(parts[3])

    annual_inflation = 0.40
    monthly_inflation = annual_inflation / 12
    annual_appreciation = 0.05
    monthly_appreciation = annual_appreciation / 12
    annual_rent_increase = 0.35
    monthly_rent_increase = annual_rent_increase / 12
    expensas_pct = 0.12
    abb_pct = 0.008
    maintenance_pct = 0.01

    down_payment = price * (down_pct / 100)
    mortgage_principal = price - down_payment
    monthly_mortgage_rate = 0.05 / 12
    mortgage_payment = mortgage_principal * (monthly_mortgage_rate * (1 + monthly_mortgage_rate) ** (term_years * 12)) / ((1 + monthly_mortgage_rate) ** (term_years * 12) - 1)

    total_buy_costs = down_payment
    total_buy_monthly = 0
    total_rent_cost = 0
    current_rent = rent

    total_abb = price * abb_pct * term_years
    total_maintenance = price * maintenance_pct * term_years
    total_expensas = 0

    lost_interest_rate = 0.05
    opp_cost_yearly = down_payment * lost_interest_rate * term_years

    for y in range(term_years):
        yearly_rent = current_rent * 12
        total_rent_cost += yearly_rent

        yearly_expensas = current_rent * expensas_pct * 12
        total_expensas += yearly_expensas

        effective_rent = current_rent * (1 + expensas_pct)
        yearly_mortgage = mortgage_payment * 12

        total_buy_monthly += yearly_mortgage + yearly_expensas

        current_rent *= (1 + annual_rent_increase)

    future_value = price * (1 + annual_appreciation) ** term_years
    total_mortgage_paid = mortgage_payment * 12 * term_years

    rent_total = total_rent_cost + total_expensas
    buy_total = down_payment + total_mortgage_paid + total_maintenance + total_abb - future_value

    break_even_month = None
    cum_rent = 0
    cum_buy = down_payment
    cur_rent = rent
    for m in range(1, term_years * 12 + 1):
        cum_rent += cur_rent * (1 + expensas_pct)
        cum_buy += mortgage_payment

        cur_rent *= (1 + monthly_rent_increase)
        if cum_buy <= cum_rent and break_even_month is None:
            break_even_month = m
            break

    lines = []
    lines.append(f"ALQUILER VS COMPRA")
    lines.append(f"Precio propiedad: $ {price:,.0f}")
    lines.append(f"Alquiler mensual: $ {rent:,.0f}")
    lines.append(f"Plazo: {term_years} anios")
    lines.append(f"Entrega inicial ({down_pct}%): $ {down_payment:,.0f}")
    lines.append("---")
    lines.append(f"COSTO TOTAL ALQUILAR ({term_years} anios):")
    lines.append(f"  Alquileres pagados:    $ {total_rent_cost:,.0f}")
    lines.append(f"  Expensas estimadas:    $ {total_expensas:,.0f}")
    lines.append(f"  Total:                 $ {rent_total:,.0f}")
    lines.append("")
    lines.append(f"COSTO TOTAL COMPRAR ({term_years} anios):")
    lines.append(f"  Entrega:               $ {down_payment:,.0f}")
    lines.append(f"  Cuotas pagadas:        $ {total_mortgage_paid:,.0f}")
    lines.append(f"  Mantenimiento:         $ {total_maintenance:,.0f}")
    lines.append(f"  ABL+impuestos:         $ {total_abb:,.0f}")
    lines.append(f"  Valor futuro (venta): -$ {future_value:,.0f}")
    lines.append(f"  Total neto:            $ {buy_total:,.0f}")
    lines.append("")
    lines.append(f"DIFERENCIA:")
    diff = rent_total - buy_total
    if diff > 0:
        lines.append(f"  Comprar es mas barato por $ {abs(diff):,.0f}")
    else:
        lines.append(f"  Alquilar es mas barato por $ {abs(diff):,.0f}")
    lines.append("")
    lines.append(f"CUOTA HIPOTECARIA MENSUAL: $ {mortgage_payment:,.0f}")
    lines.append(f"  vs Alquiler actual:     $ {rent:,.0f}")
    ratio = mortgage_payment / rent if rent > 0 else 0
    lines.append(f"  Relacion cuota/alquiler: {ratio:.1f}x")
    lines.append("")
    if break_even_month:
        lines.append(f"Punto de equilibrio: mes {break_even_month}" if break_even_month <= term_years * 12 else "No llega a equilibrarse en el plazo")
    lines.append("")
    if ratio > 2:
        lines.append(
            "Posta: La cuota hipotecaria es el doble del alquiler. En Argentina, "
            "comprar es un lujo para los que ya tienen plata, no una alternativa "
            "para los que alquilan. El credito hipotecario es una trampa de clase: "
            "solo accede el que ya tiene capital, y el que no, paga alquiler de por "
            "vida mientras el dueno se jubila con tu plata."
        )
    elif ratio > 1.3:
        lines.append(
            "Posta: La cuota es mas cara que el alquiler pero tenes un activo. "
            "El problema es que en Argentina el credito hipotecario indexado por "
            "inflacion (UVA) hizo estragos: la cuota se te va al cielo y terminas "
            "debiendo mas que al principio. Comprar es apostar a que tu sueldo "
            "suba mas que la inflacion. Suerte con eso."
        )
    else:
        lines.append(
            "Posta: Si la cuota es similar al alquiler, comprar es negocio. "
            "En Argentina eso significa que la propiedad esta barata o la tasa "
            "esta subsidiada. Disfrutalo mientras dure. Y no te olvides de "
            "los que se quedan afuera del sistema porque no tienen para la entrega."
        )

    return "\n".join(lines)
