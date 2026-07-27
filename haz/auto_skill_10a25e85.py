import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: costo_anual_carrera anios_duracion salario_actual salario_estimado [hijos]\n"
            "Calcula el retorno de inversion de estudiar una carrera.\n"
            "Incluye costo de oportunidad (no trabajar), matricula, materiales.\n"
            "Muestra costo total, anos para recuperar, y ROI a 10/20/30 anios.\n"
            "Ej: 500000 5 800000 2500000\n"
            "Ej: USD 10000 4 3000 8000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 4:
        return "Error: faltan parametros (costo_anual anios salario_actual salario_estimado [hijos])."

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
        costo_anual = parse_num(parts[offset])
        anios = int(float(parts[offset + 1]))
        salario_actual = parse_num(parts[offset + 2])
        salario_estimado = parse_num(parts[offset + 3])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    hijos = 0
    if len(parts) >= offset + 5:
        try:
            hijos = int(float(parts[offset + 4]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    anos_working = 35

    costo_directo = costo_anual * anios
    costo_oportunidad = salario_actual * anios
    costo_total = costo_directo + costo_oportunidad

    incremento_anual = salario_estimado - salario_actual

    years_to_break_even = costo_total / incremento_anual if incremento_anual > 0 else float("inf")

    ganancia_10 = incremento_anual * 10 - costo_total
    ganancia_20 = incremento_anual * 20 - costo_total
    ganancia_30 = incremento_anual * 30 - costo_total

    roi_10 = (ganancia_10 / costo_total) * 100 if costo_total > 0 else 0
    roi_20 = (ganancia_20 / costo_total) * 100 if costo_total > 0 else 0
    roi_30 = (ganancia_30 / costo_total) * 100 if costo_total > 0 else 0

    vida_laboral_restante = anos_working - anios
    ganancia_total_vida = incremento_anual * vida_laboral_restante - costo_total
    roi_vida = (ganancia_total_vida / costo_total) * 100 if costo_total > 0 else 0

    lines = []
    lines.append("RETORNO DE INVERSION - EDUCACION")
    lines.append(f"Costo anual: {c} {costo_anual:,.0f}")
    lines.append(f"Duracion: {anios} anios")
    lines.append(f"Salario actual: {c} {salario_actual:,.0f}")
    lines.append(f"Salario estimado: {c} {salario_estimado:,.0f}")
    lines.append(f"Incremento salarial: {c} {incremento_anual:,.0f}")
    lines.append("---")
    lines.append("COSTO TOTAL DE ESTUDIAR:")
    lines.append(f"  Costo directo (cuotas, libros, etc.):   {c} {costo_directo:,.0f}")
    lines.append(f"  Costo oportunidad ({anios} anios sin trabajar): {c} {costo_oportunidad:,.0f}")
    lines.append(f"  COSTO TOTAL:                             {c} {costo_total:,.0f}")
    lines.append("")
    lines.append("RECUPERO DE LA INVERSION:")
    if years_to_break_even < float("inf"):
        lines.append(f"  Anos para recuperar: {years_to_break_even:.1f}")
        lines.append(f"  (si trabajas {vida_laboral_restante} anios mas)")
    else:
        lines.append("  El incremento salarial no cubre el costo.")
    lines.append("")
    lines.append("GANANCIA NETA:")
    lines.append(f"  A 10 anios: {c} {ganancia_10:,.0f} (ROI {roi_10:.0f}%)")
    lines.append(f"  A 20 anios: {c} {ganancia_20:,.0f} (ROI {roi_20:.0f}%)")
    lines.append(f"  A 30 anios: {c} {ganancia_30:,.0f} (ROI {roi_30:.0f}%)")
    lines.append(f"  Total vida laboral: {c} {ganancia_total_vida:,.0f} (ROI {roi_vida:.0f}%)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Costo total:    USD {costo_total/blue:,.0f}")
        lines.append(f"  Ganancia 10a:   USD {ganancia_10/blue:,.0f}")
        lines.append(f"  Ganancia total: USD {ganancia_total_vida/blue:,.0f}")

    lines.append("")
    if roi_vida > 500:
        lines.append(
            f"Posta: Un ROI del {roi_vida:.0f}% en toda tu vida laboral. "
            "Estudiar rindio. La educacion es la unica inversion que "
            "nadie te puede sacar (excepto una crisis, una dictadura "
            "o un gobierno que no reconozca titulos extranjeros). "
            "Pero ojo: este calculo asume que conseguis el trabajo "
            "y el salario estimado. En Argentina, tener titulo no "
            "garantiza nada. Pero no tenerlo, garantiza menos."
        )
    elif roi_vida > 100:
        lines.append(
            f"Posta: ROI del {roi_vida:.0f}%. Rinde pero no es magico. "
            "La educacion es una inversion de largo plazo en un pais "
            "de corto plazo. Si estudias una carrera de 5-6 anios, "
            "recien empiezas a ver retorno a los 10. La clase media "
            "argentina apuesta a la educacion de sus hijos porque "
            "es lo unico que no se devalua. Mentira: tambien se "
            "devalua, pero mas despacio que el peso."
        )
    elif roi_vida > 0:
        lines.append(
            f"Posta: ROI del {roi_vida:.0f}%. Rinde poco. O la carrera "
            "es cara, o el salario estimado es bajo, o ya ganabas "
            "bien antes. En cualquier caso, estudiar no fue un "
            "negocio, pero tampoco una perdida. La educacion no "
            "es solo plata: es conocimiento, contactos, y la "
            "posibilidad de no vivir toda tu vida preguntandote "
            "'y si hubiera estudiado?'"
        )
    else:
        lines.append(
            f"Posta: ROI negativo ({roi_vida:.0f}%). Perdiste plata "
            "estudiando. Es posible si la carrera es cara y el "
            "salario no mejora mucho. Pero la educacion no es "
            "una accion de bolsa: hay cosas que el ROI no mide. "
            "Mejor preguntate: serias mas feliz sin haber "
            "estudiado? Si la respuesta es si, mal ahi. Si es "
            "no, entonces rindio igual."
        )

    return "\n".join(lines)
