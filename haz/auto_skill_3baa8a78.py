import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone el sueldo de referencia en relacion de dependencia. Ej: '$2M'"

    m = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    if not m:
        return "No entendi el monto."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    rel_dep_mensual = val
    rel_dep_anual = rel_dep_mensual * 13

    deducciones = rel_dep_mensual * 0.19
    neto_mensual = rel_dep_mensual - deducciones
    neto_anual = neto_mensual * 12 + rel_dep_mensual

    obra_social_mensual = rel_dep_mensual * 0.03
    vacaciones_pagas_anual = rel_dep_mensual * 0.5
    antiguedad_anual = rel_dep_mensual * 0.01
    riesgo_cesantia = rel_dep_mensual * 0.08

    beneficio_anual = obra_social_mensual * 12 + vacaciones_pagas_anual + antiguedad_anual + riesgo_cesantia

    factor_equivalencia = neto_anual / (neto_mensual * 11)

    lines = [
        "=== COSTO REAL DEL MONOTRIBUTO ===",
        "Sueldo referencia rel. dependencia: $ {:,.0f}/mes".format(rel_dep_mensual),
        "",
        "En relacion de dependencia:",
        "- Neto mensual (aprox):     $ {:,.0f}".format(neto_mensual),
        "- Neto anual (con aguinaldo): $ {:,.0f}".format(neto_anual),
        "",
        "Beneficios que perdes como mono:",
        "- Obra social (3%):       $ {:,.0f}/ano".format(obra_social_mensual * 12),
        "- Vacaciones pagas (15d): $ {:,.0f}/ano".format(vacaciones_pagas_anual),
        "- Antiguedad:             $ {:,.0f}/ano".format(antiguedad_anual),
        "- Indemnizacion aprox:    $ {:,.0f}/ano".format(riesgo_cesantia),
        "",
        "Para igualar tu neto anual ($ {:,.0f})".format(neto_anual),
        "necesitas facturar MINIMO $ {:,.0f}/mes".format(neto_anual / 11),
        "(sin contar monotributo, IIBB, ganancias)",
    ]

    return "\n".join(lines)
