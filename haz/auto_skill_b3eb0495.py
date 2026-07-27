import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: km_diarios [costo_bici] [costo_auto]\n"
            "Compara el costo de moverse en bici vs auto.\n"
            "Incluye combustible, seguro, mantenimiento, estacionamiento\n"
            "vs mantenimiento de bici, y tiempo de viaje.\n"
            "Ej: 20\n"
            "Ej: 15 50000 15000000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: falta la cantidad de km diarios."

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
        km_diarios = float(parts[0])
    except ValueError:
        return "Error: no se pudo parsear km diarios."

    if len(parts) >= 2:
        costo_bici = parse_num(parts[1])
    else:
        costo_bici = 250000

    if len(parts) >= 3:
        costo_auto = parse_num(parts[2])
    else:
        costo_auto = 15000000

    dias_semana = 5
    semanas_mes = 4.33
    km_mes = km_diarios * dias_semana * semanas_mes
    km_ano = km_mes * 12

    costo_bici_anual = costo_bici / 5
    mantenimiento_bici_mes = 8000
    mantenimiento_bici_ano = mantenimiento_bici_mes * 12
    total_bici_ano = costo_bici_anual + mantenimiento_bici_ano

    costo_bici_km = total_bici_ano / km_ano if km_ano > 0 else 0

    seguro_auto_mes = costo_auto * 0.005 / 12
    patente_auto_mes = costo_auto * 0.01 / 12
    combustible_mes = (km_mes / 12) * 1300
    mantenimiento_auto_mes = costo_auto * 0.002
    total_auto_mes = seguro_auto_mes + patente_auto_mes + combustible_mes + mantenimiento_auto_mes
    total_auto_ano = total_auto_mes * 12
    costo_auto_km = total_auto_ano / km_ano if km_ano > 0 else 0

    ahorro_mes = total_auto_mes - total_bici_ano / 12
    ahorro_ano = total_auto_ano - total_bici_ano
    ahorro_5a = ahorro_ano * 5

    tiempo_bici_extra = 0.5
    horas_extra_mes = tiempo_bici_extra * dias_semana * semanas_mes
    horas_extra_ano = horas_extra_mes * 12

    distancia_vida = 40
    km_vida = km_ano * distancia_vida

    lines = []
    lines.append("BICICLETA vs AUTO")
    lines.append(f"Km diarios: {km_diarios:.0f}")
    lines.append(f"Km por mes: {km_mes:.0f}")
    lines.append(f"Km por ano: {km_ano:.0f}")
    lines.append("---")
    lines.append("COSTO ANUAL EN BICI:")
    lines.append(f"  Amortizacion bici ({costo_bici:,.0f}/5 anios):   $ {costo_bici_anual:,.0f}")
    lines.append(f"  Mantenimiento:                              $ {mantenimiento_bici_ano:,.0f}")
    lines.append(f"  TOTAL:                                      $ {total_bici_ano:,.0f}")
    lines.append(f"  Costo por km:                               $ {costo_bici_km:,.0f}")
    lines.append("")
    lines.append("COSTO ANUAL EN AUTO:")
    lines.append(f"  Seguro:                                     $ {seguro_auto_mes*12:,.0f}")
    lines.append(f"  Patente:                                    $ {patente_auto_mes*12:,.0f}")
    lines.append(f"  Combustible ({km_mes:.0f} km/mes):                 $ {combustible_mes*12:,.0f}")
    lines.append(f"  Mantenimiento:                              $ {mantenimiento_auto_mes*12:,.0f}")
    lines.append(f"  TOTAL:                                      $ {total_auto_ano:,.0f}")
    lines.append(f"  Costo por km:                               $ {costo_auto_km:,.0f}")
    lines.append("")
    lines.append("COMPARACION:")
    lines.append(f"  Auto es {costo_auto_km/costo_bici_km:.0f}x mas caro por km que la bici")
    lines.append(f"  Ahorro por mes:  $ {ahorro_mes:,.0f}")
    lines.append(f"  Ahorro por ano:  $ {ahorro_ano:,.0f}")
    lines.append(f"  Ahorro en 5 anios: $ {ahorro_5a:,.0f}")
    lines.append("")
    lines.append("TIEMPO:")
    lines.append(f"  En bici perdes {tiempo_bici_extra:.0f} h/dia extras")
    lines.append(f"  = {horas_extra_mes:.0f} h/mes")
    lines.append(f"  = {horas_extra_ano:.0f} h/ano")
    lines.append(f"  En {distancia_vida} anios: {horas_extra_ano*distancia_vida/24:.0f} dias de tu vida")
    lines.append("")
    lines.append("AHORRO EN 5 ANIOS:")
    ahorro_5_total = ahorro_5a
    for item, cost in [
        ("kg de asado", 18000),
        ("docena de empanadas", 12000),
        ("cerveza artesanal", 4000),
        ("cuota de gimnasio", 25000),
        ("viaje a Brasil", 2000000),
    ]:
        cant = ahorro_5_total / cost
        if cant >= 2:
            lines.append(f"  {cant:.0f} x {item}")

    lines.append("")
    if km_diarios > 15:
        lines.append(
            f"Posta: {km_diarios:.0f} km diarios en bici es una banda. "
            "Son como 45-60 minutos de pedaleo por viaje. En auto "
            "son 20-30 minutos pero te cuesta 4 veces mas. La "
            "bici es mas barata, mas sana, y no contamina. El "
            "auto es mas comodo, mas rapido, y te estacionan "
            "el corazon. La clase media elige auto por estatus. "
            "La clase obrera elige bici porque no le queda otra. "
            "Y la clase alta elige bici como hobby, no como "
            "transporte."
        )
    elif km_diarios > 5:
        lines.append(
            f"Posta: {km_diarios:.0f} km diarios en bici es razonable. "
            "Unos 20-30 minutos por viaje. El ahorro anual de "
            f"$ {ahorro_ano:,.0f} es significativo. La pregunta "
            "es si tu ciudad tiene ciclovias, si el clima "
            "acompana, y si llegas transpirado al laburo. "
            "En Argentina, la infraestructura para bici "
            "mejoro en CABA pero en el conurbano es "
            "una loteria."
        )
    else:
        lines.append(
            f"Posta: Menos de 5 km diarios es ideal para bici. "
            "Son 10-15 minutos, no transpiracion, y un "
            "ahorro enorme. A esta distancia, el auto "
            "es pura vagancia (o pura necesidad si "
            "llevas nenes o compras). La bici es "
            "la herramienta de transporte mas "
            "eficiente jamas inventada. Y la "
            "mas democratica."
        )

    return "\n".join(lines)
