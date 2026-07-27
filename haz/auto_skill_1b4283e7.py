import re
import math

BINGOS = [
    (r"sinergi[ae]", "sinergia", 3, "juntaron dos palabras y creen que es estrategia"),
    (r"empoder(a|miento)", "empoderamiento", 4, "te van a dar responsabilidad sin presupuesto"),
    (r"think outside the box", "pensar fuera de la caja", 5, "ahi no hay caja, lo que no hay es presupuesto"),
    (r"pensamiento disruptivo", "disrupcion", 4, "rompiste la caja, felicitaciones, ahora pagala"),
    (r"solucion 360", "360", 3, "dar la vuelta completa para terminar en el mismo lugar"),
    (r"hoja de ruta|roadmap", "roadmap", 2, "dibujaron flechitas en un pizarron"),
    (r"sin cargo\s*(?:adicional|extra)?", "sin cargo", 1, "no, si el cargo esta incluido en tu alma"),
    (r"crear valor|generar valor|value", "valor", 4, "valor para el accionista, no para vos"),
    (r"visibilizar|visibilizaci.n", "visibilizar", 2, "lo visibilizaron, pero no lo resolvieron"),
    (r"(?:pmo|project management office)", "PMO", 5, "3 reuniones para decidir el color del post-it"),
    (r"alinear expectativas", "alinear", 4, "bajarte el sueldo con psicoanalisis"),
    (r"sinergizar|sinergizar", "sinergizar", 5, "inventaron un verbo para justificar una reunion al pedo"),
    (r"workshop|taller intensivo", "workshop", 3, "te sacaron 4 horas de laburo para jugar con post-its"),
    (r"staff augmentation", "staff aug", 4, "tercerizacion con nombre en ingles"),
    (r"pivota(r|miento)", "pivotear", 5, "el proyecto fracaso, pero suena a innovacion"),
    (r"open (space|door|mind)", "open algo", 2, "oficina sin paredes ni privacidad ni dignidad"),
    (r"up skilling|reskilling", "reskilling", 4, "aprendete esto en tu tiempo libre o te rajo"),
    (r"cultura de la colaboraci.n", "colaboracion", 3, "hace el laburo de 3 personas y encima sonrie"),
    (r"engagement", "engagement", 3, "te miden el entusiasmo como si fuera un KPI"),
    (r"meeting as.ncrono", "asincronico", 5, "te mandan un video de 45 minutos que podria ser un mail"),
    (r"low hanging fruit", "fruta madura", 4, "lo facil ya se lo robo otro, te queda lo imposible"),
    (r"core business", "core", 2, "lo unico que importa, vos no"),
    (r"agil|scrum|sprint", "agil", 3, "reuniones para planificar reuniones"),
    (r"transformaci.n digital", "transformacion digital", 5, "compraron Slack y despidieron al de sistemas"),
    (r"inteligencia artificial|IA|AI", "IA", 4, "la maquina te va a reemplazar, pero con entusiasmo"),
    (r"mindset|mentalidad", "mindset", 3, "pensamiento positivo para que no pidas aumento"),
    (r"dormant user", "usuario dormido", 2, "el que no usa el producto, pero van a culpar al dev"),
    (r"lean (startup|manufacturing)", "lean", 3, "hace mas con menos, que para eso te pagamos"),
    (r"happy path|feliz", "happy path", 3, "el unico camino que no existe en produccion"),
    (r"trade off", "trade off", 2, "sacrificamos calidad por velocidad, como siempre"),
]


def run(ctx: dict | None = None) -> str:
    """Detecta y puntua el nivel de humo corporativo en un texto. Pasa 'text' en ctx."""
    text = (ctx or {}).get("text", "")
    if not text:
        return "Pasa un texto con `text` en el context, mostro."

    lower = text.lower()
    hits = []
    total = 0

    for pattern, alias, weight, punch in BINGOS:
        if re.search(pattern, lower):
            hits.append((alias, weight, punch))
            total += weight

    if not hits:
        return (
            "No detecte humo corporativo. Sos inimputable, hermano.\n"
            "O sos un robot escribiendo codigo sin pasar por RRHH."
        )

    nivel = int(math.log(total + 1) * 10)

    lineas = [f"[ Humo Corporativo Detector ]  Puntaje: {total}  Nivel de riesgo: {nivel}/100"]
    lineas.append("")

    for alias, weight, punch in hits:
        bar = "#" * weight + "." * (6 - weight)
        lineas.append(f"  {bar}  {alias} ({weight} pts)")

    lineas.append("")
    lineas.append("Chistes encontrados:")

    for _, _, punch in hits:
        lineas.append(f"  - {punch}")

    lineas.append("")

    if total >= 20:
        lineas.append("Diagnostico: Empresa fundada en 2022 con funding de series A.")
    elif total >= 12:
        lineas.append("Diagnostico: Consultora que se autopercibe startup.")
    elif total >= 6:
        lineas.append("Diagnostico: RH copio el speech de una TEDx.")
    else:
        lineas.append("Diagnostico: Todavia no contrataron Community Manager.")

    lineas.append("")
    lineas.append("Recomendacion: si te pagan en humo, pedi factura C.")

    return "\n".join(lineas)
