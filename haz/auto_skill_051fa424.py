import re

DERECHOS = {
    "aguinaldo": {
        "porcentaje": 8.33,
        "desc": "Aguinaldo (medio sueldo extra al ano)",
    },
    "vacaciones": {
        "porcentaje": 4.17,
        "desc": "Vacaciones pagas (15 dias habiles)",
    },
    "obra_social": {
        "porcentaje": 9.0,
        "desc": "Obra social (aportes patronal + personal)",
    },
    "jubilacion": {
        "porcentaje": 17.0,
        "desc": "Aportes jubilatorios (11% personal + 16% patronal / 12% personal)",
    },
    "art": {
        "porcentaje": 4.0,
        "desc": "ART (seguro contra accidentes laborales)",
    },
    "licencias": {
        "porcentaje": 2.0,
        "desc": "Licencias (enfermedad, maternidad, paternidad)",
    },
    "indemnizacion": {
        "porcentaje": 2.78,
        "desc": "Indemnizacion por despido (aprox 1 mes por ano)",
    },
}

TOTAL_PRESTACIONES = sum(v["porcentaje"] for v in DERECHOS.values())

INDICIOS_INFORMALIDAD = [
    (r"monotribut", "Monotributista (facturas, no relacion de dependencia)"),
    (r"factur[oa]", "Facturas en vez de recibo de sueldo"),
    (r"por\s*cuenta\s*propi|independient|freelanc", "Trabajador independiente / freelance"),
    (r"en\s*negro|no\s*estoy\s*registrad|sin\s*aport|sin\s*recibo|en\s*blanco.*no", "Trabajo en negro (sin registro)"),
    (r"pasanti|pasant", "Pasantia (no es relacion de dependencia plena)"),
    (r"temporari|por\s*proyecto|por\s*hora", "Trabajo temporal o por proyecto"),
    (r"no\s*tengo\s*obra\s*social|no\s*tengo\s*vacacion|sin\s*vacacion", "Sin obra social ni vacaciones pagas"),
    (r"cobro\s*por\s*debajo|menos\s*de\s*.*\s*hora", "Salario bajo / por debajo del convenio"),
    (r"app\s*.*\s*repart|delivery|rapp.i|pedidos.ya|uber", "Trabajo en plataforma digital (falsa autonomia)"),
]


def run(ctx):
    text = ctx.get("text", "")
    if not text:
        lines = [
            "[ Calculadora de Precarizacion ]",
            "",
            "  Decime como laburas y te calculo",
            "  cuanta plata perdes por no estar en blanco.",
            "",
            "  Ej: 'gano 500 lucas como monotributista'",
            "  Ej: 'cobro 800 mil facturando, sin vacaciones'",
        ]
        return "\n".join(lines)

    t = text.lower()
    sueldo = _extraer_sueldo(t)
    indicios = _detectar_indicios(t)

    lines = ["[ Calculadora de Precarizacion ]"]
    lines.append("")

    if not indicios:
        lines.append("  No detecte indicios claros de informalidad.")
        lines.append("  Si estas en relacion de dependencia en blanco, bien ahi.")
        lines.append("  Si no estas seguro, conta un poco mas.")
        lines.append("")
        lines.append("  P.D.: Si estas en blanco, los descuentos que ves en tu recibo")
        lines.append("  no son plata que 'pierdas' -- son derechos que estan cubiertos.")
        return "\n".join(lines)

    lines.append("  Indicios de precarizacion detectados:")
    for _, desc in indicios:
        lines.append(f"    - {desc}")
    lines.append("")

    if sueldo:
        valor_anual = sueldo * 12
        valor_prestaciones = valor_anual * TOTAL_PRESTACIONES / 100
        valor_mensual_prestaciones = valor_prestaciones / 12
        sueldo_equivalente = sueldo + valor_mensual_prestaciones
        dif_porcentual = (sueldo_equivalente - sueldo) / sueldo * 100

        lines.append(f"  Tu sueldo declarado:     ${sueldo:,.0f}/mes")
        lines.append(f"  Valor anual:             ${valor_anual:,.0f}")
        lines.append("")
        lines.append("  Derechos que no tenes (y su valor estimado):")
        for key, info in DERECHOS.items():
            val = valor_anual * info["porcentaje"] / 100
            lines.append(f"    {info['desc']:45s}  ${val:>8,.0f}/ano  ({info['porcentaje']}%)")
        lines.append("")
        lines.append(f"  Total prestaciones perdidas: ${valor_prestaciones:,.0f}/ano")
        lines.append(f"  Eso son ${valor_mensual_prestaciones:,.0f}/mes adicionales")
        lines.append(f"")
        lines.append(f"  Sueldo equivalente en blanco: ${sueldo_equivalente:,.0f}/mes")
        lines.append(f"  Diferencia: +{dif_porcentual:.0f}%")
        lines.append("")
        if sueldo_equivalente / sueldo > 1.4:
            lines.append("  Estas perdiendo mas del 40% de tu compensacion real.")
            lines.append("  No es 'menos descuentos' -- es 'menos derechos'.")
        elif sueldo_equivalente / sueldo > 1.2:
            lines.append("  Perdes entre 20% y 40% de tu compensacion real.")
            lines.append("  Eso es obra social, vacaciones, aguinaldo.")
        else:
            lines.append("  Perdes menos del 20%. Igual son derechos que no tenes.")
        lines.append("")
        lines.append("  Tip: la plata que 'ahoras' al no estar en blanco")
        lines.append("  la pagas despues en salud, juicios, y vejez.")
        lines.append("  Precarizacion no es un beneficio. Es un riesgo.")
    else:
        lines.append("  No pude identificar tu sueldo en el texto.")
        lines.append("  Pone cuanto ganas para calcular el costo real.")
        lines.append("")
        lines.append("  Tip: si no sabes cuanto 'ganas' porque no es fijo,")
        lines.append("  ese es otro indicio de precarizacion.")

    return "\n".join(lines)


def _extraer_sueldo(t: str):
    patterns = [
        r"(\d[\d.,]*)\s*(?:lucas|mil|palos?|millones?|k)\s*(?:bruto|neto)?",
        r"(?:sueldo|salario|gano|cobro)\s*(?:de\s*)?\$?\s*([\d.,]+)",
        r"\$?\s*([\d.,]+)\s*(?:lucas|mil|palos?|millones?)",
    ]
    tiene_palos = "palos" in t or "palo " in t
    tiene_millones = "millones" in t or "millon " in t
    tiene_lucas = "lucas" in t
    tiene_k = "k " in t or " k" in t

    for pat in patterns:
        m = re.search(pat, t)
        if m:
            raw = m.group(1)
            tiene_punto = "." in raw
            s = raw.replace(".", "").replace(",", "")
            if tiene_punto and s.isdigit():
                raw_float = float(raw.replace(",", "."))
                if tiene_palos or tiene_millones:
                    val = int(raw_float * 1000000)
                elif tiene_lucas or tiene_k:
                    val = int(raw_float * 1000)
                else:
                    val = int(raw_float)
                if val < 10000:
                    val *= 1000
                return val
            if s.isdigit():
                val = int(s)
                if tiene_palos or tiene_millones:
                    val *= 1000000
                elif tiene_lucas or tiene_k:
                    val *= 1000
                if val < 10000:
                    val *= 1000
                return val
    return None


def _detectar_indicios(t: str):
    resultados = []
    for pat, desc in INDICIOS_INFORMALIDAD:
        if re.search(pat, t):
            resultados.append((pat, desc))
    return resultados
