import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: alquiler:valor servicios:valor comida:valor transporte:valor [educacion:valor] [salud:valor] [ocio:valor] [otros:valor]\n"
            "Analiza tus gastos fijos vs variables y muestra que\n"
            "porcentaje de tu ingreso es inamovible.\n"
            "Ej: alquiler:350000 servicios:45000 comida:150000 transporte:30000 educacion:80000 salud:50000 ocio:60000 otros:40000\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: no se ingresaron gastos. Formato: nombre:valor nombre2:valor2 ..."

    total = 0
    gastos = {}
    for p in parts:
        if ":" in p:
            name, val_str = p.split(":", 1)
            val_str = val_str.upper()
            mult = 1
            if "K" in val_str:
                mult = 1000
                val_str = val_str.replace("K", "")
            elif "M" in val_str:
                mult = 1_000_000
                val_str = val_str.replace("M", "")
            try:
                val = float(val_str) * mult
                gastos[name] = val
                total += val
            except ValueError:
                pass

    if not gastos:
        return "Error: no se pudieron parsear los gastos."

    fijos_keywords = ["alquiler", "servicios", "expensas", "colegio", "educacion", "cuota", "seguro", "suscripcion", "gimnasio", "internet", "telefono", "cable", "credito"]
    variables_keywords = ["comida", "transporte", "salud", "ocio", "ropa", "delivery", "salidas", "recreacion", "farmacia"]

    fijos = {}
    variables = {}
    semivariables = {}

    for name, val in gastos.items():
        nl = name.lower()
        if any(f in nl for f in fijos_keywords):
            fijos[name] = val
        elif any(v in nl for v in variables_keywords):
            variables[name] = val
        else:
            semivariables[name] = val

    total_fijos = sum(fijos.values())
    total_variables = sum(variables.values())
    total_semi = sum(semivariables.values())

    pct_fijos = (total_fijos / total) * 100 if total > 0 else 0
    pct_variables = (total_variables / total) * 100 if total > 0 else 0
    pct_semi = (total_semi / total) * 100 if total > 0 else 0

    lines = []
    lines.append("ANALISIS DE GASTOS - FIJOS vs VARIABLES")
    lines.append(f"Total gastos: $ {total:,.0f}")
    lines.append("---")
    lines.append("GASTOS FIJOS (no podes dejar de pagarlos):")
    for name, val in sorted(fijos.items(), key=lambda x: -x[1]):
        pct = (val / total) * 100 if total > 0 else 0
        lines.append(f"  {name:<20} $ {val:>10,.0f}  ({pct:.0f}%)")
    lines.append(f"  {'TOTAL FIJOS':<20} $ {total_fijos:>10,.0f}  ({pct_fijos:.0f}%)")
    lines.append("")
    lines.append("GASTOS VARIABLES (podes reducir):")
    for name, val in sorted(variables.items(), key=lambda x: -x[1]):
        pct = (val / total) * 100 if total > 0 else 0
        lines.append(f"  {name:<20} $ {val:>10,.0f}  ({pct:.0f}%)")
    lines.append(f"  {'TOTAL VARIABLES':<20} $ {total_variables:>10,.0f}  ({pct_variables:.0f}%)")
    lines.append("")
    if semivariables:
        lines.append("OTROS:")
        for name, val in sorted(semivariables.items(), key=lambda x: -x[1]):
            pct = (val / total) * 100 if total > 0 else 0
            lines.append(f"  {name:<20} $ {val:>10,.0f}  ({pct:.0f}%)")
        lines.append(f"  {'TOTAL OTROS':<20} $ {total_semi:>10,.0f}  ({pct_semi:.0f}%)")
    lines.append("")
    lines.append("RESUMEN:")
    lines.append(f"  Fijos:     {pct_fijos:.0f}%  (no negociable)")
    lines.append(f"  Variables: {pct_variables:.0f}%  (negociable)")
    lines.append(f"  Otros:     {pct_semi:.0f}%")

    ahorro_potencial = total_variables * 0.3 + total_semi * 0.2
    lines.append("")
    lines.append(f"AHORRO POTENCIAL (reduciendo 30% variables + 20% otros):")
    lines.append(f"  $ {ahorro_potencial:,.0f}/mes")
    lines.append(f"  $ {ahorro_potencial * 12:,.0f}/ano")

    lines.append("")
    if pct_fijos > 70:
        lines.append(
            f"Posta: El {pct_fijos:.0f}% de tus gastos son FIJOS. "
            "No podes hacer nada. Estas atrapado en la estructura "
            "de costos de la clase media argentina: alquiler, "
            "colegio, servicios, credito. Si perdes el trabajo, "
            "tenes 2 meses antes de que todo explote. La unica "
            "solucion es ganar mas plata o mudarte a un lugar "
            "mas barato. No hay ahorro que alcance cuando el "
            "70% ya esta comprometido antes de cobrar."
        )
    elif pct_fijos > 50:
        lines.append(
            f"Posta: {pct_fijos:.0f}% fijos. Estas en el promedio "
            "de la clase media. La mitad de tu sueldo ya se fue "
            "antes de que llegue. La buena noticia: tenes margen "
            "para ajustar variables si viene mal. La mala: si "
            "el alquiler sube 40% (como todos los anos), los "
            "fijos se te van al 70% y estas en la categoria "
            "de arriba. La clase media vive en el filo."
        )
    else:
        lines.append(
            f"Posta: {pct_fijos:.0f}% fijos. Tenes mucha flexibilidad "
            "financiera. O vivis en casa propia (sin alquiler) o "
            "tenes un sueldo alto o gastos variables bajos. En "
            "cualquier caso, estas mejor que el 80% de los "
            "argentinos. La pregunta es: ese ahorro potencial "
            "de $ {ahorro_potencial:,.0f}/mes, lo estas "
            "ahorrando o se va en mas variables?"
        )

    return "\n".join(lines)
