import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario en ARS y el pais de referencia. Ej: '$2M Spain' o 'USD3000 USA'"

    m_salario = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|usd|dolares)?", t, re.IGNORECASE)
    if not m_salario:
        return "No entendi el salario."

    val = float(m_salario.group(1).replace(",", ""))
    s = (m_salario.group(2) or "").lower().strip()
    usd_mode = "usd" in t.lower()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    salario_ars = val * (1_400 if usd_mode else 1)
    salario_usd = salario_ars / 1_400

    # PPP data (big mac index style, rough 2026)
    paises = {
        "argentina":    {"ppp": 1.0, "salario_prom": 2_500_000},
        "spain":        {"ppp": 2.8, "salario_prom_usd": 3_200},
        "espania":      {"ppp": 2.8, "salario_prom_usd": 3_200},
        "usa":          {"ppp": 3.5, "salario_prom_usd": 7_500},
        "estados unidos": {"ppp": 3.5, "salario_prom_usd": 7_500},
        "uk":           {"ppp": 3.2, "salario_prom_usd": 5_000},
        "reino unido":  {"ppp": 3.2, "salario_prom_usd": 5_000},
        "brasil":       {"ppp": 1.5, "salario_prom_usd": 2_000},
        "chile":        {"ppp": 1.8, "salario_prom_usd": 2_500},
        "uruguay":      {"ppp": 2.0, "salario_prom_usd": 2_800},
        "mexico":       {"ppp": 1.6, "salario_prom_usd": 2_200},
        "colombia":     {"ppp": 1.3, "salario_prom_usd": 1_800},
        "peru":         {"ppp": 1.2, "salario_prom_usd": 1_500},
        "alemanha":     {"ppp": 3.0, "salario_prom_usd": 4_800},
        "germany":      {"ppp": 3.0, "salario_prom_usd": 4_800},
        "francia":      {"ppp": 2.9, "salario_prom_usd": 4_200},
        "france":       {"ppp": 2.9, "salario_prom_usd": 4_200},
        "italia":       {"ppp": 2.5, "salario_prom_usd": 3_500},
        "italy":        {"ppp": 2.5, "salario_prom_usd": 3_500},
        "canada":       {"ppp": 3.3, "salario_prom_usd": 5_500},
        "australia":    {"ppp": 3.4, "salario_prom_usd": 5_800},
    }

    t_lower = t.lower()
    pais = "argentina"
    for key in paises:
        if key in t_lower:
            pais = key
            break

    data = paises[pais]
    ppp = data["ppp"]
    salario_ajustado_usd = salario_usd / ppp
    salario_prom_usd = data.get("salario_prom_usd", 2_500)
    diff = salario_ajustado_usd - salario_prom_usd
    pct = salario_ajustado_usd / salario_prom_usd * 100

    lines = [
        "=== PODER ADQUISITIVO GLOBAL ===",
        "Tu salario: US$ {:,.0f}/mes (ARS $ {:,.0f})".format(salario_usd, salario_ars),
        "PPP {}: {:.1f}x".format(pais.capitalize(), ppp),
        "Salario ajustado: US$ {:,.0f}/mes".format(salario_ajustado_usd),
        "",
        "Comparado con el salario promedio de IT en {} (US$ {:,.0f}):".format(pais.capitalize(), salario_prom_usd),
    ]

    if diff > 0:
        lines.append("Tu salario ajustado es US$ {:,.0f} ({:.0f}%) por encima del promedio local.".format(diff, pct - 100))
    elif diff < 0:
        lines.append("Tu salario ajustado es US$ {:,.0f} ({:.0f}%) por debajo del promedio local.".format(abs(diff), 100 - pct))
    else:
        lines.append("Tu salario ajustado es igual al promedio local.")

    return "\n".join(lines)
