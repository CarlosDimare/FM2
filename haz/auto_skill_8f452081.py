import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual [gasto_regalos] [gasto_vacaciones] [gasto_fiestas] [gasto_extra]\n"
            "Calcula el presupuesto necesario para fin de ano.\n"
            "Incluye aguinaldo, regalos, vacaciones, fiestas.\n"
            "Muestra si alcanza, el deficit, y cuantos meses sin vacaciones cuesta.\n"
            "Ej: 2500000 150000 500000 200000 0\n"
            "Ej: USD 3000 500 1000 300 0\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 1:
        return "Error: falta el salario mensual."

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
        salary = parse_num(parts[offset])
    except ValueError:
        return "Error: no se pudo parsear el salario."

    regalos = 0
    vacaciones = 0
    fiestas = 0
    extra = 0

    if len(parts) >= offset + 2:
        regalos = parse_num(parts[offset + 1])
    if len(parts) >= offset + 3:
        vacaciones = parse_num(parts[offset + 2])
    if len(parts) >= offset + 4:
        fiestas = parse_num(parts[offset + 3])
    if len(parts) >= offset + 5:
        extra = parse_num(parts[offset + 4])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    aguinaldo = salary / 2

    total_gastos = regalos + vacaciones + fiestas + extra
    superavit = aguinaldo - total_gastos

    needs_extra_month = False
    extra_needed = 0
    if superavit < 0:
        needs_extra_month = True
        extra_needed = abs(superavit)
        months_to_pay = extra_needed / salary if salary > 0 else 0
    else:
        months_to_pay = 0

    pct_aguinaldo_gastos = (total_gastos / aguinaldo) * 100 if aguinaldo > 0 else 0

    lines = []
    lines.append(f"GASTOS DE FIN DE ANO")
    lines.append(f"Salario mensual: {c} {salary:,.0f}")
    lines.append(f"Aguinaldo (50%): {c} {aguinaldo:,.0f}")
    lines.append("---")
    lines.append("GASTOS ESTIMADOS:")
    lines.append(f"  Regalos:     {c} {regalos:,.0f}")
    lines.append(f"  Vacaciones:  {c} {vacaciones:,.0f}")
    lines.append(f"  Fiestas:     {c} {fiestas:,.0f}")
    lines.append(f"  Extras:      {c} {extra:,.0f}")
    lines.append(f"  Total:       {c} {total_gastos:,.0f}")
    lines.append("")
    lines.append(f"AGUINALDO vs GASTOS:")
    lines.append(f"  Te alcanza?  {'SI' if superavit >= 0 else 'NO'}")
    lines.append(f"  Superavit:   {c} {superavit:,.0f}")
    if superavit > 0:
        lines.append(f"  Te sobra {pct_aguinaldo_gastos:.0f}% del aguinaldo despues de gastos")
    else:
        lines.append(f"  Te faltan {c} {extra_needed:,.0f} ({abs(superavit)/aguinaldo*100:.0f}% del aguinaldo)")
        lines.append(f"  Eso equivale a {months_to_pay:.1f} meses de sueldo extra que necesitas")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Aguinaldo:   USD {aguinaldo/blue:,.0f}")
        lines.append(f"  Gastos:      USD {total_gastos/blue:,.0f}")
        lines.append(f"  Superavit:   USD {superavit/blue:,.0f}")

    lines.append("")
    if superavit < 0:
        deficit_pct = abs(superavit) / salary * 100
        lines.append(
            f"Posta: Te faltan {c} {extra_needed:,.0f} para llegar a fin de ano. "
            "Bienvenido al diciembre argentino: el mes donde el aguinaldo "
            "nunca alcanza y las tarjetas de credito explotan. Culpa a la "
            "inflacion, al gobierno anterior, al FMI, o a tu cuentita de "
            "Navidad que no hiciste. El dato: tu deficit de fin de ano "
            f"equivale al {deficit_pct:.0f}% de tu sueldo. Eso es plata "
            "que vas a poner en la tarjeta y pagar en cuotas hasta abril."
        )
    elif superavit < aguinaldo * 0.3:
        lines.append(
            f"Posta: Llegas justo. Te sobra {c} {superavit:,.0f} que es "
            "poco mas que para la cena de fin de ano y un brindis con "
            "sidra del chino. La clase media argentina en diciembre: "
            "el aguinaldo entra, los regalos salen, y el 2 de enero "
            "estas mas pobre que en noviembre. Pero feliz."
        )
    else:
        lines.append(
            f"Posta: Te sobra mas del 30% del aguinaldo. O sos muy "
            "austero, o no tenes hijos, o este calculo esta mal "
            "porque no incluiste los gastos imprevistos de diciembre "
            "(arreglos, ropa para las fiestas, el arbolito, el "
            "remedio de la abuela). Vuelve a intentarlo con numeros "
            "mas realistas. O festeja: sos parte del 10% que llega "
            "a fin de ano sin deberle nada a nadie."
        )

    if regalos > salary * 0.2:
        lines.append("")
        lines.append(
            "Tip: estas gastando mas del 20% de tu sueldo en regalos. "
            "El capitalismo te hizo creer que el amor se mide en "
            "presentes. No es asi. Un regalo hecho a mano, una "
            "carta, o pasar la tarde con alguien vale mas que "
            "cualquier cosa que compres en el shopping. Pero si "
            "igual vas a comprar, al menos que sea en cuotas sin "
            "interes."
        )

    return "\n".join(lines)
