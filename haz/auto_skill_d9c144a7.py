import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual invitados costo_por_invitado [vestido] [fotografo] [musica] [otros]\n"
            "Calcula el costo total de un casamiento y cuantos meses de\n"
            "salario representa. Incluye desglose por item.\n"
            "Ej: 2500000 100 25000 500000 300000 200000 200000\n"
            "Ej: USD 3000 80 80 1500 1000 800 500\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 3:
        return "Error: faltan parametros (salario invitados costo_por_invitado [vestido] [foto] [musica] [otros])."

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
        guests = int(float(parts[offset + 1]))
        cost_per_guest = parse_num(parts[offset + 2])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    c = "USD" if is_usd else "ARS"
    blue = 1400

    vestido = 0
    fotografo = 0
    musica = 0
    otros = 0

    if len(parts) >= offset + 4:
        vestido = parse_num(parts[offset + 3])
    if len(parts) >= offset + 5:
        fotografo = parse_num(parts[offset + 4])
    if len(parts) >= offset + 6:
        musica = parse_num(parts[offset + 5])
    if len(parts) >= offset + 7:
        otros = parse_num(parts[offset + 6])

    costo_comida = guests * cost_per_guest
    costo_adicional = vestido + fotografo + musica + otros
    total = costo_comida + costo_adicional

    meses_salario = total / salary if salary > 0 else 0
    pct_salario = (total / salary / 12 * 100) if salary > 0 else 0

    ahorro_mensual = salary * 0.1
    meses_ahorro = total / ahorro_mensual if ahorro_mensual > 0 else 0

    equivalencias = [
        ("alquiler", "mes"),
        ("cuota de credito", "mes"),
        ("canasta basica", "mes"),
        ("viaje a Europa", "unidad"),
    ]

    lines = []
    lines.append(f"COSTO DE UN CASAMIENTO")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append(f"Invitados: {guests}")
    lines.append(c + " " + "-" * 40)
    lines.append("DESGLOSE:")
    lines.append(f"  Comida y salon ({guests} pers x {c} {cost_per_guest:,.0f}):")
    lines.append(f"    {c} {costo_comida:,.0f}")
    lines.append(f"  Vestido/anillos: {c} {vestido:,.0f}")
    lines.append(f"  Fotografo/video:  {c} {fotografo:,.0f}")
    lines.append(f"  Musica/DJ:        {c} {musica:,.0f}")
    lines.append(f"  Otros:            {c} {otros:,.0f}")
    lines.append("  " + "-" * 35)
    lines.append(f"  COSTO TOTAL:      {c} {total:,.0f}")
    lines.append("")
    lines.append(f"EN TERMINOS DE TRABAJO:")
    lines.append(f"  El casamiento cuesta {meses_salario:.1f} meses de tu salario")
    lines.append(f"  = {pct_salario:.1f}% de tu salario anual")
    lines.append("")
    lines.append(f"SI AHORRAS EL 10% DE TU SUELDO:")
    lines.append(f"  Necesitas {meses_ahorro:.0f} meses de ahorro")
    lines.append(f"  = {meses_ahorro/12:.1f} anios")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Total casamiento: USD {total/blue:,.0f}")
        lines.append(f"  Por invitado:     USD {(total/guests)/blue:,.0f}")

    lines.append("")
    if meses_salario > 12:
        lines.append(
            f"Posta: El casamiento te cuesta MAS DE UN ANIO de sueldo. "
            "Bienvenido al negocio del amor en Argentina. La industria "
            "del casamiento te vende que 'es el dia mas importante de "
            "tu vida' y te cobra como si lo fuera. El costo promedio "
            "de un casamiento en Argentina es de 8 a 15 millones de "
            "pesos para 100 invitados. O sea: una entrada para un "
            "departamento. O un auto 0km. Pero bueno, el amor no "
            "entiende de presupuesto, dice el que vende el servicio."
        )
    elif meses_salario > 4:
        lines.append(
            f"Posta: De 4 a 12 meses de sueldo. Estas en el promedio "
            "argentino. No es barato pero tampoco es la locura de "
            "los que gastan un sueldo anual. Tip: reduce invitados. "
            "Cada invitado que no invitas son {c} {cost_per_guest:,.0f} "
            "que te ahorras. Y probablemente ni los conoces a todos. "
            "El casamiento es de los novios, no del tercer primo "
            "de la tia que no ves desde 2019."
        )
    elif meses_salario > 1:
        lines.append(
            f"Posta: Entre 1 y 4 meses de sueldo. Estas siendo "
            "razonable. No es un gasto menor pero esta dentro de "
            "lo que se puede ahorrar en un plazo razonable. "
            "Si ademas los invitados ponen regalo en sobre, "
            "capaz hasta recuperas parte. El casamiento es el "
            "unico evento donde podes hacer una fiesta de 100 "
            "personas y que los invitados te la paguen (parcialmente)."
        )
    else:
        lines.append(
            f"Posta: Menos de un mes de sueldo. O te casas en el "
            "registro civil con 10 personas, o tenes un sueldo "
            "muy alto, o estas haciendo un calculo muy optimista. "
            "En cualquier caso: bien ahi. El amor no necesita "
            "300 invitados ni 15 lucas de vestido. O si?"
        )

    if guests > 150:
        lines.append("")
        lines.append(
            "Tip: Mas de 150 invitados es un acto politico, no una "
            "fiesta. Vas a saludar 150 veces, no vas a hablar con "
            "nadie mas de 2 minutos, y te vas a quedar sin plata "
            "antes de la torta. Reduce a 80-100. Tu bolsillo te "
            "lo va a agradecer."
        )

    return "\n".join(lines)
