import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: tipo_animal [peso_kg] [alimento_mensual] [veterinario_anual]\n"
            "Calcula el costo mensual y anual de tener una mascota.\n"
            "Tipo: perro, gato (default perro mediano 15kg)\n"
            "Ej: perro 15 45000 60000\n"
            "Ej: gato 4 25000 40000\n"
            "Ej: USD perro 20 50 100\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el tipo de animal (perro/gato)."

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

    animal = parts[offset].lower()
    if animal not in ("perro", "gato"):
        return "Error: tipo de animal debe ser 'perro' o 'gato'."

    peso = 15 if animal == "perro" else 4
    idx = offset + 1
    if len(parts) > idx:
        try:
            peso = float(parts[idx])
            idx += 1
        except ValueError:
            pass

    if animal == "perro":
        costo_alimento_base = 35000 if not is_usd else 40
        costo_vet_base = 50000 if not is_usd else 80
        if peso < 10:
            costo_alimento_base = 25000 if not is_usd else 30
        elif peso > 25:
            costo_alimento_base = 50000 if not is_usd else 60
    else:
        costo_alimento_base = 20000 if not is_usd else 25
        costo_vet_base = 35000 if not is_usd else 60

    costo_alimento = costo_alimento_base
    costo_vet = costo_vet_base

    if len(parts) > idx:
        costo_alimento = parse_num(parts[idx])
        idx += 1
    if len(parts) > idx:
        costo_vet = parse_num(parts[idx])

    if is_usd:
        costo_alimento_ars = costo_alimento * 1400
        costo_vet_ars = costo_vet * 1400
    else:
        costo_alimento_ars = costo_alimento
        costo_vet_ars = costo_vet

    c = "USD" if is_usd else "ARS"
    blue = 1400

    alimento_mensual = costo_alimento_ars
    vet_mensual = costo_vet_ars / 12
    vacunas_anual = 25000 if not is_usd else 40
    if is_usd:
        vacunas_anual_ars = vacunas_anual * blue
    else:
        vacunas_anual_ars = vacunas_anual
    vacunas_mensual = vacunas_anual_ars / 12

    juguetes_mensual = (8000 if not is_usd else 10) * blue if is_usd else 8000
    accesorios_mensual = (5000 if not is_usd else 8) * blue if is_usd else 5000

    if animal == "perro":
        paseador_mensual = 0
        if peso > 10:
            paseador_mensual = (30000 if not is_usd else 40) * blue if is_usd else 30000
    else:
        paseador_mensual = 0
        piedras_mensual = (5000 if not is_usd else 8) * blue if is_usd else 5000

    total_mensual = alimento_mensual + vet_mensual + vacunas_mensual + juguetes_mensual + accesorios_mensual + (paseador_mensual if animal == "perro" else piedras_mensual if animal == "gato" else 0)
    total_anual = total_mensual * 12
    total_5a = total_anual * 5
    total_15a = total_anual * 15

    if not is_usd:
        total_usd_mensual = total_mensual / blue
    else:
        total_usd_mensual = total_mensual / blue

    lines = []
    lines.append(f"COSTO DE TENER UN {animal.upper()}")
    lines.append(f"Peso: {peso:.0f} kg")
    lines.append(c + " " + "-" * 40)
    lines.append("GASTOS MENSUALES:")
    lines.append(f"  Alimento:          {c} {alimento_mensual:,.0f}")
    lines.append(f"  Veterinario:       {c} {vet_mensual:,.0f}")
    lines.append(f"  Vacunas:           {c} {vacunas_mensual:,.0f}")
    lines.append(f"  Juguetes:          {c} {juguetes_mensual:,.0f}")
    lines.append(f"  Accesorios:        {c} {accesorios_mensual:,.0f}")
    if animal == "perro" and paseador_mensual:
        lines.append(f"  Paseador:          {c} {paseador_mensual:,.0f}")
    elif animal == "gato":
        lines.append(f"  Piedras/arena:     {c} {piedras_mensual:,.0f}")
    lines.append("  " + "-" * 30)
    lines.append(f"  TOTAL MENSUAL:     {c} {total_mensual:,.0f}")
    lines.append("")
    lines.append("PROYECCIONES:")
    lines.append(f"  Por anio:      {c} {total_anual:,.0f}")
    lines.append(f"  En 5 anios:    {c} {total_5a:,.0f}")
    lines.append(f"  En 15 anios:   {c} {total_15a:,.0f} (vida promedio)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Mensual:  USD {total_mensual/blue:,.0f}")
        lines.append(f"  Anual:    USD {total_anual/blue:,.0f}")
        lines.append(f"  15 anios: USD {total_15a/blue:,.0f}")

    lines.append("")
    if total_mensual > 100000:
        lines.append(
            f"Posta: Gastas mas de 100 lucas por mes en tu {animal}. "
            "Tu mascota vive mejor que muchos argentinos. Come "
            "balanceado, tiene vet, juguetes, y probablemente "
            "duerme en tu cama. No es un gasto: es un hijo "
            "peludo. La clase media argentina trata a sus "
            "mascotas como reyes porque no puede tener hijos "
            "o porque los hijos se fueron del pais. El perro "
            "es el nuevo hijo, el gato es el nuevo roomie."
        )
    elif total_mensual > 50000:
        lines.append(
            f"Posta: Entre 50 y 100 lucas por mes. Estas en el "
            "promedio de la clase media con mascota. No es "
            "una fortuna pero tampoco es moneda chica. En "
            "15 anios, tu {animal} te va a haber costado "
            f"{c} {total_15a:,.0f}. La pregunta es: vale "
            "la pena? Por supuesto que si. El amor de un "
            f"{animal} no tiene precio. Pero tiene costo."
        )
    else:
        lines.append(
            f"Posta: Menos de 50 lucas por mes. O tenes un {animal} "
            "chico, o compras alimento generico, o no vas al "
            "vet seguido. Cuidado: la salud del {animal} no "
            "es donde ahorrar. Pero si tu mascota esta sana "
            "y feliz, bien ahi. El {animal} es el unico ser "
            "en el capitalismo que te quiere sin importar "
            "cuanto ganes."
        )

    return "\n".join(lines)
