import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: monto_cuenta propina_pct comensales\n"
            "Calcula cuanto pagar con propina y dividir la cuenta.\n"
            "Muestra propina, total, por persona, y equivalencias.\n"
            "Ej: 85000 10 4\n"
            "Ej: USD 100 15 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (monto propina_pct comensales)."

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
        monto = parse_num(parts[offset])
        propina_pct = float(parts[offset + 1])
        personas = int(float(parts[offset + 2]))
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"
    blue = 1400

    propina = monto * (propina_pct / 100)
    total = monto + propina
    por_persona = total / personas if personas > 0 else 0
    propina_por_persona = propina / personas if personas > 0 else 0

    equivalencias_tip = [
        ("cafe", 3500),
        ("viaje bondi", 1200),
        ("cerveza", 4000),
        ("empanada", 1200),
    ]

    lines = []
    lines.append("CALCULADORA DE PROPINAS")
    lines.append(f"Monto:         {c} {monto:,.0f}")
    lines.append(f"Propina:       {propina_pct:.0f}%")
    lines.append(f"Comensales:    {personas}")
    lines.append("---")
    lines.append(f"Propina:       {c} {propina:,.0f}")
    lines.append(f"Total:         {c} {total:,.0f}")
    lines.append(f"Por persona:   {c} {por_persona:,.0f}")
    lines.append(f"  (incluye {c} {propina_por_persona:,.0f} de propina c/u)")
    lines.append("")
    lines.append("OTROS PORCENTAJES:")
    for pct in [10, 12, 15, 18, 20, 25]:
        p = monto * (pct / 100)
        t = monto + p
        pp = t / personas if personas > 0 else 0
        lines.append(f"  {pct:.0f}% -> propina {c} {p:,.0f} -> total {c} {t:,.0f} -> {c} {pp:,.0f} c/u")
    lines.append("")
    lines.append("LA PROPINA EQUIVALE A:")
    for item, cost in equivalencias_tip:
        cant = propina / cost
        if cant >= 1:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Total:    USD {total/blue:,.0f}")
        lines.append(f"  Propina:  USD {propina/blue:,.0f}")
        lines.append(f"  Por pers: USD {por_persona/blue:,.0f}")

    lines.append("")
    if propina_pct < 10:
        lines.append(
            f"Posta: {propina_pct:.0f}% de propina. Bajo para el estandar "
            "de los mozos. En Argentina la propina no es obligatoria "
            "pero es parte del ingreso del personal porque los sueldos "
            "de gastronomia son bajisimos. Basicamente el dueño del "
            "resto te cobra a VOS el sueldo del mozo, no el precio "
            "del menu. Es la externalizacion del salario: el "
            "cliente paga lo que el empleador no quiere pagar."
        )
    elif propina_pct < 15:
        lines.append(
            f"Posta: {propina_pct:.0f}% de propina. Estandar argentino. "
            "Ni generoso ni rata. En USA es 15-20% obligatorio, aca "
            "se agradece. La propina es un impuesto voluntario a la "
            "culpa de clase media: sabes que el mozo cobra dos "
            "mangos, y dejas propina para sentir que no sos "
            "parte del problema. Pero seguis siendo parte."
        )
    else:
        lines.append(
            f"Posta: {propina_pct:.0f}% de propina. SOS UN REY. "
            "O querias chamuyarte al mozo/a. En cualquier caso: "
            "bien ahi. La propina generosa es el unico acto "
            "redistributivo directo que existe en el capitalismo: "
            "plata que va del cliente al laburante sin pasar "
            "por el dueño (bueno, parte se la queda el dueño "
            "si juntan propinas)."
        )

    return "\n".join(lines)
