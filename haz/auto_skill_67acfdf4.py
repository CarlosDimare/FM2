import re

TIERS = [
    ("canilla libre", 1, "te alcanza para un cafe y sobra"),
    ("clase media golpeada", 2, "llegas justo, pero sin ahorrar"),
    ("tarjeta de credito temblando", 3, "vas a vivir pensando en el resumen"),
    ("che, re caro", 4, "te duele hasta el alma"),
    ("sangria", 5, "te tiene que gustar mucho o ser muy pelotudo"),
    ("abuso directo", 6, "hay que ser hijo de puta para poner ese precio"),
]

ARTICULOS = [
    (r"(?:\b|un\s*|una\s*)(?:cafe| cafecito| cafe)", 600, "un cafe"),
    (r"(?:docena|doc|12)\s*de\s*facturas", 3500, "una docena de facturas"),
    (r"(?:libro|lectura)", 15000, "un libro"),
    (r"(?:remera|camiseta)", 25000, "una remera"),
    (r"(?:zapatilla|zapato)", 80000, "unas zapatillas"),
    (r"(?:celular|telefono|telefono|smartphone)", 600000, "un celular"),
    (r"(?:alquiler|departamento|depto)", 350000, "un alquiler"),
    (r"(?:comida|delivery|pedido\s*ya|rapp)i", 8000, "un delivery"),
    (r"(?:entrada\s*.*show|recital|concierto)", 35000, "una entrada"),
    (r"(?:monitor|televisor|tv|pantalla)", 400000, "un monitor"),
    (r"(?:curso|carrera|facultad|universidad)", 150000, "un cuatrimestre"),
    (r"(?:nafta|combustible|\d+l\s*de\s*nafta)", 12000, "un tanque de nafta"),
    (r"(?:sushi|japonesa|japones)", 12000, "unos panchos japoneses"),
    (r"(?:birra|cerveza|cerve)", 2500, "una cerveza"),
    (r"(?:vino|vinacho)", 8000, "un vino"),
    (r"(?:obra\s*teatro|teatro|teatral)", 15000, "una entrada al teatro"),
    (r"(?:remis|taxi|uber|did[ii])", 5000, "un viaje en uber"),
]

PLAZOS = [
    ("dia", 8, "un dia"),
    ("semana", 40, "una semana"),
    ("quincena", 80, "una quincena"),
    ("mes", 160, "un mes"),
    ("ano", 1920, "un ano"),
]


MULTIPLIERS = {
    "mil": 1_000, "k": 1_000, "lucas": 1_000, "palos": 1_000_000, "m": 1_000_000,
}


def _parsear_precio(text: str) -> int | None:
    """Extrae el precio (cercano a palabras como 'sale', 'cuesta', '$')."""
    # busca numeros con o sin simbolo $
    m = re.search(r"(?:sale|cuesta|precio|de|por|\$)\s*\$?\s*(\d{1,3}(?:\.\d{3})*)\s*(mil|k|lucas|palos|m)?", text.lower())
    if not m:
        return None
    v = float(m.group(1).replace(".", ""))
    mult = MULTIPLIERS.get(m.group(2), 1)
    return int(v * mult)


def _parsear_salario(text: str, default: int = 600_000) -> int:
    """Extrae el salario (cercano a palabras como 'gano', 'cobro', 'sueldo', 'salario')."""
    m = re.search(r"(?:gano|cobro|sueldo|salario|ganas|cobra)\s*(?:de\s*)?\$?\s*(\d{1,3}(?:\.\d{3})*)\s*(mil|k|lucas|palos|m)?", text.lower())
    if not m:
        return default
    v = float(m.group(1).replace(".", ""))
    mult = MULTIPLIERS.get(m.group(2), 1)
    return int(v * mult) if 100_000 <= v * mult <= 50_000_000 else default


def _asignar_tier(horas: float) -> tuple[int, str]:
    for _, threshold, desc in TIERS:
        if horas <= threshold:
            return threshold, desc
    return TIERS[-1][1], TIERS[-1][2]


def run(ctx: dict | None = None) -> str:
    """Convierte cualquier precio a horas de laburo. Pasa 'text' con un precio y opcionalmente un salario."""
    text = (ctx or {}).get("text", "")
    if not text:
        return "Pasa un texto con un precio, ej: 'este celular sale 600 lucas y gano 400'."

    salario = _parsear_salario(text)
    valor_hora = salario / 160

    precio = _parsear_precio(text)
    if not precio:
        return f"Ganas ~${salario:,}/mes (${valor_hora:,.0f}/hora). No encontre un precio claro en el texto."

    horas = precio / valor_hora
    item = "eso"

    for pattern, _, name in ARTICULOS:
        if re.search(pattern, text.lower()):
            item = name
            break

    lineas = [
        f"[{item}] sale ${precio:,.0f}",
        f"  Con sueldo de ${salario:,}/mes (${valor_hora:,.0f}/hora):",
        f"  -> Te cuesta {horas:.1f} horas de laburo",
        "",
    ]

    for label, h, nombre in PLAZOS:
        if h < horas:
            proporcion = horas / h
            lineas.append(f"  - Eso es {proporcion:.1f} {nombre}(s) de laburo")

    _, tier_desc = _asignar_tier(horas)
    lineas.append("")
    lineas.append(f"[{tier_desc}]")
    lineas.append("")
    lineas.append("Tip de clase: si te parece caro, no es que el producto este sobrevaluado.")
    lineas.append("Es que tu sueldo esta infrahumanamente por debajo del valor real de tu trabajo.")

    return "\n".join(lineas)
