import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu sueldo y un gasto. Ej: '$2M $50000 Netflix'"

    m_sueldo = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    partes = re.findall(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)

    if len(partes) < 2:
        return "No entendi. Pone '$2M $50000 Netflix' (sueldo + gasto)"

    sueldo = float(partes[0][0].replace(",", ""))
    s1 = partes[0][1].lower().strip()
    if s1 in ("k", "mil"):
        sueldo *= 1_000
    elif s1 in ("m", "millones"):
        sueldo *= 1_000_000

    gasto = float(partes[1][0].replace(",", ""))
    s2 = partes[1][1].lower().strip()
    if s2 in ("k", "mil"):
        gasto *= 1_000
    elif s2 in ("m", "millones"):
        gasto *= 1_000_000

    desc = t.split("$")[-1].strip() if "$" in t else ""
    desc = desc.replace(str(gasto), "").strip()
    if not desc:
        desc = "ese gasto"

    horas_mes = 160
    valor_hora = sueldo / horas_mes
    horas_por_gasto = gasto / valor_hora
    dias_por_gasto = horas_por_gasto / 8

    sueldo_diario = sueldo / 20.67
    dias_por_gasto_sd = gasto / sueldo_diario

    pct_sueldo = (gasto / sueldo) * 100

    lines = [
        "=== HORAS DE VIDA ===",
        "Sueldo: $ {:,.0f}/mes".format(sueldo),
        "Gasto:  $ {:,.0f} ({})".format(gasto, desc),
        "",
        "Te cuesta:",
        "- {:.1f} horas de trabajo ({:.1f} dias de 8h)".format(horas_por_gasto, dias_por_gasto),
        "- {:.1f}% de tu sueldo mensual".format(pct_sueldo),
        "",
        "Al ano:",
        "- Gastas $ {:,.0f} en {}".format(gasto * 12, desc),
        "- Equivale a {:.0f} horas de tu vida por ano".format(horas_por_gasto * 12),
    ]

    return "\n".join(lines)
