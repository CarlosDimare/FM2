import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone el precio del producto y la cantidad. Ej: 'yerba $5000 1kg' o 'cerveza $3000 473ml'"

    m_precio = re.search(r"(?:\$)?\s*(\d+(?:[.,]\d+)?)\s*(k|mil|m|millones)?", t, re.IGNORECASE)
    m_cantidad = re.search(r"(\d+(?:[.,]\d+)?)\s*(kg|g|ml|l|litro|litros|unidad|unidades|u)", t, re.IGNORECASE)

    if not m_precio or not m_cantidad:
        return "No entendi. Pone algo como 'yerba $5000 1kg' o 'cerveza $3000 473ml'"

    precio = float(m_precio.group(1).replace(",", ""))
    s = (m_precio.group(2) or "").lower().strip()
    if s in ("k", "mil"):
        precio *= 1_000
    elif s in ("m", "millones"):
        precio *= 1_000_000

    cantidad = float(m_cantidad.group(1).replace(",", "."))
    unidad = m_cantidad.group(2).lower()

    # Normalize to kg or liter
    if unidad in ("g",):
        cantidad_kg = cantidad / 1000
        precio_kg = precio / cantidad_kg
        precio_unidad = precio / cantidad
        lines = [
            "=== PRECIO POR UNIDAD ===",
            "Precio: $ {:,.0f} por {:.0f}g".format(precio, cantidad),
            "",
            "$ {:,.0f}/kg".format(precio_kg),
            "$ {:,.0f}/g".format(precio_unidad),
        ]
    elif unidad in ("ml",):
        cantidad_l = cantidad / 1000
        precio_l = precio / cantidad_l
        lines = [
            "=== PRECIO POR UNIDAD ===",
            "Precio: $ {:,.0f} por {:.0f}ml".format(precio, cantidad),
            "",
            "$ {:,.0f}/litro".format(precio_l),
        ]
    elif unidad in ("kg",):
        precio_kg = precio / cantidad
        precio_g = precio / (cantidad * 1000)
        lines = [
            "=== PRECIO POR UNIDAD ===",
            "Precio: $ {:,.0f} por {:.0f}kg".format(precio, cantidad),
            "",
            "$ {:,.0f}/kg".format(precio_kg),
            "$ {:,.0f}/g".format(precio_g),
        ]
    elif unidad in ("l", "litro", "litros"):
        precio_l = precio / cantidad
        lines = [
            "=== PRECIO POR UNIDAD ===",
            "Precio: $ {:,.0f} por {:.0f}l".format(precio, cantidad),
            "",
            "$ {:,.0f}/litro".format(precio_l),
        ]
    else:
        precio_u = precio / cantidad
        lines = [
            "=== PRECIO POR UNIDAD ===",
            "Precio: $ {:,.0f} por {:.0f} unidad(es)".format(precio, cantidad),
            "",
            "$ {:,.0f}/unidad".format(precio_u),
        ]

    return "\n".join(lines)
