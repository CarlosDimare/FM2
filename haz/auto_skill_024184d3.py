import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone tu salario y ciudad. Ej: '$800000 CABA' o '2M Cordoba' o 'USD1500 Rosario'."

    cbt_data = {
        "caba": 1_200_000, "bsas": 1_100_000, "la plata": 1_050_000,
        "cordoba": 1_000_000, "rosario": 1_050_000, "mendoza": 950_000,
        "tucuman": 900_000, "salta": 880_000, "santa fe": 950_000,
        "corrientes": 850_000, "neuquen": 1_150_000, "ushuaia": 1_400_000,
        "mar del plata": 1_000_000, "default": 1_000_000,
    }

    city = "default"
    for key in cbt_data:
        if key.lower() in t.lower():
            city = key.lower()
            break

    cbt = cbt_data[city]

    m = re.search(r"(?:\$|usd|u\$s)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|usd|dolares|\$)?", t, re.IGNORECASE)
    if not m:
        return "CBT para {}: $ {:,.0f}/mes".format(city.upper(), cbt)

    val = float(m.group(1).replace(",", ""))
    suffix = (m.group(2) or "").lower().strip()

    usd_mode = "usd" in t.lower() or "dolares" in t.lower()
    val_ars = val * 1400 if usd_mode else val * (1_000 if suffix in ("k", "mil") else 1_000_000 if suffix in ("m", "millones", "millon") else 1)

    ratio = val_ars / cbt

    lines = [
        "=== CANASTA BASICA ({}) ===".format(city.upper()),
        "CBT: $ {:,.0f}/mes (familia INDEC 2 adultos + 2 hijos)".format(cbt),
        "Salario: $ {:,.0f}/mes".format(val_ars),
        "Relacion: {:.2f}x la CBT".format(ratio),
        "",
    ]

    if ratio < 1:
        deficit = cbt - val_ars
        lines += [
            "Faltan $ {:,.0f} para cubrir lo basico ({:.0f}% deficit).".format(deficit, deficit / cbt * 100),
            "Segun INDEC sos pobre (no segun el gobierno, obvio).",
        ]
    elif ratio < 1.5:
        lines += [
            "Cubris la CBT pero no llegas a la canasta ampliada.",
            "Un impuesto inesperado y quedas abajo. Clase media al borde.",
        ]
    elif ratio < 3:
        lines += [
            "Vivis sin pasar hambre pero sin ahorrar.",
            "$ {:,.0f}/mes despues de lo basico. Alcanza hasta que se dispare el dolar.".format(val_ars - cbt),
        ]
    else:
        lines += [
            "Estas en el 10% que gana bien.",
            "$ {:,.0f}/mes de sobra sobre la CBT. Privilegiado, aprovecha.".format(val_ars - cbt),
        ]

    return "\n".join(lines)
