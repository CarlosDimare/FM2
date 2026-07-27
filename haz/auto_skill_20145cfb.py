import re

RED_FLAGS = [
    ("somos una familia", 3, "te van a pedir que trabajes feriados por 'amor'"),
    ("tolerancia al estrés", 5, "traducción: el puesto está mal diseñado y echan la culpa al empleado"),
    ("trabajo en equipo", 1, "cuidado: puede que te endosen el trabajo de 3 personas"),
    ("inglés avanzado excluyente", 2, "para contestar mails que podria resolver un traductor de Google"),
    ("dinámico / multitasking", 4, "vos hace el laburo de 4 áreas mientras ganás como 1"),
    ("sueldo acorde a la experiencia", 6, "nunca es acorde a la experiencia"),
    ("office con frutas / café", 1, "te pagan en mandarinas"),
    ("sin experiencia pero con ganas", 4, "buscan esclavo digital sin presupuesto"),
    ("jornada intensiva los viernes", 3, "te descuentan el día y encima rendís más"),
    ("vestimenta informal / sin corbata", 1, "zafan de darte el sueldo formal"),
    ("crecemos rápido / startup", 3, "te van a explotar hasta que quiebre o te quemen"),
    ("horario flexible", 4, "trabajás cuando ellos quieran, no cuando vos quieras"),
    ("persona proactiva", 3, "vas a hacer cosas que nadie quiere hacer y no están en el rol"),
    ("ambiente joven / divertido", 2, "son excusa para pagar menos porque 'no es un trabajo formal'"),
    ("remuneración variable / bonos", 4, "variable = si el dueño tuvo buen finde, cobrás"),
    ("pasión por lo que hacemos", 2, "te van a pedir que labures gratis por 'vocación'"),
]

SCOREBOARD = {
    1: "verde — nada grave, pero no te duermas",
    2: "amarillo — hay olor a explotación",
    3: "naranja — corrés riesgo de que te negreen",
    4: "rojo — huí de ahí",
    5: "rojo oscuro — ya te están debiendo el aguinaldo",
    6: "negro — ni te postules, quemá la empresa",
}


def run(ctx: dict | None = None) -> str:
    """Analizá un texto de búsqueda laboral y devolvé alertas de red flags con humor y conciencia de clase."""
    text = (ctx or {}).get("text", "")
    if not text:
        return "Pasá un texto con `text` en el context, mostro."

    text_lower = text.lower()
    found = []
    score = 0

    for phrase, weight, punch in RED_FLAGS:
        if phrase.lower() in text_lower:
            found.append(f"  [{weight}] _{phrase}_ → {punch}")
            score += weight

    if not found:
        return "No encontré red flags. Raro. O es una cooperativa posta o están escondiendo bien la miseria."

    n = min(score, 6)
    verdict = SCOREBOARD.get(n, SCOREBOARD[6])
    severity_icon = {1: "🟢", 2: "🟡", 3: "🟠", 4: "🔴", 5: "⛔", 6: "🖤"}.get(n, "🟢")

    result = [
        f"{severity_icon} **Alerta de plusvalía** — puntaje: {score}",
        "",
        *found,
        "",
        f"→ {verdict}",
    ]

    if score >= 4:
        result.append("")
        result.append("💡 Consejo de clase: si te llaman, pedí el sueldo en dólares y por adelantado.")

    return "\n".join(result)
