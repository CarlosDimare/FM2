import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: dias_internacion tipo_cobertura [cirugia]\n"
            "Calcula el costo estimado de una internacion.\n"
            "Tipo cobertura: publico, obra_social, prepaga\n"
            "Muestra costo por dia, total, y comparacion entre\n"
            "coberturas. Incluye medicamentos y estudios.\n"
            "Ej: 5 obra_social 1\n"
            "Ej: 3 prepaga 0\n"
            "Ej: 10 publico 1"
        )

    parts = input_text.strip().split()
    if len(parts) < 2:
        return "Error: faltan parametros (dias cobertura [cirugia])."

    try:
        dias = int(float(parts[0]))
    except ValueError:
        return "Error: los dias deben ser un numero."

    tipo = parts[1].lower()
    if tipo not in ("publico", "obra_social", "prepaga"):
        return "Error: cobertura debe ser publico, obra_social o prepaga."

    cirugia = False
    if len(parts) >= 3:
        try:
            cirugia = int(parts[2]) == 1
        except ValueError:
            cirugia = parts[2].lower() in ("si", "s", "true")

    costos_por_dia = {
        "publico": 0,
        "obra_social": 180000,
        "prepaga": 350000,
    }

    costo_dia_medicamentos = 45000
    costo_dia_estudios = 35000
    costo_dia_comida = 15000

    costo_base_dia = costos_por_dia.get(tipo, 0)
    costo_dia_real = costo_base_dia + costo_dia_medicamentos + costo_dia_estudios + costo_dia_comida

    if cirugia:
        if tipo == "publico":
            costo_cirugia = 0
        elif tipo == "obra_social":
            costo_cirugia = 500000
        else:
            costo_cirugia = 1500000
    else:
        costo_cirugia = 0

    total_internacion = costo_dia_real * dias
    total_con_cirugia = total_internacion + costo_cirugia

    internacion_obra = (costos_por_dia["obra_social"] + costo_dia_medicamentos + costo_dia_estudios + costo_dia_comida) * dias
    internacion_prepaga = (costos_por_dia["prepaga"] + costo_dia_medicamentos + costo_dia_estudios + costo_dia_comida) * dias

    ahorro_obra_vs_prepaga = internacion_prepaga - internacion_obra
    ahorro_publico_vs_obra = internacion_obra

    costo_mensual_prepaga = 75000
    meses_premio = internacion_obra / costo_mensual_prepaga if costo_mensual_prepaga > 0 else 0

    lines = []
    lines.append("COSTO DE INTERNACION")
    lines.append(f"Dias: {dias}")
    lines.append(f"Cobertura: {tipo}")
    lines.append(f"Cirugia: {'Si' if cirugia else 'No'}")
    lines.append("---")
    lines.append("COSTOS POR DIA:")
    lines.append(f"  Habitacion:     $ {costo_base_dia:,.0f}")
    lines.append(f"  Medicamentos:   $ {costo_dia_medicamentos:,.0f}")
    lines.append(f"  Estudios:       $ {costo_dia_estudios:,.0f}")
    lines.append(f"  Comida:         $ {costo_dia_comida:,.0f}")
    lines.append(f"  TOTAL POR DIA:  $ {costo_dia_real:,.0f}")
    lines.append("")
    lines.append(f"COSTO TOTAL INTERNACION: $ {total_internacion:,.0f}")
    if cirugia:
        lines.append(f"  Cirugia:              $ {costo_cirugia:,.0f}")
    lines.append(f"  TOTAL:                $ {total_con_cirugia:,.0f}")
    lines.append("")
    lines.append("COMPARACION CON OTRAS COBERTURAS:")
    lines.append(f"  Si tuvieras prepaga:   $ {internacion_prepaga:,.0f}")
    lines.append(f"  Si tuvieras obra soc.: $ {internacion_obra:,.0f}")
    lines.append(f"  Si fuera publico:      $ 0")
    lines.append("")
    lines.append("DIFERENCIA:")
    if tipo == "publico":
        lines.append(f"  Te ahorraste $ {internacion_prepaga:,.0f} contra prepaga")
        lines.append(f"  Te ahorraste $ {internacion_obra:,.0f} contra obra social")
        lines.append(f"  El sistema publico te cubrio TODO.")
        lines.append(f"  No olvides que lo pagas con impuestos.")
    elif tipo == "obra_social":
        lines.append(f"  Te ahorraste $ {ahorro_obra_vs_prepaga:,.0f} contra prepaga")
        lines.append(f"  La obra social te cubrio $ {internacion_obra:,.0f}")
        lines.append(f"  Eso equivale a {meses_premio:.0f} meses de cuota de prepaga")
    else:
        lines.append(f"  Pagaste $ {internacion_prepaga:,.0f} que la obra social hubiera")
        lines.append(f"  cubierto por $ {internacion_obra:,.0f}")
        lines.append(f"  Diferencia: $ {ahorro_obra_vs_prepaga:,.0f}")

    lines.append("")
    if tipo == "publico":
        lines.append(
            "Posta: El hospital publico te salvo. En Argentina, "
            "la salud publica es gratuita en el punto de atencion, "
            "lo que significa que no pagas cuando estas internado "
            "pero ya pagaste con impuestos toda tu vida. El "
            "problema no es la atencion: es la espera. En un "
            "hospital publico podes esperar horas para una "
            "consulta. Pero cuando estas grave, te atienden "
            "igual que al que paga prepaga. Excepto que "
            "la comida es peor y compartis habitacion."
        )
    elif tipo == "obra_social":
        lines.append(
            "Posta: La obra social te cubrio una internacion "
            f"de $ {internacion_obra:,.0f}. Esto es lo que pagas "
            "con tus aportes del 3% del sueldo. La pregunta: "
            "¿cuanto pagaste de obra social en toda tu vida "
            "vs cuanto usaste? La mayoria paga mas de lo que "
            "usa. Pero el dia que la necesitas, te alegras "
            "de tenerla. La obra social es el seguro de la "
            "clase trabajadora: pagas siempre, usas poco, "
            "y esperas no necesitarla nunca."
        )
    else:
        lines.append(
            "Posta: La prepaga te cubrio pero te costo "
            f"$ {internacion_prepaga:,.0f} (que no pagas porque "
            "es tu cuota, pero la cuota la pagas todos los "
            "meses llueva o truene). La prepaga es la "
            "mercantilizacion de la salud: pagas mas para "
            "esperar menos. No es mejor atencion, es menor "
            "espera. La salud privada en Argentina es la "
            "clase media pagando para no cruzarse con la "
            "clase baja en la sala de espera."
        )

    return "\n".join(lines)
