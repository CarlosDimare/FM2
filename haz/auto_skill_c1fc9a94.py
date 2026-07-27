import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y seniority. Ej: '$2M SSR' o 'USD4000 SR'"

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

    salario = val * (1_400 if usd_mode else 1)

    # IT salary benchmarks Argentina 2026 (monthly ARS)
    benchmarks = {
        "jr":      1_200_000,
        "junior":  1_200_000,
        "trainee": 800_000,
        "ssr":     2_500_000,
        "semisenior": 2_500_000,
        "sr":      4_000_000,
        "senior":  4_000_000,
        "lead":    5_500_000,
        "tl":      5_500_000,
        "architect": 6_500_000,
        "arch":    6_500_000,
        "cto":     8_000_000,
    }

    t_lower = t.lower()
    nivel = "ssr"
    for key in benchmarks:
        if key in t_lower:
            nivel = key
            break

    benchmark = benchmarks.get(nivel, 2_500_000)
    diff = salario - benchmark
    pct = salario / benchmark * 100

    lineas = [
        "=== BENCHMARK SALARIAL IT ===",
        "Seniority: {}".format(nivel.upper()),
        "Tu salario: $ {:,.0f}".format(salario),
        "Benchmark:  $ {:,.0f}".format(benchmark),
        "",
    ]

    if diff > 0:
        lineas += [
            "Estas por encima del promedio del mercado.",
            "+$ {:,.0f}/mes ({:.0f}% arriba)".format(diff, pct - 100),
        ]
    elif diff < 0:
        lineas += [
            "Estas por debajo del promedio del mercado.",
            "-$ {:,.0f}/mes ({:.0f}% abajo)".format(abs(diff), 100 - pct),
            "",
            "Te estan pagando un {:.0f}% de lo que vale el puesto.".format(pct),
        ]
    else:
        lineas.append("Estas exactamente en el promedio del mercado.")

    return "\n".join(lineas)
