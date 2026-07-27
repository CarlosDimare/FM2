import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio_usos nombre_del_item [precio_alternativa] [usos_alternativa]\n"
            "Calcula el costo por uso de cualquier cosa que compres.\n"
            "Compara contra alquilar, prestar, o comprar algo mas barato.\n"
            "Te dice si conviene comprar o buscar alternativa.\n"
            "Ej: 50000 50 zapatillas\n"
            "Ej: 250000 100 paraguas 5000 10\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 3:
        return "Error: faltan parametros (precio usos nombre [precio_alt usos_alt])."

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

    def parse_name(parts, start):
        name_parts = []
        i = start
        while i < len(parts):
            try:
                float(parts[i].upper().replace("K", "").replace("M", ""))
                if i > start:
                    break
            except ValueError:
                name_parts.append(parts[i])
                i += 1
        return " ".join(name_parts), i

    try:
        price = parse_num(parts[0])
        uses = int(float(parts[1]))
        name, next_idx = parse_name(parts, 2)
        if not name:
            name = "item"
    except ValueError:
        return "Error: no se pudieron parsear los primeros parametros."

    alt_price = None
    alt_uses = None
    if len(parts) > next_idx:
        try:
            alt_price = parse_num(parts[next_idx])
            if len(parts) > next_idx + 1:
                alt_uses = int(float(parts[next_idx + 1]))
        except ValueError:
            pass

    cost_per_use = price / uses if uses > 0 else 0
    cost_per_year_1 = 0
    cost_per_year_2 = 0

    years_1 = max(1, uses / 12)
    cost_per_year_1 = price / years_1

    lines = []
    lines.append(f"COSTO POR USO: {name}")
    lines.append(f"Precio: $ {price:,.0f}")
    lines.append(f"Usos estimados: {uses}")
    lines.append("---")
    lines.append(f"COSTO POR USO: $ {cost_per_use:,.0f}")
    lines.append(f"COSTO POR ANO: $ {cost_per_year_1:,.0f} (estimado {years_1:.0f} anios)")
    lines.append("")

    if alt_price is not None:
        alt_cost_per_use = alt_price / alt_uses if alt_uses and alt_uses > 0 else 0
        diff_per_use = cost_per_use - alt_cost_per_use
        pct_diff = ((cost_per_use - alt_cost_per_use) / alt_cost_per_use) * 100 if alt_cost_per_use > 0 else 0

        lines.append("COMPARACION CON ALTERNATIVA:")
        lines.append(f"  Alternativa: $ {alt_price:,.0f} / {alt_uses} usos")
        lines.append(f"  Costo/uso alt: $ {alt_cost_per_use:,.0f}")
        lines.append("")
        if diff_per_use > 0:
            lines.append(f"  {name} es $ {diff_per_use:,.0f} MAS CARO por uso ({pct_diff:.0f}%)")
        elif diff_per_use < 0:
            lines.append(f"  {name} es $ {abs(diff_per_use):,.0f} MAS BARATO por uso ({abs(pct_diff):.0f}%)")
        else:
            lines.append("  Cuestan lo mismo por uso")
        lines.append("")

    lines.append("EQUIVALENCIAS:")
    for item, cost in [
        ("viaje en bondi", 1200),
        ("cafe", 3500),
        ("cerveza", 4000),
        ("empanada", 1200),
        ("kg de asado", 18000),
    ]:
        cant = cost_per_use / cost
        if cant >= 1:
            lines.append(f"  1 uso = {cant:.0f} x {item}")
        elif cant >= 0.1:
            lines.append(f"  1 uso = {cant:.1f} x {item}")

    lines.append("")
    if cost_per_use > 50000:
        lines.append(
            f"Posta: {name} te sale $ {cost_per_use:,.0f} por uso. "
            "Eso es CARO. Preguntate si realmente lo vas a usar "
            "tantas veces como pensas. El 90% de las cosas que "
            "compramos las usamos menos de 10 veces. El capitalismo "
            "vende ilusiones de uso intensivo que nunca se cumplen. "
            "Esa caminadora? Perchero. Esa parrilla? 3 veces al ano. "
            "Ese paraguas de 50 lucas? Lo perdes en el primer bondi."
        )
    elif cost_per_use > 5000:
        lines.append(
            f"Posta: {name} te sale $ {cost_per_use:,.0f} por uso. "
            "No es barato ni caro: depende de cuantas veces "
            "realmente lo uses. Si son las que calculaste, "
            "esta bien. Si la mitad, te estafaste solo."
        )
    elif cost_per_use > 500:
        lines.append(
            f"Posta: {name} te sale $ {cost_per_use:,.0f} por uso. "
            "Es razonable. Si es algo que usas seguido, "
            "es una buena compra. Si es algo que compraste "
            "y usaste 2 veces, es carisimo sin importar "
            "el precio. La relacion precio/uso es la unica "
            "forma honesta de medir el valor de las cosas."
        )
    else:
        lines.append(
            f"Posta: Menos de 500 pesos por uso. Eso es regalado. "
            "O es algo que usas todos los dias (zapatillas, "
            "mates, sarten) o pagaste 2 mangos. En cualquier "
            "caso, bien ahi. La clase trabajadora sabe que "
            "lo barato sale caro, pero lo caro bien usado "
            "es barato. La paradoja del consumo."
        )

    if alt_price is not None:
        lines.append("")
        if pct_diff > 50:
            lines.append(
                "Consejo de clase: la alternativa cuesta mucho menos "
                "por uso. Si la calidad no es critica, compra la "
                "alternativa. El resto de la diferencia metela "
                "en un plazo fijo o en un asado."
            )
        elif pct_diff < -50:
            lines.append(
                "Consejo de clase: vale la pena pagar mas por la "
                "calidad si realmente vas a usar las veces que "
                "calculaste. Sino, es alarde. La clase media "
                "compra marca, la clase obrera compra durabilidad, "
                "la clase alta compra lo que quiere."
            )
        else:
            lines.append(
                "Consejo de clase: la diferencia no es enorme. "
                "Compra el que te haga mas feliz, total la "
                "diferencia por uso no justifica el mal Trago."
            )

    return "\n".join(lines)
