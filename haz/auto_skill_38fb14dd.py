import re

def run(ctx):
    msg = ctx.get("message", "")
    if not msg:
        return "Pone un proyecto open source y algunas metricas (estrellas, contributors, descargas anuales) y te calculo cuanto valor no capturado genero su mantenedor."
    return analyze(msg)


def analyze(text):
    stars = extract_number(text, ["estrella", "star", "github"])
    downloads = extract_number(text, ["descarga", "download", "npm", "pip"])
    contributors = extract_number(text, ["contributor", "contribuidor", "colaborador"])
    maintainers = extract_number(text, ["mantenedor", "maintainer", "owner"])
    if maintainers == 0:
        maintainers = 1
    if stars == 0 and downloads == 0:
        return "No detecte estrellas ni descargas. Pone algo como 'react 100k stars, 100M descargas' o 'mi-libreria 5k stars, 500k npm'."
    if downloads == 0 and stars > 0:
        downloads = stars * 100
    if stars == 0 and downloads > 0:
        stars = downloads // 100

    replacement_value = downloads * 0.0005
    if replacement_value < 1000:
        replacement_value = stars * 100

    monthly_salary = 3500
    dev_years = replacement_value / (monthly_salary * 13)
    unpaid_value = replacement_value * 0.86
    backup_risk = round(min(100, 100 - (maintainers * 15)), 1)

    lines = [
        f"Proyecto analizado (estimaciones):",
        f"  Estrellas: ~{stars:,}",
        f"  Descargas/anuales: ~{downloads:,}",
        f"  Contributors activos: ~{contributors if contributors else 'desconocido'}",
        f"  Mantenedores efectivos: {maintainers}",
        "",
        f"Valor de reemplazo estimado: USD {replacement_value:,.0f}",
        f"  (lo que costaria reconstruir esto desde cero con un equipo pago)",
        f"Valor no capturado por mantenedores: USD {unpaid_value:,.0f}",
        f"  (86% del valor, porque el 60% de mantenedores no cobra y el resto cobra poco)",
        "",
        f"Con USD {replacement_value:,.0f} se podrian pagar {dev_years:.1f} anios de un dev sr.",
        f"  (a USD {monthly_salary}/mes x 13 sueldos, que es lo que gana un dev en Big Tech)",
        f"El mantenedor promedio genera eso y recibe USD 0.",
        "",
        f"Riesgo de abandono/burnout: {backup_risk}%",
    ]
    if maintainers == 1:
        lines.append("  (bus factor = 1: si este pibe se cansa, se cae media internet)")
    elif maintainers <= 3:
        lines.append("  (bus factor bajo: dos de los tres mantenedores son el mismo dev con cuentas alternativas)")
    else:
        lines.append("  (bus factor aceptable: todavia no murio nadie)")

    lines.append("")
    lines.append(f"Para contextualizar: las descargas anuales ({downloads:,})")
    lines.append(f"equivalen a {downloads // 8_000_000_000 if downloads >= 8_000_000_000 else 0} instalaciones por cada habitante del planeta.")
    if downloads > 1_000_000_000:
        lines.append(f"Tu codigo se ejecuta en mas dispositivos que la poblacion de la Tierra.")
        lines.append(f"Y vos seguis esperando que alguien te sponsor cafe en GitHub Sponsors.")
    elif downloads > 100_000_000:
        lines.append(f"Tu libreria esta en 1 de cada 80 dispositivos del mundo.")
        lines.append(f"Todavia no llegaste a la poblacion total de Mexico, pero casi.")
        lines.append(f"Y seguis sin cobrar un peso.")
    else:
        lines.append(f"Todavia no sos Linux, pero estas en camino.")
        lines.append(f"El hambre no espera, pero las estrellas de GitHub tampoco.")

    return "\n".join(lines)


def extract_number(text, keywords):
    for kw in keywords:
        pattern = rf"(\d[\d,.]*)([kKmM]?B?)\s*(?:{re.escape(kw)}s?)"
        m = re.search(pattern, text, re.IGNORECASE)
        if m:
            return apply_suffix(parse_raw_int(m.group(1)), m.group(2))
    for kw in keywords:
        pattern2 = rf"(?:{re.escape(kw)}s?)\s*[:\-]?\s*(\d[\d,.]*)([kKmM]?B?)"
        m = re.search(pattern2, text, re.IGNORECASE)
        if m:
            return apply_suffix(parse_raw_int(m.group(1)), m.group(2))
    return 0


def parse_raw_int(s):
    s = s.replace(",", "").strip()
    if "." in s:
        try:
            return int(float(s))
        except ValueError:
            return 0
    return int(s) if s.isdigit() else 0


def apply_suffix(n, suffix):
    s = suffix.lower()
    if s == "b":
        return n * 1_000_000_000
    if s == "m":
        return n * 1_000_000
    if s == "k":
        return n * 1000
    return n
