import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone una fecha y un monto. Ej: 'enero 2020: $100000' o 'marzo 2025: $2M'."

    m_fecha = re.search(r"(\w+)\s*(\d{4})", t)
    m_monto = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)

    if not m_fecha or not m_monto:
        return "No entendi. Pone 'mes anio: $monto', ej: 'enero 2020: $100000'."

    meses = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
        "julio": 7, "agosto": 8, "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
        "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
        "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12,
    }

    mes_str = m_fecha.group(1).lower().strip()
    anio = int(m_fecha.group(2))
    mes = meses.get(mes_str)

    if not mes:
        return "No entendi el mes."

    val = float(m_monto.group(1).replace(",", ""))
    s = (m_monto.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    # Approximate monthly inflation rates (simplified historical averages)
    # Very rough estimates for demonstration
    inflacion_mensual = {
        2020: 0.025, 2021: 0.03, 2022: 0.05, 2023: 0.08, 2024: 0.12, 2025: 0.04, 2026: 0.03
    }

    tasa = inflacion_mensual.get(anio, 0.03)
    if anio < 2020:
        for y in range(anio, 2020):
            if y in inflacion_mensual:
                pass  # We simplify here

    # Simple calculation: cumulative inflation from that year to now
    anio_actual = 2026
    mes_actual = 6
    anos_diff = anio_actual - anio
    meses_diff = meses_diff = (anos_diff * 12) + (mes_actual - mes)

    if meses_diff < 0:
        return "La fecha no puede ser futura."

    # Use a simplified model: ~5% monthly average
    tasa_promedio = 0.05
    factor = (1 + tasa_promedio) ** meses_diff
    valor_actual = val * factor
    perdida = valor_actual - val

    lines = [
        "=== INFLACION: VALOR ACTUAL ===",
        "Original:  $ {:,.0f} ({}/{})".format(val, mes_str.capitalize(), anio),
        "Hoy:       $ {:,.0f}".format(valor_actual),
        "Diferencia: $ {:,.0f} ({:.0f} meses)".format(perdida, meses_diff),
        "",
        "Para mantener el mismo poder adquisitivo,",
        "hoy necesitarias $ {:,.0f}.".format(valor_actual),
    ]

    return "\n".join(lines)
