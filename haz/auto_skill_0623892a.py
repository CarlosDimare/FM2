import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y cuantos son. Ej: '$2M 2 adultos 1 nino'"

    m_salario = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m_salario:
        return "No entendi el salario."

    val = float(m_salario.group(1).replace(",", ""))
    s = (m_salario.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    m_adultos = re.search(r"(\d+)\s*(adulto|adultos|grande|grandes)", t, re.IGNORECASE)
    m_ninos = re.search(r"(\d+)\s*(nino|ninos|nina|ninas|chico|chicos|menor|menores)", t, re.IGNORECASE)

    adultos = int(m_adultos.group(1)) if m_adultos else 2
    ninos = int(m_ninos.group(1)) if m_ninos else 0

    # CBT individual baseline CABA 2026
    cbt_individual = 1_200_000
    # Family equivalence scale: 1st adult = 1, 2nd adult = 0.74, children = 0.63 each
    eq_adultos = 1 + (adultos - 1) * 0.74
    eq_ninos = ninos * 0.63
    eq_total = eq_adultos + eq_ninos
    cbt_familiar = cbt_individual * eq_total

    deficit = val - cbt_familiar
    pct = val / cbt_familiar * 100

    lines = [
        "=== CANASTA BASICA FAMILIAR ===",
        "Hogar: {} adultos, {} ninos".format(adultos, ninos),
        "Salario: $ {:,.0f}".format(val),
        "",
        "Canasta Basica Total (CABA):",
        "- Individual: $ {:,.0f}".format(cbt_individual),
        "- Familiar (eq {:.2f}): $ {:,.0f}".format(eq_total, cbt_familiar),
        "",
    ]

    if deficit >= 0:
        lines += [
            "Tu salario cubre la CBT familiar.",
            "Te sobran $ {:,.0f}/mes ({:.0f}% por encima)".format(deficit, pct - 100),
        ]
    else:
        # How many minimum salaries needed
        smvm = 380_000
        salarios_necesarios = cbt_familiar / val
        lines += [
            "NO cubris la CBT familiar.",
            "Te faltan $ {:,.0f}/mes (cubris solo el {:.0f}%)".format(abs(deficit), pct),
            "Necesitarias {:.1f} salarios iguales al tuyo.".format(salarios_necesarios),
            "",
            "Con el SMVM ($ {:,.0f}) necesitarian {:.0f} personas trabajando.".format(smvm, cbt_familiar / smvm + 1),
        ]

    return "\n".join(lines)
