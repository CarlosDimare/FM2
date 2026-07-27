import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: peso_kg altura_cm edad [actividad]\n"
            "Calcula IMC, peso saludable, tasa metabolica, y calorias.\n"
            "Actividad: sedentario, ligero, moderado, activo, muy_activo\n"
            "Ej: 75 175 30 moderado\n"
            "Ej: 90 180 45 sedentario"
        )

    parts = input_text.strip().split()
    if len(parts) < 3:
        return "Error: faltan parametros (peso altura edad [actividad])."

    try:
        peso = float(parts[0])
        altura = float(parts[1])
        edad = float(parts[2])
    except ValueError:
        return "Error: no se pudieron parsear peso, altura o edad."

    actividad = "sedentario"
    if len(parts) >= 4:
        actividad = parts[3].lower()

    altura_m = altura / 100
    imc = peso / (altura_m ** 2) if altura_m > 0 else 0

    peso_min_salud = 18.5 * (altura_m ** 2)
    peso_max_salud = 24.9 * (altura_m ** 2)

    factor_actividad = {
        "sedentario": 1.2,
        "ligero": 1.375,
        "moderado": 1.55,
        "activo": 1.725,
        "muy_activo": 1.9,
    }.get(actividad, 1.2)

    tmb_hombre = 10 * peso + 6.25 * altura - 5 * edad + 5
    tmb_mujer = 10 * peso + 6.25 * altura - 5 * edad - 161

    calorias_hombre = tmb_hombre * factor_actividad
    calorias_mujer = tmb_mujer * factor_actividad

    if imc < 18.5:
        clasif = "bajo peso"
    elif imc < 25:
        clasif = "peso normal"
    elif imc < 30:
        clasif = "sobrepeso"
    elif imc < 35:
        clasif = "obesidad I"
    elif imc < 40:
        clasif = "obesidad II"
    else:
        clasif = "obesidad III"

    lines = []
    lines.append("INDICE DE MASA CORPORAL")
    lines.append(f"Peso: {peso:.0f} kg")
    lines.append(f"Altura: {altura:.0f} cm ({altura_m:.2f} m)")
    lines.append(f"Edad: {edad:.0f} anios")
    lines.append(f"Actividad: {actividad}")
    lines.append("---")
    lines.append(f"IMC: {imc:.1f}")
    lines.append(f"Clasificacion: {clasif}")
    lines.append("")
    lines.append("PESO SALUDABLE (IMC 18.5-24.9):")
    lines.append(f"  Minimo: {peso_min_salud:.0f} kg")
    lines.append(f"  Maximo: {peso_max_salud:.0f} kg")
    lines.append("")
    lines.append("TASA METABOLICA BASAL:")
    lines.append(f"  Hombre: {tmb_hombre:.0f} kcal/dia")
    lines.append(f"  Mujer:  {tmb_mujer:.0f} kcal/dia")
    lines.append("")
    lines.append(f"CALORIAS DIARIAS (con actividad {actividad}):")
    lines.append(f"  Hombre: {calorias_hombre:.0f} kcal/dia")
    lines.append(f"  Mujer:  {calorias_mujer:.0f} kcal/dia")
    lines.append("")
    lines.append("RANGO DE CALORIAS PARA MANTENER PESO:")
    lines.append(f"  {calorias_mujer:.0f} - {calorias_hombre:.0f} kcal/dia")

    dif = peso - peso_max_salud
    lines.append("")
    if dif > 20:
        lines.append(
            f"Posta: Estas {dif:.0f} kg por encima del peso maximo saludable. "
            "No es un juicio, es data. El sobrepeso en Argentina no es "
            "una eleccion individual: es el resultado de que la comida "
            "saludable es cara y la procesada es barata. Un kg de "
            "tomates cuesta lo mismo que 3 paquetes de fideos. La "
            "obesidad es una epidemia de clase: los ricos comen "
            "organico, los pobres comen harina. No es falta de "
            "voluntad, es falta de presupuesto."
        )
    elif dif > 5:
        lines.append(
            f"Posta: {dif:.0f} kg por encima del peso saludable. Estas "
            "en el rango donde la salud empieza a preocupar. Pero "
            "tranqui: el 60% de los argentinos esta igual. La "
            "comida sana es cara, el tiempo para hacer ejercicio "
            "es un lujo, y la publicidad te vende ultraprocesados "
            "24/7. No es solo culpa tuya: es el sistema."
        )
    elif dif < -10:
        lines.append(
            f"Posta: Estas {abs(dif):.0f} kg por debajo del peso minimo "
            "saludable. El bajo peso tambien es un problema de clase: "
            "no alcanza para llenar la heladera, o trabajas tanto "
            "que te olvidas de comer. O sos muy activo. En cualquier "
            "caso: cuidate."
        )
    else:
        lines.append(
            f"Posta: Estas en el rango de peso saludable. Felicitaciones. "
            "Sos parte de la minoria que no tiene problemas de peso. "
            "Seguramente tenes acceso a comida de calidad, tiempo "
            "para cocinar, y quizas hasta plata para un gimnasio. "
            "La salud no es solo genetica: es presupuesto."
        )

    return "\n".join(lines)
