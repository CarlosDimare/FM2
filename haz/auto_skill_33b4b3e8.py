import re

# Canasta Basica Alimentaria INDEC - valores estimados 2026 por adulto/mes
CBA_VALUES = {
    "alimentos": 280000,
    "transporte": 65000,
    "alquiler (monoambiente)": 300000,
    "servicios (luz, gas, agua)": 55000,
    "expensas": 70000,
    "comunicacion (internet, celu)": 35000,
    "salud (medicamentos, prepaga)": 85000,
    "educacion": 45000,
    "indumentaria": 40000,
    "esparcimiento": 30000,
}

# Canasta Basica Total (alimentos + no alimentos)
CBT_ESTIMADA = sum(CBA_VALUES.values())

CIUDADES = {
    "caba|capital|bs as|buenos aires": ("CABA", 1.0),
    "cordoba|cba": ("Cordoba", 0.88),
    "rosario": ("Rosario", 0.92),
    "mendoza": ("Mendoza", 0.85),
    "la plata": ("La Plata", 0.90),
    "tucuman": ("Tucuman", 0.78),
    "mar del plata|mdp": ("Mar del Plata", 0.82),
    "salta": ("Salta", 0.75),
    "neuquen": ("Neuquen", 1.05),
    "ushuaia|rio grande": ("Patagonia sur", 1.25),
    "bariloche": ("Bariloche", 1.15),
}

FRASES = [
    (r"(?i)gan[o a].*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "sueldo"),
    (r"(?i)cobr[o a].*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "sueldo"),
    (r"(?i)sueldo.*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "sueldo"),
    (r"(?i)salario.*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "sueldo"),
    (r"(?i)(?:sale|cuesta|precio|vale).*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "precio"),
    (r"(?i)\$.*?(\d[\d.,]*(?:\.\d+)?)\s*(mil|k|lucas|palos|m|pesos)?", "precio"),
]

MULT = {"mil": 1000, "k": 1000, "lucas": 1000, "palos": 1000000, "m": 1000000, "pesos": 1}


def _extraer(text: str, tag: str) -> int | None:
    for pattern, t in FRASES:
        if t != tag:
            continue
        m = re.search(pattern, text)
        if m:
            raw = m.group(1).replace(".", "").replace(",", "")
            try:
                v = float(raw)
            except ValueError:
                continue
            mult_str = m.group(2)
            mult = MULT.get(mult_str.lower()) if mult_str else 1
            val = int(v * mult)
            if tag == "sueldo" and 100000 <= val <= 50000000:
                return val
            if tag == "precio" and 100 <= val <= 50000000:
                return val
    return None


def _detectar_ciudad(text: str) -> tuple[str, float]:
    lower = text.lower()
    for pattern, (name, factor) in CIUDADES.items():
        if re.search(pattern, lower):
            return name, factor
    return "Argentina promedio", 1.0


def run(ctx: dict | None = None) -> str:
    """Calcula poder adquisitivo real: cuantas canastas basicas compra tu sueldo."""
    text = (ctx or {}).get("text", "")
    if not text:
        return "Pasa un texto con un sueldo y opcionalmente un precio o ciudad. Ej: 'gano 400 lucas en cordoba'."

    sueldo = _extraer(text, "sueldo")
    if not sueldo:
        return "No encontre un sueldo claro en el texto. Pone algo como 'gano 400 lucas'."

    ciudad, factor = _detectar_ciudad(text)
    precio = _extraer(text, "precio")

    canasta_total = CBT_ESTIMADA
    canasta_ajustada = int(canasta_total * factor)

    resultado = [
        f"[ Poder Adquisitivo Real ]",
        f"  Ubicacion detectada: {ciudad} (factor de costo: {factor})",
        f"  Sueldo: ${sueldo:,}/mes",
        f"  Canasta basica estimada ({ciudad}): ${canasta_ajustada:,}",
        f"",
    ]

    canastas = sueldo / canasta_ajustada
    resultado.append(f"  -> Con tu sueldo compras {canastas:.1f} canastas basicas")

    if canastas < 1:
        resultado.append(f"  -> No llegas ni a una canasta. Bienvenido a la clase baja.")
    elif canastas < 2:
        resultado.append(f"  -> Llegas justo. Clase media golpeada pero viva.")
    elif canastas < 4:
        resultado.append(f"  -> Te sobra un poco. Podes comprar algo de ropa si no llueve.")
    elif canastas < 7:
        resultado.append(f"  -> Vivis bien. No te alcanza para ahorrar en serio, pero no pasar hambre.")
    else:
        resultado.append(f"  -> Estas en el 5% mas alto. Ojala la AFIP no se entere.")

    if precio:
        unidades = sueldo / precio
        resultado.append(f"")
        resultado.append(f"  Precio detectado: ${precio:,}")
        resultado.append(f"  -> Con tu sueldo compras {unidades:.0f} unidades de eso")

    resultado.append(f"")
    resultado.append(f"  Canasta Basica Total (CBT) nacional: ${canasta_total:,}")
    resultado.append(f"  {ciudad} (ajustada): ${canasta_ajustada:,}")
    resultado.append(f"")
    resultado.append(f"  Desglose CBT mensual estimado:")
    for item, val in CBA_VALUES.items():
        resultado.append(f"    - {item}: ${val:,}")

    ahorro_mensual = sueldo - canasta_ajustada
    resultado.append(f"")
    resultado.append(f"  Despues de la canasta te quedan: ${ahorro_mensual:,}")
    if ahorro_mensual < 0:
        resultado.append(f"  -> Estas en negativo. Bienvenido a la Argentina.")
    elif ahorro_mensual < sueldo * 0.1:
        resultado.append(f"  -> Ahorro: menos del 10%. Un imprevisto y estas fundido.")
    elif ahorro_mensual < sueldo * 0.3:
        resultado.append(f"  -> Ahorro: entre 10 y 30%. Vas tirando.")
    else:
        resultado.append(f"  -> Ahorro: mas del 30%. O sos muy joven o heredaste.")

    resultado.append(f"")
    resultado.append(f"Tip de clase: el poder adquisitivo no es cuanta plata tenes,")
    resultado.append(f"sino cuanta vida podes comprar con ella. Y la vida esta cara.")

    return "\n".join(resultado)
