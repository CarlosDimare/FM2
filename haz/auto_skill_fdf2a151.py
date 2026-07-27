import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario neto mensual. Ej: $1.5M o USD2000."

    m = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones|usd|dolares)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el salario."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    usd_mode = "usd" in t.lower()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    salario_mensual = val * (1_400 if usd_mode else 1)

    anual = salario_mensual * 13
    smvm_anual = 380_000 * 13
    canasta_basica = 1_200_000
    canasta_ampliada = 1_700_000

    days_per_month = 20.67
    valor_dia = salario_mensual / days_per_month

    # Cost of a week off (vacations)
    semana_vacaciones = valor_dia * 5
    ano_sin_vacaciones = semana_vacaciones * 0  # You just... don't take them

    # How many months of savings = 1 month salary (if you save X%)
    meses_para_ahorrar_1_sueldo = 1.0 / 0.15  # assuming 15% savings rate

    lines = [
        "=== COSTO OCULTO DE LA PRECARIEDAD ===",
        "Salario mensual: $ {:,.0f}".format(salario_mensual),
        "",
        "Valor de cada dia: $ {:,.0f}".format(valor_dia),
        "Una semana de vacaciones no pagas: $ {:,.0f}".format(semana_vacaciones),
        "",
        "Si trabajas en negro, perdes por ANO:",
        "- 13ro (aguinaldo):   $ {:,.0f}".format(salario_mensual),
        "- Vacaciones (15d):   $ {:,.0f}".format(valor_dia * 15),
        "- Obra social:        $ {:,.0f}".format(salario_mensual * 0.03 * 12),
        "- Antiguedad:         incalculable",
        "- Indemnizacion:      $ {:,.0f} por ano trabajado".format(salario_mensual),
        "",
        "Total perdido aprox: $ {:,.0f}/ano".format(salario_mensual + valor_dia * 15 + salario_mensual * 0.03 * 12 + salario_mensual),
    ]

    return "\n".join(lines)
