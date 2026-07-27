import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: reforma metros_cuadrados tipo [calidad]\n"
            "Calcula el costo estimado de una reforma o construccion\n"
            "en Argentina segun el tipo de obra y calidad.\n"
            "Tipos: basica (pintura/pisos), cocina, bano, ampliacion, total\n"
            "Calidad: economica, estandar, premium (default estandar)\n"
            "Ej: 50 cocina\n"
            "Ej: USD 100 ampliacion premium\n"
            "Ej: 30 bano economica\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (metros tipo [calidad])."

    try:
        metros = float(parts[offset])
    except ValueError:
        return "Error: no se pudo parsear los metros."

    tipo = parts[offset + 1].lower()

    calidad = "estandar"
    if len(parts) >= offset + 3:
        calidad = parts[offset + 2].lower()

    c = "USD" if is_usd else "ARS"
    blue = 1400

    costos_m2 = {
        "basica": {"economica": 150000, "estandar": 250000, "premium": 400000},
        "cocina": {"economica": 300000, "estandar": 550000, "premium": 950000},
        "bano": {"economica": 350000, "estandar": 600000, "premium": 1000000},
        "ampliacion": {"economica": 500000, "estandar": 850000, "premium": 1400000},
        "total": {"economica": 400000, "estandar": 700000, "premium": 1200000},
    }

    if tipo not in costos_m2:
        tipos = ", ".join(costos_m2.keys())
        return f"Error: tipo desconocido '{tipo}'. Tipos: {tipos}"
    if calidad not in costos_m2[tipo]:
        return f"Error: calidad desconocida '{calidad}'. Opciones: economica, estandar, premium"

    costo_m2 = costos_m2[tipo][calidad]
    if is_usd:
        costo_m2_ars = costo_m2 * blue
    else:
        costo_m2_ars = costo_m2

    costo_total = metros * costo_m2_ars

    # Materiales 60%, mano de obra 40% aprox
    materiales = costo_total * 0.6
    mano_obra = costo_total * 0.4

    duracion_meses = {
        "basica": 0.5,
        "cocina": 1.5,
        "bano": 1.5,
        "ampliacion": 3,
        "total": 4,
    }

    tiempo = duracion_meses.get(tipo, 1)

    lines = []
    lines.append("CALCULADORA DE REFORMA/CONSTRUCCION")
    lines.append(f"Superficie:          {metros:.0f} m2")
    lines.append(f"Tipo de obra:        {tipo.capitalize()}")
    lines.append(f"Calidad:             {calidad.capitalize()}")
    lines.append("---")

    ars_mult = 1 if not is_usd else blue
    lines.append(f"Costo por m2:        {c} {costo_m2:,.0f}")
    lines.append(f"Costo TOTAL:         {c} {costo_total/ars_mult:,.0f}")
    lines.append(f"  Materiales (60%):  {c} {materiales/ars_mult:,.0f}")
    lines.append(f"  Mano de obra (40%):{c} {mano_obra/ars_mult:,.0f}")
    lines.append("")
    lines.append(f"TIEMPO ESTIMADO:     {tiempo:.1f} meses")
    lines.append(f"Costo por mes:       {c} {(costo_total/tiempo)/ars_mult:,.0f}")
    lines.append("")

    if not is_usd:
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Total:       USD {costo_total/blue:,.0f}")
        lines.append(f"  Por m2:      USD {costo_m2_ars/blue:,.0f}")
        lines.append(f"  Por mes:     USD {(costo_total/tiempo)/blue:,.0f}")
        lines.append("")

    salario_ref = 1000000
    sueldo_equiv = costo_total / salario_ref_ars if (salario_ref_ars := (salario_ref * blue if is_usd else salario_ref)) > 0 else 0
    lines.append(f"EQUIVALE A {sueldo_equiv:.1f} sueldos de referencia ({c} {salario_ref:,.0f})")
    lines.append("")

    if tipo == "total":
        lines.append(
            f"Posta: {costo_total/ars_mult:,.0f} por {metros:.0f} m2 de obra total. "
            "Una casa completa te sale como un departamento en CABA "
            "pero sin credito hipotecario que valga. "
            "La construccion en Argentina es de las mas caras "
            "de Latinoamerica porque los materiales cotizan a dolar "
            "y los sueldos en pesos. "
            "O sea: pagas como si vivieras en Suiza pero "
            "cobras como si vivieras en Argentina. "
            "La clase media construye de a pedazos: "
            "un bano, una cocina, un dormitorio. "
            "La casa propia es la obra de una vida."
        )
    elif tipo in ("cocina", "bano"):
        lines.append(
            f"Posta: {costo_total/ars_mult:,.0f} por reformar {metros:.0f} m2 de {tipo}. "
            "Los banos y cocinas son las reformas mas caras "
            "por metro porque concentran instalaciones. "
            "Los argentinos reformamos de a partes porque "
            "hacer todo junto es impagable. "
            "Y cuando terminas de pagar una reforma, "
            "ya tenes que empezar la proxima. "
            "La casa propia es una suscripcion perpetua."
        )
    else:
        lines.append(
            f"Posta: {costo_total/ars_mult:,.0f} por {metros:.0f} m2 de obra {tipo}. "
            "Una reforma chica pero que duele. "
            "La plata que no tenes pero necesitas. "
            "Argentina es el unico pais donde la gente "
            "piensa 'con USD 5000 hago toda la casa' "
            "y termina gastando USD 15000 en un bano. "
            "El presupuesto inicial siempre es la mitad "
            "de lo que termina costando. "
            "No es falta de calculo: es esperanza."
        )

    return "\n".join(lines)
