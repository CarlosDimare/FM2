import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone precio contado y precio financiado. Ej: 'contado $200000, cuotas $250000 en 12' o 'cash 500k, financed 650k 6 cuotas'."

    m_contado = re.search(
        r"(?:contado|cash|efectivo)\s*(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?",
        t, re.IGNORECASE
    )
    m_financiado = re.search(
        r"(?:financiado|financed|cuotas?|total\s+fin|precio\s+fin)\s*(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?",
        t, re.IGNORECASE
    )
    m_cuotas = re.search(r"(\d+)\s*(?:cuotas?|veces?|pagos?)", t, re.IGNORECASE)

    if not m_contado or not m_financiado or not m_cuotas:
        return "No entendi. Pone 'contado $X, financiado $Y en Z cuotas'."

    def parse(m):
        val = float(m.group(1).replace(",", ""))
        s = (m.group(2) or "").lower().strip()
        if s in ("k", "mil"):
            val *= 1_000
        elif s in ("m", "millones"):
            val *= 1_000_000
        return val

    contado = parse(m_contado)
    financiado = parse(m_financiado)
    cuotas = int(m_cuotas.group(1))

    if contado <= 0 or financiado <= 0 or cuotas <= 0:
        return "Valores invalidos."

    sobrecosto = financiado - contado
    sobrecosto_pct = sobrecosto / contado * 100
    cuota_mensual = financiado / cuotas

    # Estimate effective monthly interest rate (simplified)
    # Using approximation: total interest / cuotas / (contado / cuotas)
    tasa_mensual_aprox = (financiado / contado - 1) / cuotas * 100

    inflacion_mensual = 3.0
    valor_real_cuotas = sum(cuota_mensual / ((1 + inflacion_mensual / 100) ** i) for i in range(cuotas))
    perdida_vendedor = financiado - valor_real_cuotas if financiado > valor_real_cuotas else 0
    ganancia_comprador = contado - valor_real_cuotas if contado > valor_real_cuotas else 0

    lines = [
        "=== CUOTAS vs CONTADO ===",
        "Contado:    $ {:,.0f}".format(contado),
        "Financiado: $ {:,.0f} en {} cuotas".format(financiado, cuotas),
        "Cuota:      $ {:,.0f}".format(cuota_mensual),
        "",
        "Sobrecosto: $ {:,.0f} ({:.1f}%)".format(sobrecosto, sobrecosto_pct),
        "Tasa mensual estimada: {:.1f}%".format(tasa_mensual_aprox),
    ]

    if inflacion_mensual > tasa_mensual_aprox:
        lines += [
            "",
            "Con inflacion al {:.0f}% mensual, te conviene financiar:".format(inflacion_mensual),
            "el vendedor pierde $ {:,.0f} en valor real.".format(abs(perdida_vendedor)),
            "La cuota fija se licua con la inflacion.",
        ]
    else:
        lines += [
            "",
            "El sobrecosto le gana a la inflacion ({:.0f}% mensual).".format(inflacion_mensual),
            "Mejor paga contado si podes.",
        ]

    lines += [
        "",
        "Regla de clase: el que paga en cuotas",
        "paga mas, pero el que paga contado",
        "ya tenia la plata. La pobreza cobra interes.",
    ]

    return "\n".join(lines)
