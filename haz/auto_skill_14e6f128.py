import re

CATALOGO = {
    "netflix": {
        "precio": 9999,
        "series": ["stranger things", "the crown", "black mirror", "bridgerton",
                   "casa de papel", "squid game", "arcane", "sandman", "dahmer",
                   "baby reindeer", "griselda", "the diplomat", "3 body problem"],
    },
    "disney": {
        "precio": 5999,
        "series": ["mufasa", "the bear", "shogun", "bluey", "andor", "skeleton crew",
                   "percy jackson", "marvel", "star wars", "x-men"],
    },
    "max": {
        "precio": 6999,
        "series": ["house of the dragon", "the last of us", "succession", "euphoria",
                   "the white lotus", "the penguin", "dune prophecy"],
    },
    "prime": {
        "precio": 5999,
        "series": ["the boys", "fallout", "reacher", "rings of power", "fleabag",
                   "invincible", "hazbin hotel"],
    },
    "apple": {
        "precio": 3999,
        "series": ["ted lasso", "severance", "slow horses", "silo", "for all mankind",
                   "shrinking", "presumed innocent"],
    },
}

PLANES = {"basico con ads": 1, "estandar": 1.5, "premium": 2}


def run(ctx):
    text = ctx.get("text", "")
    if not text:
        lines = [
            "[ Rotador de Streaming ]",
            "",
            "  Pegame lo que quieras ver y te calculo",
            "  cuantas plataformas comprar para no ver nada.",
            "",
            "  Ej: 'quiero ver the bear y succession'",
        ]
        return "\n".join(lines)

    t = text.lower()
    detectadas = {}
    for plat, info in CATALOGO.items():
        matches = [s for s in info["series"] if s in t]
        if matches:
            detectadas[plat] = matches

    if not detectadas:
        return "Nada de lo que mencionaste esta en mi base. O ves cosas muy de nicho o sos Mr. Cable."

    plan = _detectar_plan(t)

    total_mes = sum(int(info["precio"] * PLANES.get(plan, 1)) for plat, info in CATALOGO.items() if plat in detectadas)
    n = len(detectadas)
    meses_rotacion = max(1, n)
    rotado = int(total_mes / meses_rotacion) if meses_rotacion > 1 else total_mes

    lines = ["[ Rotador de Streaming ]"]
    lines.append("")
    for plat in sorted(detectadas):
        precio = int(CATALOGO[plat]["precio"] * PLANES.get(plan, 1))
        lines.append(f"  {plat.upper():8s} ${precio:>5,}/mes  -> {', '.join(detectadas[plat])}")
    lines.append("")
    lines.append(f"  Plan detectado: {plan if plan else 'estandar (default)'}")
    lines.append(f"  Todo junto: ${total_mes:,}/mes ({n} plataformas)")
    if n > 1:
        lines.append(f"  Rotando {n} meses: ${rotado:,}/mes (ahorras ${total_mes - rotado:,})")
    lines.append("")
    lines.append(f"  -> Alternativa $0/mes y sin DRM:")
    lines.append("     piratear, prestar cuentas, o pedirle el password a tu ex.")

    return "\n".join(lines)


def _detectar_plan(t: str) -> str:
    for plan in PLANES:
        if plan in t:
            return plan
    return ""
