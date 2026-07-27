import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_propiedad metros_cuadrados [barrio_o_ciudad]\n"
            "Calcula precio por m2 de una propiedad y lo compara\n"
            "contra promedios de CABA y zonas.\n"
            "Muestra valor por m2, relacion contra promedio,\n"
            "y si esta cara o barata.\n"
            "Ej: 85000000 70 palermo\n"
            "Ej: USD 200000 50 caba\n"
            "Ej: 45000000 55 mataderos\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (precio m2 [zona])."

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
        price = parse_num(parts[offset])
        m2 = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    zona = ""
    if len(parts) >= offset + 3:
        zona = parts[offset + 2].lower()

    c = "USD" if is_usd else "ARS"
    blue = 1400

    price_per_m2 = price / m2 if m2 > 0 else 0

    precios_promedio_usd = {
        "palermo": 2800,
        "recoleta": 3200,
        "belgrano": 2900,
        "nuñez": 2500,
        "caballito": 2200,
        "almagro": 2400,
        "villa crespo": 2100,
        "devoto": 2300,
        "flores": 1800,
        "floresta": 1600,
        "boedo": 2000,
        "san telmo": 2200,
        "la boca": 1500,
        "constitución": 1400,
        "lugano": 900,
        "mataderos": 1100,
        "paternal": 1900,
        "chacarita": 2300,
        "colegiales": 2400,
        "villa urquiza": 2200,
        "caba": 2300,
        "microcentro": 2600,
        "puerto madero": 4500,
        "retiro": 3000,
    }

    if is_usd:
        price_per_m2_usd = price_per_m2
        price_per_m2_ars = price_per_m2 * blue
    else:
        price_per_m2_usd = price_per_m2 / blue
        price_per_m2_ars = price_per_m2

    prom_usd = None
    for key, val in precios_promedio_usd.items():
        if key in zona or zona in key:
            prom_usd = val
            break

    if prom_usd is None:
        if any(b in zona for b in ["norte", "zona norte", "olivos", "vicente lopez", "san isidro"]):
            prom_usd = 2500
        elif any(b in zona for b in ["oeste", "zona oeste", "moron", "moreno", "merlo"]):
            prom_usd = 1400
        elif any(b in zona for b in ["sur", "zona sur", "lanus", "avellaneda", "lomas"]):
            prom_usd = 1200
        elif any(b in zona for b in ["costa", "costa atlantica", "pinamar", "carilo"]):
            prom_usd = 2000
        else:
            prom_usd = 2000

    ratio = price_per_m2_usd / prom_usd if prom_usd > 0 else 0

    if not is_usd:
        precio_alquiler_mensual = price * 0.005
        anos_recupero = price / (precio_alquiler_mensual * 12) if precio_alquiler_mensual > 0 else 0
    else:
        precio_alquiler_mensual = price * 0.005
        anos_recupero = price / (precio_alquiler_mensual * 12) if precio_alquiler_mensual > 0 else 0

    lines = []
    lines.append("VALUACION DE PROPIEDAD")
    lines.append(f"Precio: {c} {price:,.0f}")
    lines.append(f"Superficie: {m2:.0f} m2")
    if zona:
        lines.append(f"Zona: {zona}")
    lines.append("---")
    lines.append(f"PRECIO POR M2:")
    lines.append(f"  {c} {price_per_m2:,.0f}/m2")
    lines.append(f"  USD {price_per_m2_usd:,.0f}/m2")
    if not is_usd:
        lines.append(f"  $ {price_per_m2_ars:,.0f}/m2")
    lines.append("")
    if prom_usd:
        lines.append(f"PROMEDIO ZONA ({zona or 'estimado'}): USD {prom_usd:,.0f}/m2")
        if ratio > 1.3:
            lines.append(f"  Tu propiedad esta {((ratio-1)*100):.0f}% CARA para la zona")
        elif ratio < 0.7:
            lines.append(f"  Tu propiedad esta {((1-ratio)*100):.0f}% BARATA para la zona")
        else:
            lines.append(f"  Tu propiedad esta en el PRECIO DE MERCADO")
    lines.append("")
    lines.append(f"RELACION PRECIO/ALQUILER:")
    lines.append(f"  Alquiler estimado (0.5%): {c} {precio_alquiler_mensual:,.0f}/mes")
    lines.append(f"  Anos para recuperar: {anos_recupero:.0f}")
    lines.append(f"  (si alquilas al 0.5% del valor)")

    if not is_usd:
        lines.append("")
        lines.append(f"EN USD (blue {blue}):")
        lines.append(f"  Precio:      USD {price/blue:,.0f}")
        lines.append(f"  Precio/m2:   USD {price_per_m2_usd:,.0f}")
        lines.append(f"  Alquiler:    USD {precio_alquiler_mensual/blue:,.0f}")

    lines.append("")
    if ratio > 1.5:
        lines.append(
            f"Posta: Esta propiedad esta CARISIMA para la zona. O "
            "es un depto de lujo con amenities, o el vendedor "
            "cree que la propiedad subio 50% en dos anios "
            "(spoiler: no). En Argentina, los precios de "
            "propiedades estan en USD pero los sueldos en "
            "pesos. El resultado: cada vez menos gente "
            "puede comprar. Si no tenes apuro, espera."
        )
    elif ratio > 1.1:
        lines.append(
            f"Posta: Esta un poco cara pero no es una locura. "
            "Tipico de zonas lindas de CABA o propiedades "
            "bien mantenidas. El precio por m2 en CABA "
            "promedia USD 2,300, con picos de USD 4,500 "
            "en Puerto Madero y minimos de USD 900 en "
            "Lugano. Si estas pagando mas del promedio "
            "de tu zona, asegurate de que valga la pena."
        )
    elif ratio > 0.8:
        lines.append(
            f"Posta: Precio justo para la zona. Ni regalada ni "
            "carisima. En CABA los precios estan estables "
            "desde 2022-2024 porque no hay credito hipotecario "
            "que valga. Las propiedades se venden cuando el "
            "dueño necesita dolares, no cuando el mercado "
            "lo dicta. Comprar es una loteria."
        )
    else:
        lines.append(
            f"Posta: Esta BARATA para la zona. O tiene algo "
            "oculto (humedad, deudas, problemas de titulo) "
            "o el dueño necesita vender rapido. Revisa "
            "todo antes de comprar. En Argentina, lo "
            "barato sale caro dos veces: cuando arreglas "
            "lo que estaba roto y cuando descubris las "
            "deudas de expensas que no te dijeron."
        )

    return "\n".join(lines)
