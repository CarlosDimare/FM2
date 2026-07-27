import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_ars pais_destino [familiares]\n"
            "Compara tu poder adquisitivo en Argentina vs otro pais.\n"
            "Muestra el salario equivalente en USD/EUR para mantener\n"
            "el mismo nivel de vida.\n"
            "Paises: usa, espana, chile, uruguay, brasil, alemania,\n"
            "reino_unido, canada, australia, italia, francia\n"
            "Ej: 2500000 espana\n"
            "Ej: 1500000 chile 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: faltan parametros (salario pais [familiares])."

    def parse_num(s):
        s = s.upper()
        mult = 1
        if "K" in s:
            mult = 1000
            s = s.replace("K", "")
        elif "M" in s:
            mult = 1_000_000
            s = s.replace("M", "")
        return float(s) * mult

    try:
        salary = parse_num(parts[0])
    except ValueError:
        return "Error: no se pudo parsear el salario."

    pais = parts[1].lower()
    familia = 1
    if len(parts) >= 3:
        try:
            familia = int(float(parts[2]))
        except ValueError:
            pass

    factores = {
        "usa": (1.8, "USD"),
        "espana": (1.3, "EUR"),
        "chile": (1.1, "USD"),
        "uruguay": (1.2, "USD"),
        "brasil": (0.9, "USD"),
        "alemania": (1.5, "EUR"),
        "reino_unido": (1.6, "GBP"),
        "canada": (1.7, "USD"),
        "australia": (1.8, "USD"),
        "italia": (1.3, "EUR"),
        "francia": (1.5, "EUR"),
        "mexico": (0.8, "USD"),
        "colombia": (0.7, "USD"),
        "peru": (0.6, "USD"),
        "paraguay": (0.5, "USD"),
        "bolivia": (0.4, "USD"),
    }

    if pais not in factores:
        return f"Error: pais '{pais}' no reconocido. Opciones: {', '.join(sorted(factores.keys()))}."

    factor, moneda = factores[pais]

    for_family = 1 + (familia - 1) * 0.4
    blue = 1400
    salary_usd = salary / blue
    salary_equivalente = salary_usd * factor * for_family

    salary_ars_equivalente = salary_equivalente * blue

    tc_extraoficial = {
        "usa": 1.0,
        "espana": 1.08,
        "chile": 0.0011,
        "uruguay": 0.025,
        "brasil": 0.19,
        "alemania": 1.08,
        "reino_unido": 1.25,
        "canada": 0.75,
        "australia": 0.67,
        "italia": 1.08,
        "francia": 1.08,
        "mexico": 0.055,
        "colombia": 0.00024,
        "peru": 0.27,
        "paraguay": 0.00019,
        "bolivia": 0.00015,
    }
    tc = tc_extraoficial.get(pais, 1.0)

    if moneda == "USD":
        salario_local = salary_equivalente
        salario_local_str = f"USD {salary_equivalente:,.0f}"
    elif moneda == "EUR":
        salario_local = salary_equivalente
        salario_local_str = f"EUR {salary_equivalente:,.0f}"
    elif moneda == "GBP":
        salario_local = salary_equivalente
        salario_local_str = f"GBP {salary_equivalente:,.0f}"
    else:
        salario_local = salary_equivalente * tc
        salario_local_str = f"{moneda} {salario_local:,.0f}"

    poder_adquisitivo = (salary_equivalente / salary_usd) if salary_usd > 0 else 0

    canasta_ars = 350000
    canasta_destino = canasta_ars / blue * factor * for_family

    lines = []
    lines.append("SALARIO EQUIVALENTE POR PAIS")
    lines.append(f"Salario en ARS:   $ {salary:,.0f}")
    lines.append(f"Salario en USD:   USD {salary_usd:,.0f}")
    lines.append(f"Grupo familiar:   {familia} persona(s)")
    lines.append(f"Pais destino:     {pais.upper()}")
    lines.append("---")
    lines.append(f"Para mantener tu nivel de vida en {pais.upper()}:")
    lines.append(f"  {salario_local_str}/mes")
    lines.append(f"  (equivale a $ {salary_ars_equivalente:,.0f} ARS)")
    lines.append("")
    lines.append(f"PODER ADQUISITIVO:")
    lines.append(f"  Tu USD {salary_usd:,.0f} rinden como USD {salary_equivalente:,.0f} en {pais.upper()}")
    lines.append(f"  Factor de conversion: {factor:.1f}x (ajuste por costo de vida)")
    lines.append(f"  Factor familiar: {for_family:.1f}x")
    lines.append("")
    lines.append(f"CANASTA BASICA:")
    lines.append(f"  En Argentina:     $ {canasta_ars:,.0f}")
    lines.append(f"  En {pais.upper()}:      {moneda} {canasta_destino:,.0f}")
    lines.append("")
    lines.append(f"ALQUILER ESTIMADO (2 ambientes):")
    alquiler_arg = 350000
    alquiler_destino = alquiler_arg / blue * factor * 1.2
    lines.append(f"  En Argentina:     $ {alquiler_arg:,.0f}")
    lines.append(f"  En {pais.upper()}:      {moneda} {alquiler_destino:,.0f}")

    lines.append("")
    if factor > 1.5:
        lines.append(
            f"Posta: {pais.upper()} es CARO comparado con Argentina. "
            "Necesitas mas del doble de tu salario en USD para vivir "
            "igual. No es que alla se gane mejor: es que todo cuesta "
            "mas. El mito de 'me voy a Espana y triplico mi sueldo' "
            "se cae cuando ves que el alquiler en Madrid es 3 veces "
            "el de CABA y la cerveza sale 5 euros. La calidad de "
            "vida no es solo cuanto ganas: es cuanto te queda."
        )
    elif factor > 1.0:
        lines.append(
            f"Posta: {pais.upper()} es un poco mas caro que Argentina. "
            "No es una diferencia enorme. Si tenes oferta laboral "
            "alla, probablemente vivas similar que aca. La ventaja "
            "es la estabilidad: no tenes inflacion del 40% ni "
            "devaluacion cada 6 meses. La desventaja: no tenes "
            "a tu familia, el asado no es lo mismo, y en los "
            "paises serios se labura de verdad."
        )
    else:
        lines.append(
            f"Posta: {pais.upper()} es MAS BARATO que Argentina. "
            "Rarisimo, pero existe. Son paises con economias mas "
            "dolarizadas o con menor costo de vida. La contra: "
            "los sueldos suelen ser proporcionalmente mas bajos. "
            "Si laburas remoto para Argentina y vivis ahi, "
            "sos un explotador de arbitraje geografico. "
            "Bien ahi."
        )

    return "\n".join(lines)
