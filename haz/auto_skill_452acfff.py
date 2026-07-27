import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario mensual y horas de reuniones por semana. Ej: '$2M 10h reuniones'"

    m_salario = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    m_reuniones = re.search(r"(\d+(?:[.,]\d+)?)\s*h", t, re.IGNORECASE)

    if not m_salario:
        return "No entendi. Pone algo como '$2M 10h reuniones'"

    val = float(m_salario.group(1).replace(",", ""))
    s = (m_salario.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        val *= 1_000
    elif s in ("m", "millones"):
        val *= 1_000_000

    horas_reunion = float(m_reuniones.group(1)) if m_reuniones else 5
    horas_totales = 40
    horas_reunion_sem = horas_reunion
    horas_efectivas_sem = horas_totales - horas_reunion_sem
    horas_efectivas_mes = horas_efectivas_sem * 4.33

    valor_hora_bruto = val / (horas_totales * 4.33)
    valor_hora_efectiva = val / horas_efectivas_mes
    perdida_semanal = horas_reunion_sem * valor_hora_bruto
    perdida_mensual = perdida_semanal * 4.33
    perdida_anual = perdida_mensual * 12

    pct_reunion = horas_reunion_sem / horas_totales * 100

    lines = [
        "=== VALOR REAL DE TU HORA ===",
        "Salario:   $ {:,.0f}/mes".format(val),
        "Horas totales:    {}h/sem ({}h/mes)".format(horas_totales, int(horas_totales * 4.33)),
        "Reuniones:        {:.0f}h/sem ({:.0f}% del tiempo)".format(horas_reunion_sem, pct_reunion),
        "Horas efectivas:  {:.0f}h/sem ({:.0f}h/mes)".format(horas_efectivas_sem, horas_efectivas_mes),
        "",
        "Valor/h bruto:    $ {:,.0f}".format(valor_hora_bruto),
        "Valor/h efectivo: $ {:,.0f}".format(valor_hora_efectiva),
        "",
        "Perdida en reuniones:",
        "- $ {:,.0f}/semana".format(perdida_semanal),
        "- $ {:,.0f}/mes".format(perdida_mensual),
        "- $ {:,.0f}/ano".format(perdida_anual),
    ]

    return "\n".join(lines)
