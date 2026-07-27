import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un monto en pesos. Ej: '$1M' o '500000'."

    m = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el monto."

    val = float(m.group(1).replace(",", ""))
    suffix = (m.group(2) or "").lower().strip()

    if suffix in ("k", "mil"):
        val *= 1_000
    elif suffix in ("m", "millones"):
        val *= 1_000_000

    rates = {
        "Oficial": 950,
        "Blue": 1400,
        "MEP": 1350,
        "CCL": 1380,
        "Tarjeta": 1420,
        "Crypto": 1390,
    }

    lines = [
        "=== ARS -> USD ===",
        "Monto: $ {:,.0f}".format(val),
        "",
    ]

    for name, rate in rates.items():
        usd = val / rate
        lines.append("{:8s}: USD {:,.2f} (${:,.0f})".format(name, usd, rate))

    lines += [
        "",
        "=== BRECHA ===",
        "Blue vs Oficial: {:.1f}%".format((rates["Blue"] / rates["Oficial"] - 1) * 100),
        "Perdes $ {:,.0f} cada $1M si cambias al oficial".format(
            round(1_000_000 / rates["Oficial"] - 1_000_000 / rates["Blue"])
        ),
    ]

    return "\n".join(lines)
