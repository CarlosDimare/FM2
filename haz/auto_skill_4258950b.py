import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: precio1:cantidad1:unidad1 precio2:cantidad2:unidad2 ...\n"
            "Compara precios de productos por unidad de medida.\n"
            "Muestra precio por kg, litro, o unidad, y cual es mas barato.\n"
            "Unidades: kg, g, l, ml, un, docena\n"
            "Ej: 15000:1:kg 8000:500:g (compara kilo vs medio kilo)\n"
            "Ej: 12000:1:l 7000:500:ml 4500:250:ml\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: necesitas al menos 2 productos para comparar."

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

    def to_base_unit(amount, unit):
        unit = unit.lower()
        if unit in ("kg", "kilo", "kilos"):
            return amount, "kg", 1
        elif unit in ("g", "gr", "gramo", "gramos"):
            return amount / 1000, "kg", 1000
        elif unit in ("l", "lt", "litro", "litros"):
            return amount, "l", 1
        elif unit in ("ml", "mililitro", "mililitros"):
            return amount / 1000, "l", 1000
        elif unit in ("un", "unidad", "unidades"):
            return amount, "un", 1
        elif unit in ("doc", "docena", "docenas"):
            return amount * 12, "un", 12
        else:
            return amount, unit, 1

    unit_labels = {"kg": "kg", "l": "l", "un": "unidad"}

    products = []
    errors = []
    for p in parts:
        sub = p.split(":")
        if len(sub) >= 3:
            try:
                price = parse_num(sub[0])
                qty = float(sub[1])
                unit = sub[2].lower()
                base_qty, base_unit, factor = to_base_unit(qty, unit)
                if base_qty > 0:
                    price_per_unit = price / base_qty
                    products.append((sub[0], qty, unit, base_qty, base_unit, price_per_unit, price))
            except ValueError:
                errors.append(p)

    if len(products) < 2:
        return "Error: no se pudieron comparar al menos 2 productos."

    products.sort(key=lambda x: x[5])

    best = products[0]
    worst = products[-1]
    diff_pct = ((worst[5] - best[5]) / best[5]) * 100 if best[5] > 0 else 0

    lines = []
    lines.append(f"COMPARADOR DE PRECIOS POR UNIDAD")
    lines.append("---")
    lines.append(f"{'Producto':<20} {'Precio':>10} {'Cant':>8} {'Unidad':>8}  {'Precio/':>10}")
    lines.append(f"{'':<20} {'':>10} {'':>8} {'':>8}  {'{}/{}'.format('$/':>9, best[4]):>10}")
    lines.append("-" * 60)
    for idx, prod in enumerate(products):
        label = str(prod[0]) + ":" + str(prod[1]) + prod[2]
        label = label[:20]
        lines.append(
            f"{idx+1}. {label:<17} $ {prod[6]:>7,.0f}  {prod[1]:>5.1f}  {prod[2]:>5}  "
            f"$ {prod[5]:>7,.0f}"
        )
    lines.append("-" * 60)
    lines.append("")
    lines.append(f"MENOS PRECIO POR {best[4].upper()}: Producto {products.index(best)+1}")
    lines.append(f"  $ {best[5]:,.0f} por {best[4]}")
    lines.append("")
    lines.append(f"MAS CARO POR {worst[4].upper()}: Producto {products.index(worst)+1}")
    lines.append(f"  $ {worst[5]:,.0f} por {worst[4]}")
    lines.append("")
    lines.append(f"DIFERENCIA: {diff_pct:.0f}% entre el mas caro y el mas barato")
    lines.append("")
    lines.append("AHORRO POR COMPRAR EL MAS BARATO:")
    savings_per_unit = worst[5] - best[5]
    lines.append(f"  Ahorras $ {savings_per_unit:,.0f} por {best[4]}")
    if best[1] > 0:
        savings_per_purchase = best[6] * (1 - best[5] / worst[5]) if worst[5] > 0 else 0
    else:
        savings_per_purchase = 0

    lines.append("")
    if diff_pct > 100:
        lines.append(
            f"Posta: El mas caro cuesta MAS DEL DOBLE que el mas barato "
            "por la misma cantidad. Esto es Argentina: el mismo producto "
            "puede costar el doble en un supermercado que en otro, o "
            "en un envase chico que en uno grande. Siempre revisa el "
            "precio por kg/litro, no el precio del envase. Las empresas "
            "cuentan con que no sepas hacer regla de tres simple."
        )
    elif diff_pct > 40:
        lines.append(
            f"Posta: Diferencia del {diff_pct:.0f}%. No es menor. "
            "El envase mas grande suele ser mas barato por unidad, "
            "pero no siempre: a veces el 'formato familiar' es "
            "una trampa de marketing. Leete las etiquetas, "
            "compara precios. La inflacion te obliga a ser "
            "matematico. Bienvenido a la clase media calculadora."
        )
    elif diff_pct > 10:
        lines.append(
            f"Posta: Diferencia del {diff_pct:.0f}%. No es enorme, "
            "pero en la canasta basica, cada punto cuenta. "
            "A fin de mes, comprar siempre el mas barato "
            "te puede ahorrar 20-30 lucas. No es un asado, "
            "pero son 2 cafes."
        )
    else:
        lines.append(
            f"Posta: Diferencia del {diff_pct:.0f}%. Es minima. "
            "Compra el que mas te guste o venga mas comodo. "
            "No vale la pena estresarse por centavos cuando "
            "el problema de fondo es que los sueldos no "
            "alcanzan para nada, ni para lo mas barato."
        )

    return "\n".join(lines)
