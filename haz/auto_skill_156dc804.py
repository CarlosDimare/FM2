import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario mensual y el gasto que quieras reducir. Ej: '$2M $50000 cafes'"

    m_salario = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m_salario:
        return "No entendi. Pone '$2M $50000 cafes'"

    val = float(m_salario.group(1).replace(",", ""))
    s = (m_salario.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    # Find all amounts after the salary
    partes = re.findall(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if len(partes) < 2:
        return "Pone al menos un gasto para reducir."

    gastos = []
    for i in range(1, min(len(partes), 4)):
        g = float(partes[i][0].replace(",", ""))
        sg = partes[i][1].lower().strip()
        if sg in ("k", "mil"):
            g *= 1_000
        elif sg in ("m", "millones"):
            g *= 1_000_000
        gastos.append(g)

    total_ahorro = sum(gastos)
    ahorro_anual = total_ahorro * 12

    # If you invest the savings at various rates
    for tasa, nombre in [(0.05, "plazo fijo (5% anual)"), (0.10, "acciones (10% anual)")]:
        valor_final = ahorro_anual * ((1 + tasa) ** 10 - 1) / tasa
        # lol too complex, simplify

    pct_ahorro = total_ahorro / val * 100
    anos_jubilacion = 30
    total_jubilacion = ahorro_anual * anos_jubilacion

    lines = [
        "=== AHORRO POR REDUCCION DE GASTOS ===",
        "Salario:   $ {:,.0f}/mes".format(val),
        "",
        "Gastos a reducir:",
    ]

    for i, g in enumerate(gastos):
        lines.append("  {}: $ {:,.0f}/mes".format(i + 1, g))

    lines += [
        "",
        "Ahorro total: $ {:,.0f}/mes ({:.1f}% del salario)".format(total_ahorro, pct_ahorro),
        "Ahorro anual: $ {:,.0f}".format(ahorro_anual),
        "",
        "En 30 anos (jubilacion) serian $ {:,.0f}".format(total_jubilacion),
        "(sin contar interes compuesto, porque en Argentina no existe)",
        "",
        "Con ese ahorro mensual ($ {:,.0f})".format(total_ahorro),
        "en 5 anos tendrias $ {:,.0f}".format(total_ahorro * 12 * 5),
        "suficiente para la entrada de un monoambiente en La Matanza.",
    ]

    return "\n".join(lines)
