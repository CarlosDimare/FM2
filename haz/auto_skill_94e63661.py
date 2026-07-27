import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: cantidad_lamp watts_vieja watts_led horas_dia [costo_kwh]\n"
            "Compara el consumo de lamparas viejas vs LED.\n"
            "Muestra ahorro mensual, anual, y tiempo de recupero de inversion.\n"
            "Ej: 10 60 9 6 45\n"
            "Ej: 5 100 15 8\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 4:
        return "Error: faltan parametros (cant watts_vieja watts_led horas_dia [costo_kwh])."

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
        cant = int(float(parts[0]))
        w_vieja = float(parts[1])
        w_led = float(parts[2])
        horas = float(parts[3])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    costo_kwh = 45.0
    if len(parts) >= 5:
        costo_kwh = parse_num(parts[4])

    kw_vieja = w_vieja * cant / 1000
    kw_led = w_led * cant / 1000

    kwh_dia_vieja = kw_vieja * horas
    kwh_dia_led = kw_led * horas
    kwh_mes_vieja = kwh_dia_vieja * 30
    kwh_mes_led = kwh_dia_led * 30
    kwh_ano_vieja = kwh_dia_vieja * 365
    kwh_ano_led = kwh_dia_led * 365

    costo_mes_vieja = kwh_mes_vieja * costo_kwh
    costo_mes_led = kwh_mes_led * costo_kwh
    costo_ano_vieja = kwh_ano_vieja * costo_kwh
    costo_ano_led = kwh_ano_led * costo_kwh

    ahorro_mes = costo_mes_vieja - costo_mes_led
    ahorro_ano = costo_ano_vieja - costo_ano_led
    ahorro_5a = ahorro_ano * 5

    costo_lampara_vieja = 800
    costo_lampara_led = 5000
    inversion_total = cant * (costo_lampara_led - costo_lampara_vieja)

    meses_recupero = inversion_total / ahorro_mes if ahorro_mes > 0 else 0
    co2_por_kwh = 0.35
    co2_ano_vieja = kwh_ano_vieja * co2_por_kwh
    co2_ano_led = kwh_ano_led * co2_por_kwh
    co2_ahorro = co2_ano_vieja - co2_ano_led

    lines = []
    lines.append("AHORRO CON LAMPARAS LED")
    lines.append(f"Lamparas: {cant}")
    lines.append(f"Potencia vieja: {w_vieja:.0f}W cada una")
    lines.append(f"Potencia LED:   {w_led:.0f}W cada una")
    lines.append(f"Horas por dia: {horas:.0f}")
    lines.append(f"Costo kWh: $ {costo_kwh:.0f}")
    lines.append("---")
    lines.append("CONSUMO ELECTRICO:")
    lines.append(f"  Viejo: {kwh_dia_vieja:.1f} kWh/dia | {kwh_mes_vieja:.0f} kWh/mes")
    lines.append(f"  LED:   {kwh_dia_led:.1f} kWh/dia | {kwh_mes_led:.0f} kWh/mes")
    lines.append(f"  Ahorro: {kwh_dia_vieja-kwh_dia_led:.1f} kWh/dia")
    lines.append("")
    lines.append("COSTO:")
    lines.append(f"  Viejo: $ {costo_mes_vieja:,.0f}/mes")
    lines.append(f"  LED:   $ {costo_mes_led:,.0f}/mes")
    lines.append(f"  Ahorro: $ {ahorro_mes:,.0f}/mes")
    lines.append(f"          $ {ahorro_ano:,.0f}/ano")
    lines.append(f"          $ {ahorro_5a:,.0f} en 5 anios")
    lines.append("")
    lines.append("INVERSION:")
    lines.append(f"  Costo extra x lampara LED: $ {costo_lampara_led - costo_lampara_vieja:,.0f}")
    lines.append(f"  Inversion total:           $ {inversion_total:,.0f}")
    lines.append(f"  Recupero en:               {meses_recupero:.0f} meses ({meses_recupero/12:.1f} anios)")
    lines.append("")
    lines.append("EMISIONES DE CO2:")
    lines.append(f"  Viejo: {co2_ano_vieja:.0f} kg CO2/ano")
    lines.append(f"  LED:   {co2_ano_led:.0f} kg CO2/ano")
    lines.append(f"  Ahorro: {co2_ahorro:.0f} kg CO2/ano")
    lines.append(f"  Equivale a plantar {co2_ahorro/21:.0f} arboles")

    lines.append("")
    if meses_recupero <= 6:
        lines.append(
            f"Posta: Recuperas la inversion en menos de 6 meses. "
            "Las LED son un negocion. No solo ahorras plata, "
            "duran 15 veces mas (25,000 horas vs 1,500 h de "
            "las halogenas). Si toda la Argentina pasara a "
            "LED, el ahorro energetico seria equivalente a "
            "una represa de Yacyreta. Pero las electricas "
            "no quieren que ahorres: quieren que consumas."
        )
    elif meses_recupero <= 12:
        lines.append(
            f"Posta: Recuperas la inversion en un ano. Es la "
            "mejor inversion que podes hacer en tu casa "
            "despues de arreglar las perdidas de agua. "
            "Las LED duran mas, consumen menos, y no se "
            "queman como las halogenas. El unico problema "
            "es que la luz fria de algunas LED es horrible. "
            "Compra temperatura calida (2700-3000K) para "
            "no sentir que estas en un hospital."
        )
    else:
        lines.append(
            f"Posta: Recuperas la inversion en {meses_recupero:.0f} meses. "
            "Sigue siendo buena inversion, pero no tan rapida. "
            "Si usas las lamparas pocas horas al dia, el ahorro "
            "es menor. Pero las LED duran 10-15 anios, asi que "
            "a largo plazo siempre conviene. La pregunta es: "
            "por que el Estado no subsidia LED en lugar de "
            "subsidiar la luz de los que mas consumen?"
        )

    return "\n".join(lines)
