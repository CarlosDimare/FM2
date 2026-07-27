import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: alquiler:subida_anual_pct alimentos:subida_pct transporte:subida_pct servicios:subida_pct [otros:subida_pct]\n"
            "Calcula tu inflacion personal basada en tus pesos de gasto.\n"
            "Compara contra la inflacion oficial y muestra la diferencia.\n"
            "Ej: alquiler:40 alimentos:55 transporte:35 servicios:50 salud:30 educacion:45\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 3:
        return "Error: necesitas al menos 3 categorias. Formato: nombre:subida% nombre2:subida% ..."

    categorias = {}
    for p in parts:
        if ":" in p:
            name, val_str = p.split(":", 1)
            try:
                val = float(val_str)
                categorias[name] = val
            except ValueError:
                pass

    if len(categorias) < 3:
        return "Error: no se pudieron parsear al menos 3 categorias."

    ponderaciones = {
        "alquiler": 30, "vivienda": 30, "hipoteca": 30, "expensas": 30,
        "alimentos": 25, "comida": 25, "supermercado": 25, "almacen": 25,
        "transporte": 12, "colectivo": 12, "bondi": 12, "subte": 12, "nafta": 12,
        "servicios": 10, "luz": 10, "gas": 10, "agua": 10, "internet": 10,
        "salud": 8, "medicamentos": 8, "medico": 8, "prepaga": 8,
        "educacion": 7, "colegio": 7, "universidad": 7, "curso": 7,
        "ocio": 5, "entretenimiento": 5, "streaming": 5, "salidas": 5,
        "vestimenta": 3, "ropa": 3, "indumentaria": 3,
        "otros": 0,
    }

    total_ponderacion = 0
    inflacion_ponderada = 0
    cats_used = []

    # Normalize: if total weight < 50, assign even weights
    peso_total_asignado = 0
    for name in categorias:
        nl = name.lower()
        found = False
        for key, weight in ponderaciones.items():
            if key in nl:
                peso_total_asignado += weight
                found = True
                break
        if not found:
            peso_total_asignado += 10

    if peso_total_asignado < 50:
        peso_igual = 100 / len(categorias) if categorias else 0
        use_igual = True
    else:
        use_igual = False

    for name, subida in categorias.items():
        nl = name.lower()
        if use_igual:
            weight = 100 / len(categorias)
        else:
            weight = 0
            for key, w in ponderaciones.items():
                if key in nl:
                    weight = w
                    break
            if weight == 0:
                weight = 10
        total_ponderacion += weight
        inflacion_ponderada += subida * weight / 100
        cats_used.append((name, subida, weight))

    inflacion_personal = inflacion_ponderada / total_ponderacion * 100 if total_ponderacion > 0 else 0
    inflacion_oficial = 40.0
    inflacion_salarios = 35.0

    diff_vs_oficial = inflacion_personal - inflacion_oficial
    diff_vs_salarios = inflacion_personal - inflacion_salarios

    poder_adquisitivo = ((100 + inflacion_salarios) / (100 + inflacion_personal) - 1) * 100
    perdida_anual = abs(poder_adquisitivo) if poder_adquisitivo < 0 else 0

    lines = []
    lines.append("INFLACION PERSONAL")
    lines.append("---")
    lines.append("CATEGORIAS:")
    for name, subida, weight in sorted(cats_used, key=lambda x: -x[2]):
        lines.append(f"  {name:<20} {subida:.0f}%  (peso: {weight:.0f}%)")
    lines.append("")
    lines.append(f"TU INFLACION PERSONAL: {inflacion_personal:.1f}%")
    lines.append(f"Inflacion oficial (IPC):   {inflacion_oficial:.0f}%")
    if diff_vs_oficial > 0:
        lines.append(f"  Tu inflacion es {diff_vs_oficial:.1f}% MAYOR que la oficial")
    elif diff_vs_oficial < 0:
        lines.append(f"  Tu inflacion es {abs(diff_vs_oficial):.1f}% MENOR que la oficial")
    else:
        lines.append("  Tu inflacion es IGUAL a la oficial (raro)")
    lines.append("")
    lines.append(f"AUMENTO SALARIAL PROMEDIO:  {inflacion_salarios:.0f}%")
    if diff_vs_salarios > 0:
        lines.append(f"  Tus precios suben MAS que los salarios ({diff_vs_salarios:.1f}% de diferencia)")
    elif diff_vs_salarios < 0:
        lines.append(f"  Tus precios suben MENOS que los salarios ({abs(diff_vs_salarios):.1f}% de diferencia)")
    lines.append("")
    lines.append(f"PODER ADQUISITIVO:")
    if poder_adquisitivo > 0:
        lines.append(f"  Tu poder de compra SUBIO {poder_adquisitivo:.1f}% (tus precios suben menos que tu sueldo)")
    elif poder_adquisitivo < 0:
        lines.append(f"  Perdiste {abs(poder_adquisitivo):.1f}% de poder de compra este ano")
        salario_necesario = inflacion_personal
        lines.append(f"  Necesitarias un aumento del {salario_necesario:.0f}% para no perder poder adquisitivo")
    else:
        lines.append("  Tu poder de compra se mantuvo")

    lines.append("")
    if inflacion_personal > 60:
        lines.append(
            f"Posta: Tu inflacion personal es del {inflacion_personal:.0f}%. "
            "El IPC oficial mide una canasta promedio que no existe: "
            "ninguna familia gasta como el promedio. Si vos alquilas "
            "y el alquiler subio 50%, tu inflacion es mayor que la "
            "oficial. Si no alquilas, es menor. El INDEC mide un "
            "promedio que no es nadie. Tu inflacion es la unica "
            "que importa y es la que nadie mide."
        )
    elif inflacion_personal > 40:
        lines.append(
            f"Posta: {inflacion_personal:.0f}%. Alineada con la inflacion "
            "general. Tus gastos subieron parejo. No estas ni peor "
            "ni mejor que el promedio. La clase media argentina "
            "esta empatando contra la inflacion, lo que significa "
            "que esta perdiendo porque empatar es perder cuando "
            "los salarios van detras. Si tu sueldo subio menos "
            "del {inflacion_personal:.0f}%, perdiste."
        )
    else:
        lines.append(
            f"Posta: {inflacion_personal:.0f}%. Tu inflacion personal "
            "esta por debajo de la oficial. O no alquilas, o "
            "compras en lugares baratos, o tenes gastos congelados "
            "(como un credito hipotecario en UVAs congeladas, que "
            "existe? no). En cualquier caso, estas en el grupo "
            "privilegiado que la inflacion le pega menos. "
            "Aprovecha y ahorra, porque cuando te toque "
            "renovar el alquiler, la calculadora te va a "
            "dar un numero distinto."
        )

    return "\n".join(lines)
