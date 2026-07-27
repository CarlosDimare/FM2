import re

def run(ctx):
    msg = ctx.get("message", "")
    if not msg:
        return "Pone un monto de deuda en USD, tasa de interes y plazo. Ej: 'deuda 57B, tasa 9%, 10 anios' o 'prestamo 100k, interes 5, 24 meses'. Te calculo cuanto pagas de mas y a cuantas jubilaciones equivale."
    return analyze(msg)


def analyze(text):
    t = text.lower()
    principal = extract_money(t)
    rate = extract_rate(t)
    term_years = extract_years(t)
    if not principal:
        return "No detecte un monto de deuda. Pone algo como 'deuda 57B USD' o '100k' o '10 millones'."
    if not rate:
        rate = 9.0
    if not term_years:
        term_years = 10

    monthly_rate = rate / 100 / 12
    months = int(term_years * 12)
    if monthly_rate == 0:
        monthly_payment = principal / months
    else:
        monthly_payment = principal * (monthly_rate * (1 + monthly_rate) ** months) / ((1 + monthly_rate) ** months - 1)
    total_paid = monthly_payment * months
    total_interest = total_paid - principal

    jubilacion_minima = 300
    hospital = 15_000_000
    escuela = 3_000_000
    canasta_basica_month = 1005
    jubilaciones_year = int(total_interest / jubilacion_minima)
    hospitales = int(total_interest / hospital)
    escuelas = int(total_interest / escuela)
    canastas = int(total_interest / canasta_basica_month)

    lines = [
        f"Deuda: USD {principal:,.0f}",
        f"Tasa: {rate:.1f}% anual",
        f"Plazo: {term_years:.0f} anios ({months} meses)",
        f"",
        f"Pago mensual: USD {monthly_payment:,.0f}",
        f"Total pagado: USD {total_paid:,.0f}",
        f"Total intereses: USD {total_interest:,.0f}",
        f"",
        f"Los intereses de USD {total_interest:,.0f} equivalen a:",
        f"  - {jubilaciones_year:,} jubilaciones minimas",
        f"    (o sea, {jubilaciones_year // 12:,} anios de jubilaciones para una persona)",
        f"  - {hospitales:,} hospitales publicos nuevos",
        f"  - {escuelas:,} escuelas primarias",
        f"  - {canastas:,} canastas basicas alimentarias",
    ]

    ratio = total_interest / principal if principal else 0
    lines.append("")
    if ratio >= 10:
        lines.append(f"Estas pagando {ratio:.1f}x el principal solo en intereses.")
        lines.append(f"Es como pedir USD 1 y devolver USD {1 + ratio:.1f}.")
        lines.append(f"Tasa usuraria. El prestamista se compro un yate.")
        lines.append(f"Tipico de deuda argentina con fondos buitre.")
    elif ratio >= 3:
        lines.append(f"Intereses: {ratio:.1f}x el principal. Duelo.")
        lines.append(f"Tasa alta. Tipica de tarjeta de credito.")
        lines.append(f"Argentina tiene relaciones mas sanas con el FMI.")
    elif ratio >= 1:
        lines.append(f"Intereses: {ratio:.1f}x el principal.")
        lines.append(f"Tasa moderada. Lo normal en el capitalismo serio.")
        lines.append(f"Sigue siendo injusto, pero al menos es legal.")
    elif ratio >= 0.5:
        lines.append(f"Intereses: {ratio:.1f}x el principal.")
        lines.append(f"Tasa normal en un credito hipotecario o de largo plazo.")
        lines.append(f"Si pagas esto durante 30 anios, el banco te ama.")
    else:
        lines.append(f"Intereses: {ratio:.1f}x el principal (bajo).")
        lines.append(f"Tasa baja. Esto no existe en Argentina.")
        lines.append(f"Si existe, probablemente es un prestamo entre familiares.")
        lines.append(f"O un plan plat. En cualquiera de los dos casos:")
        lines.append(f"no lo cuentes en el asado porque te dicen cheto.")

    lines.append("")
    lines.append(f"Conclusion: si en vez de pagar intereses, pusieras esa plata")
    lines.append(f"en un plazo fijo en pesos argentinos, ganarias... nada.")
    lines.append(f"La inflacion se come todo. Mejor paga la deuda.")
    lines.append(f"(O no la pagues y espera el proximo blanqueo. Total, es Argentina.)")
    return "\n".join(lines)


SUFFIX_MULTIPLIERS = {"b": 1_000_000_000, "m": 1_000_000, "k": 1000}

def extract_money(text):
    t = text.lower()
    patterns = [
        r"(?:deuda|prestamo|credito)\s*[:\-]?\s*(\d[\d,.]*)\s*([bBkKmM])?",
        r"(\d[\d,.]*)\s*([bBkKmM])\s*(?:usd|dolares?|dls)?",
        r"(\d[\d,.]*)\s*(?:usd|dolares?|dls)",
        r"(\d[\d,.]+)\s*(?:usd|dolares?|dls)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = parse_money(m.group(1))
            if not val:
                continue
            suffix = m.group(2) if m.lastindex and m.lastindex >= 2 else None
            if suffix:
                s = suffix.lower()
                if s in SUFFIX_MULTIPLIERS:
                    val *= SUFFIX_MULTIPLIERS[s]
            return val
    return None


def parse_money(s):
    s = s.replace(",", "").strip()
    if s.replace(".", "").isdigit():
        if "." in s:
            return int(float(s))
        return int(s)
    try:
        return int(float(s))
    except (ValueError, OverflowError):
        return None


def extract_rate(text):
    m = re.search(r"(\d[\d.]*)\s*%", text)
    if m:
        return float(m.group(1))
    m = re.search(r"(?:tasa|interes)\s*[:\-]?\s*(\d[\d.]*)", text, re.IGNORECASE)
    if m:
        return float(m.group(1))
    return None


def extract_years(text):
    m = re.search(r"(\d+)\s*(?:anios|anios|years?|annos)", text, re.IGNORECASE)
    if m:
        return int(m.group(1))
    m = re.search(r"(\d+)\s*(?:meses|months)", text, re.IGNORECASE)
    if m:
        return int(m.group(1)) / 12
    return None
