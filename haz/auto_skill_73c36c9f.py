import re
from datetime import datetime, date

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone una fecha y un evento. Ej: 'enero 2024' o '15 marzo 2023 ultimo aumento'"

    meses = {
        "enero": 1, "febrero": 2, "marzo": 3, "abril": 4,
        "mayo": 5, "junio": 6, "julio": 7, "agosto": 8,
        "septiembre": 9, "octubre": 10, "noviembre": 11, "diciembre": 12,
        "january": 1, "february": 2, "march": 3, "april": 4,
        "may": 5, "june": 6, "july": 7, "august": 8,
        "september": 9, "october": 10, "november": 11, "december": 12,
    }

    t_lower = t.lower()
    anio = None
    mes = None
    dia = 1

    m_anio = re.search(r"(\d{4})", t)
    if m_anio:
        anio = int(m_anio.group(1))

    for m_name, m_num in meses.items():
        if m_name in t_lower:
            mes = m_num
            break

    m_dia = re.search(r"\b(\d{1,2})\s+de\s+", t_lower)
    if m_dia:
        dia = int(m_dia.group(1))

    if not anio or not mes:
        return "No entendi la fecha. Pone 'enero 2024' o '15 marzo 2023'"

    try:
        fecha = date(anio, mes, dia)
    except:
        return "Fecha invalida."

    hoy = date.today()
    if fecha > hoy:
        return "Esa fecha es futura. Todavia no paso."

    dias = (hoy - fecha).days
    meses_t = dias // 30
    anos = meses_t // 12
    meses_r = meses_t % 12

    partes = []
    if anos > 0:
        partes.append("{} ano{}".format(anos, "s" if anos != 1 else ""))
    if meses_r > 0:
        partes.append("{} mes{}".format(meses_r, "es" if meses_r != 1 else ""))
    dias_r = dias - (meses_t * 30)
    if dias_r > 0 and not partes:
        partes.append("{} dia{}".format(dias_r, "s" if dias_r != 1 else ""))

    diff_str = ", ".join(partes) if partes else "menos de un mes"

    lines = [
        "=== CUANTO TIEMPO PASO ===",
        "Evento:  {}".format(t),
        "Fecha:   {}".format(fecha.strftime("%d/%m/%Y")),
        "Hoy:     {}".format(hoy.strftime("%d/%m/%Y")),
        "",
        "Pasaron: {} ({} dias)".format(diff_str, dias),
    ]

    # Contextual commentary
    if "aumento" in t_lower:
        lines.append("")
        if dias > 180:
            lines.append("Tu ultimo aumento fue hace mas de 6 meses. Tus companeros ya estan")
            lines.append("pidiendo otro. Vos tambien, pero te da verguenza.")
        else:
            lines.append("Hace poco. Disfrutalo. Hasta que la inflacion se lo coma.")
    elif "laburo" in t_lower or "trabajo" in t_lower or "empleo" in t_lower:
        lines.append("")
        if dias > 365 * 2:
            lines.append("Mas de 2 anos en el mismo lugar. En IT eso es una eternidad.")
            lines.append("Tu sueldo no crecio al mismo ritmo. O si?")
        elif dias > 365:
            lines.append("Un ano. La mayoria de los devs ya cambiaron 3 veces de laburo.")
            lines.append("Vos seguis ahi. Aguante la fidelidad corporativa.")
        else:
            lines.append("Todavia estas en periodo de prueba. No te quejes mucho.")
    elif "inflacion" in t_lower or "devaluacion" in t_lower:
        lines.append("")
        lines.append("En ese periodo, los precios subieron aproximadamente un {:.0f}%.".format(dias / 30 * 3))

    return "\n".join(lines)
