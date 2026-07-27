import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone un precio en pesos. Ej: '$5000' o '$100000'."

    m = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el precio."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    # Convert to hours of work at various rates
    smvm = 380_000  # Salario Minimo Vital y Movil mensual
    smvm_hora = smvm / 160
    it_hora = 2_000_000 / 160  # Dev promedio IT (~$2M/mes)
    uocra_hora = 1_500_000 / 160  # Construccion
    docente_hora = 1_000_000 / 160  # Docente inicial

    lines = [
        "=== PRECIO EN HORAS DE TRABAJO ===",
        "Precio: $ {:,.0f}".format(val),
        "",
        "Lo que vale en horas de laburo:",
        "- {:.0f}h de SMVM ($ {:,.0f}/h)".format(val / smvm_hora, smvm_hora),
        "- {:.0f}h de dev IT promedio ($ {:,.0f}/h)".format(val / it_hora, it_hora),
        "- {:.0f}h de construccion ($ {:,.0f}/h)".format(val / uocra_hora, uocra_hora),
        "- {:.0f}h de docente ($ {:,.0f}/h)".format(val / docente_hora, docente_hora),
        "",
        "En dias laborales (8h):",
        "- {:.1f} para SMVM".format(val / smvm_hora / 8),
        "- {:.1f} para dev IT".format(val / it_hora / 8),
    ]

    return "\n".join(lines)
