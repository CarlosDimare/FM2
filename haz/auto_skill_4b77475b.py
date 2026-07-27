import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y horas semanales. Ej: '$2M 40h' o '$2M 50h'"

    m = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    m_h = re.search(r"(\d+)\s*h", t)

    if not m:
        return "No entendi."

    val = float(m.group(1).replace(",", ""))
    s = (m.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    horas_semana = int(m_h.group(1)) if m_h else 40
    horas_mes = horas_semana * 4.33
    valor_hora = val / horas_mes

    horas_extra_semana = max(0, horas_semana - 40)
    horas_extra_mes = horas_extra_semana * 4.33
    valor_extra_50 = valor_hora * 1.5
    valor_extra_100 = valor_hora * 2.0
    perdida_mensual = horas_extra_mes * valor_hora
    perdida_anual = perdida_mensual * 12

    lines = [
        "=== VALOR DE TU HORA ===",
        "Salario:  $ {:,.0f}/mes".format(val),
        "Horas:    {:.0f}/sem ({:.0f}/mes)".format(horas_semana, horas_mes),
        "Valor/h:  $ {:,.0f}".format(valor_hora),
        "",
    ]

    if horas_semana > 40:
        lines += [
            "Trabajas {:.0f}h extra por semana!".format(horas_extra_semana),
            "",
            "Si te pagaran las extras:",
            "- Al 50%: +$ {:,.0f}/mes".format(valor_extra_50 * horas_extra_mes),
            "- Al 100%: +$ {:,.0f}/mes".format(valor_extra_100 * horas_extra_mes),
            "",
            "Lo que estas regalando:",
            "- $ {:,.0f}/mes".format(perdida_mensual),
            "- $ {:,.0f}/ano".format(perdida_anual),
        ]
    else:
        lines += [
            "Trabajas {:.0f}h/sem ({:.0f}h extra disponibles a 50%)".format(horas_semana, 40 - horas_semana),
            "Si hicieras extras (al 50%): +$ {:,.0f}/mes".format(valor_hora * 1.5 * (40 - horas_semana) * 4.33),
        ]

    return "\n".join(lines)
