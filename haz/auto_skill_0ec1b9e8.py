import re

ALIQUOTAS = [
    (0, 0.0),
    (173333, 0.0),
    (200000, 0.0),
    (280000, 0.0),
    (350000, 0.0),
    (600000, 0.0),
]

GANANCIAS_ESCALAS = [
    (26000000, 0.0, 0),
    (30000000, 0.09, 0),
    (35000000, 0.15, 360000),
    (42000000, 0.19, 1110000),
    (50000000, 0.23, 2440000),
    (60000000, 0.27, 4280000),
    (999999999, 0.31, 6980000),
]

APORTES = {
    "jubilacion": 0.11,
    "pami": 0.03,
    "obra_social": 0.03,
}

JUBILACION_MINIMA = 279121


def _extraer_salario(text: str) -> int | None:
    patrones = [
        r"(?i)bruto.*?(\d[\d.,]*)\s*(mil|k|lucas|palos|m)?",
        r"(?i)neto.*?(\d[\d.,]*)\s*(mil|k|lucas|palos|m)?",
        r"(?i)sueldo.*?(\d[\d.,]*)\s*(mil|k|lucas|palos|m)?",
        r"(?i)salario.*?(\d[\d.,]*)\s*(mil|k|lucas|palos|m)?",
        r"(?i)cobro.*?(\d[\d.,]*)\s*(mil|k|lucas|palos|m)?",
        r"(?i)\$?\s*(\d[\d.,]*)\s*(mil|k|lucas|palos|m)",
    ]
    mults = {"mil": 1000, "k": 1000, "lucas": 1000, "palos": 1000000, "m": 1000000}
    for pattern in patrones:
        m = re.search(pattern, text)
        if m:
            raw = m.group(1).replace(".", "").replace(",", "")
            try:
                v = float(raw)
            except ValueError:
                continue
            mult_str = m.group(2)
            mult = mults.get(mult_str.lower()) if mult_str else 1
            val = int(v * mult)
            if 100000 <= val <= 50000000:
                return val
    return None


def _calcular_ganancias(bruto_anual: int) -> int:
    ganancia_neta = bruto_anual
    impuesto = 0
    for i, (tope, alicuota, fijo) in enumerate(GANANCIAS_ESCALAS):
        if ganancia_neta <= tope:
            if alicuota == 0:
                return 0
            base_anterior = GANANCIAS_ESCALAS[i - 1][0] if i > 0 else 0
            return int(fijo + (ganancia_neta - base_anterior) * alicuota)
    return impuesto


def run(ctx: dict | None = None) -> str:
    """Calcula sueldo neto en relacion de dependencia a partir del bruto."""
    text = (ctx or {}).get("text", "")
    if not text:
        return "Pasa un texto con un sueldo, ej: 'cobro 800 lucas bruto' o 'gano 1.2 palos'."

    sueldo = _extraer_salario(text)
    if not sueldo:
        return "No encontre un sueldo claro. Pone algo como 'gano 800 mil bruto'."

    es_bruto = bool(re.search(r"(?i)bruto", text))
    es_neto = bool(re.search(r"(?i)neto", text))

    if es_neto and not es_bruto:
        bruto = sueldo
        for k, v in APORTES.items():
            bruto = int(bruto / (1 - v))
        bruto = int(bruto / (1 - 0.17))
        bruto_anual = bruto * 13
        ganancias = _calcular_ganancias(bruto_anual)
        ganancias_mensual = ganancias // 12
        descuentos = int(bruto * sum(APORTES.values()))
        neto = bruto - descuentos - ganancias_mensual
        modo = "neto a bruto"
    else:
        bruto = sueldo
        descuentos = int(bruto * sum(APORTES.values()))
        bruto_anual = bruto * 13
        ganancias = _calcular_ganancias(bruto_anual)
        ganancias_mensual = ganancias // 12
        neto = bruto - descuentos - ganancias_mensual
        modo = "bruto a neto"

    resultado = [
        f"[ Liquidacion de Sueldo ]",
        f"  Modo: {modo}",
        f"",
        f"  Sueldo bruto mensual:  ${bruto:,}",
        f"  Sueldo bruto anual:    ${bruto_anual:,}",
        f"",
        f"  Descuentos:",
        f"    Jubilacion (11%):    ${int(bruto * 0.11):,}",
        f"    PAMI (3%):           ${int(bruto * 0.03):,}",
        f"    Obra Social (3%):    ${int(bruto * 0.03):,}",
        f"    Ganancias mensual:   ${ganancias_mensual:,}",
        f"",
        f"  Total descuentos:      ${descuentos + ganancias_mensual:,}",
        f"  Sueldo neto mensual:   ${neto:,}",
        f"",
    ]

    proporcion = neto / bruto * 100 if bruto else 0
    resultado.append(f"  Porcentaje neto/bruto: {proporcion:.1f}%")
    resultado.append(f"")

    if neto < JUBILACION_MINIMA:
        resultado.append(f"  Tu neto esta por debajo de la jubilacion minima (${JUBILACION_MINIMA:,}).")
        resultado.append(f"  Estas en el horno.")
    elif neto < JUBILACION_MINIMA * 2:
        resultado.append(f"  Llegas justo. Clase media baja. No te enfermes.")
    elif neto < JUBILACION_MINIMA * 4:
        resultado.append(f"  Clase media tirando. Podes ahorrar si no comes afuera.")
    elif neto < JUBILACION_MINIMA * 7:
        resultado.append(f"  Vivis bien. Tus amigos piensan que la estas llevando.")
    else:
        resultado.append(f"  Estas en el 10% mas alto. No lo cuentes en el subte.")

    resultado.append(f"")
    resultado.append(f"  Tip: si tu sueldo esta mal registrado, estos numeros no existen.")
    resultado.append(f"  La AFIP no lee esto. O si?") 

    return "\n".join(resultado)
