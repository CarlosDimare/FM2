import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: distancia_km metros_cuadrados [ayudantes] [cajas] [flete_diario]\n"
            "Calcula el costo estimado de una mudanza.\n"
            "Incluye flete, ayudantes, cajas, embalaje, y tiempo estimado.\n"
            "Muestra costo total, por metro cuadrado, y meses de alquiler.\n"
            "Ej: 15 70 3 20 45000\n"
            "Ej: USD 10 50 2 15 100\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (distancia m2 [ayudantes] [cajas] [flete_diario])."

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
        km = float(parts[offset])
        m2 = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear distancia y metros."

    ayudantes = 3
    cajas = 20
    flete_diario = 45000

    if len(parts) >= offset + 3:
        ayudantes = int(float(parts[offset + 2]))
    if len(parts) >= offset + 4:
        cajas = int(float(parts[offset + 3]))
    if len(parts) >= offset + 5:
        flete_diario = parse_num(parts[offset + 4])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    horas_estimadas = 4 + (m2 / 30)
    if km > 50:
        horas_estimadas += 1
    if km > 100:
        horas_estimadas += 1

    costo_flete = flete_diario
    costo_combustible = km * (180 if not is_usd else 0.5)

    costo_ayudante = ayudantes * horas_estimadas * (5000 if not is_usd else 15)
    costo_cajas = cajas * (2500 if not is_usd else 5)
    costo_embalaje = m2 * (500 if not is_usd else 2)
    costo_seguro = (flete_diario * 0.1)

    total = costo_flete + costo_combustible + costo_ayudante + costo_cajas + costo_embalaje + costo_seguro

    if not is_usd:
        alquiler_promedio = 350000
    else:
        alquiler_promedio = 500

    meses_alquiler = total / alquiler_promedio if alquiler_promedio > 0 else 0
    costo_por_m2 = total / m2 if m2 > 0 else 0

    lines = []
    lines.append(f"COSTO DE MUDANZA")
    lines.append(f"Distancia: {km:.0f} km")
    lines.append(f"Superficie: {m2:.0f} m2")
    lines.append(f"Ayudantes: {ayudantes}")
    lines.append(f"Cajas: {cajas}")
    lines.append(c + " " + "-" * 40)
    lines.append("DESGLOSE:")
    lines.append(f"  Flete:              {c} {costo_flete:,.0f}")
    lines.append(f"  Combustible:        {c} {costo_combustible:,.0f}")
    lines.append(f"  Ayudantes ({ayudantes} x {horas_estimadas:.0f}h): {c} {costo_ayudante:,.0f}")
    lines.append(f"  Cajas ({cajas}):         {c} {costo_cajas:,.0f}")
    lines.append(f"  Embalaje:           {c} {costo_embalaje:,.0f}")
    lines.append(f"  Seguro (10%):       {c} {costo_seguro:,.0f}")
    lines.append("  " + "-" * 35)
    lines.append(f"  TOTAL:              {c} {total:,.0f}")
    lines.append("")
    lines.append(f"TIEMPO ESTIMADO: {horas_estimadas:.0f} horas")
    lines.append(f"COSTO POR M2:    {c} {costo_por_m2:,.0f}")
    lines.append(f"EQUIVALE A:      {meses_alquiler:.2f} meses de alquiler")
    lines.append("")

    if not is_usd:
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Total mudanza: USD {total/blue:,.0f}")
        lines.append(f"  Por m2:        USD {costo_por_m2/blue:,.0f}")

    lines.append("")
    if km > 100:
        lines.append(
            f"Posta: Mas de 100 km de mudanza. Eso ya no es mudarse "
            "de barrio: es cambiar de vida. Estas mudando todo tu "
            "hogar a otra ciudad o provincia. El costo de mudanza "
            "es alto pero el costo de no mudarte (alquiler caro, "
            mal barrio) puede ser mayor. La clase media argentina "
            "se muda cada vez mas lejos porque el centro es caro. "
            "Bienvenido al conurbano profundo."
        )
    elif km > 20:
        lines.append(
            f"Posta: Mudanza dentro de la misma ciudad pero entre "
            "barrios. Es el tipo de mudanza mas comun de la clase "
            "media: de un depto a otro, un poco mas grande o mas "
            "barato. El costo no es enorme pero sumale la comida "
            "del dia, las cervezas para los ayudantes, y lo que "
            "siempre se rompe. Siempre se rompe algo."
        )
    else:
        lines.append(
            f"Posta: Mudanza corta. Menos de 20 km. Esto es lo "
            "ideal: no necesitas cambiar de laburo, ni de "
            "colegio de los pibes, ni de medico. La mudanza "
            "ideal es la que no existe, pero si tenes que "
            "hacerla, que sea cerca. La clase media se muda "
            "cada 5-7 anios en promedio. Cada vez mas lejos "
            "y con menos plata."
        )

    if m2 > 80:
        lines.append("")
        lines.append(
            "Tip: Mas de 80 m2 es una casa grande. Considera "
            "contratar una empresa de mudanzas con seguro. "
            "Los muebles grandes (somier, placard, mesa de 6 "
            "sillas) necesitan desarmarse y eso suma horas. "
            "No seas el amigo que pide ayuda con una cerveza "
            "para mudar una casa de 120 m2. Paga profesionales."
        )

    return "\n".join(lines)
