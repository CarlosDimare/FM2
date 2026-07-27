import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: objetivo_anual ahorro_mensual [rendimiento_anual_pct] [plazo_anios]\n"
            "Calcula cuanto necesitas ahorrar para alcanzar un objetivo.\n"
            "Modos:\n"
            "  Mensual + plazo -> total acumulado\n"
            "  Objetivo + plazo -> ahorro mensual necesario\n"
            "  Objetivo + mensual -> tiempo necesario\n"
            "Ej: 10000000 200000 10 5\n"
            "Ej: USD 50000 0 8 10 (0 ahorro = calcular cuanto necesitas)\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros."

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
        goal = parse_num(parts[offset])
        monthly = parse_num(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    annual_return = 8.0
    term_years = 10

    if len(parts) >= offset + 3:
        annual_return = float(parts[offset + 2])
    if len(parts) >= offset + 4:
        term_years = int(parse_num(parts[offset + 3])) if parts[offset + 3].upper().endswith("K") or parts[offset + 3].upper().endswith("M") else int(float(parts[offset + 3]))

    c = "USD" if is_usd else "ARS"
    monthly_rate = (annual_return / 100) / 12
    total_months = term_years * 12
    blue = 1400

    missing = goal - monthly * total_months

    if monthly_rate > 0:
        future_value = monthly * (((1 + monthly_rate) ** total_months - 1) / monthly_rate)
        needed_monthly = goal * monthly_rate / ((1 + monthly_rate) ** total_months - 1) if (1 + monthly_rate) ** total_months - 1 > 0 else 0
        months_needed = 0
        if monthly > 0:
            import math
            months_needed = math.ceil(math.log(1 + goal * monthly_rate / monthly) / math.log(1 + monthly_rate))
        else:
            months_needed = float("inf")
    else:
        future_value = monthly * total_months
        needed_monthly = goal / total_months if total_months > 0 else 0
        months_needed = int(goal / monthly) if monthly > 0 else float("inf")

    lines = []
    lines.append(f"AHORRO PARA OBJETIVO")
    lines.append(f"Objetivo: {c} {goal:,.0f}")
    lines.append(f"Ahorro mensual: {c} {monthly:,.0f}")
    lines.append(f"Rendimiento anual: {annual_return:.1f}%")
    lines.append(f"Plazo: {term_years} anios ({total_months} meses)")
    lines.append("---")
    lines.append(f"PROYECCION A {term_years} ANIOS:")
    lines.append(f"  Aportes totales: {c} {monthly * total_months:,.0f}")
    lines.append(f"  Intereses generados: {c} {max(0, future_value - monthly * total_months):,.0f}")
    lines.append(f"  Total acumulado: {c} {future_value:,.0f}")

    if future_value >= goal:
        lines.append(f"  Estado: CUMPLE objetivo (sobra {c} {future_value - goal:,.0f})")
    else:
        lines.append(f"  Estado: NO CUMPLE (faltan {c} {goal - future_value:,.0f})")

    lines.append("")
    if needed_monthly > 0 and monthly == 0:
        lines.append(f"AHORRO NECESARIO:")
        lines.append(f"  Para {c} {goal:,.0f} en {term_years} anios al {annual_return:.1f}%:")
        lines.append(f"  Necesitas ahorrar: {c} {needed_monthly:,.0f}/mes")
        if not is_usd:
            lines.append(f"  USD: {c} {needed_monthly/blue:,.0f}/mes")

    if months_needed < float("inf") and monthly > 0 and monthly * total_months < goal:
        years_needed = months_needed / 12
        lines.append("")
        lines.append(f"TIEMPO NECESARIO CON AHORRO ACTUAL:")
        lines.append(f"  {months_needed} meses ({years_needed:.1f} anios)")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Objetivo:    USD {goal/blue:,.0f}")
        lines.append(f"  Ahorro/mes:  USD {monthly/blue:,.0f}")
        lines.append(f"  Proyectado:  USD {future_value/blue:,.0f}")
        if needed_monthly > 0 and monthly == 0:
            lines.append(f"  Necesario:   USD {needed_monthly/blue:,.0f}/mes")

    lines.append("")
    if annual_return > 20:
        lines.append(
            "Posta: Rendimiento mayor al 20% anual. Eso no existe en "
            "instrumentos seguros. O estas proyectando con acciones, "
            "cripto, o un negocio propio. Cuidado: si suena demasiado "
            "bueno para ser verdad, es porque estas proyectando el "
            "mejor escenario posible y la realidad siempre pega."
        )
    elif annual_return > 8:
        lines.append(
            "Posta: Rendimiento del 8-20% anual. Posible en plazos fijos "
            "argentinos (TNA 40-60%) pero no en dolares. Si es en ARS, "
            "no te olvides de restarle inflacion. Un plazo fijo al 45% "
            "con inflacion al 40% te da un 5% real. No es magia, es "
            "matematica de la que duele."
        )
    elif annual_return > 3:
        lines.append(
            "Posta: Rendimiento del 3-8% anual. Tipico de instrumentos "
            "conservadores en USD (bonos, PF en USD, FCI de bajo riesgo). "
            "Es el ritmo de la tortuga: lento pero seguro. El problema "
            "es que con inflacion del 3% mensual en Argentina, el "
            "rendimiento real es negativo. Ahorrar en pesos no es "
            "ahorrar: es perder mas despacio."
        )
    else:
        lines.append(
            "Posta: Rendimiento menor al 3%. Basicamente estas guardando "
            "plata abajo del colchon. Con inflacion argentina, estas "
            "perdiendo poder adquisitivo todos los meses. Ahorrar sin "
            "rendimiento no es ahorrar, es acumular billetes que valen "
            "menos cada dia. La clase media argentina aprendio esto "
            "con sangre: el que ahorra en pesos, pierde."
        )

    if monthly == 0:
        pass
    elif monthly * total_months < goal:
        pass
    else:
        lines.append("")
        lines.append(
            "Posta: Estas ahorrando suficiente para cumplir el objetivo "
            "sin rendimiento. Eso es disciplina financiera. O no sabes "
            "cuanto vale la plata. En cualquiera de los dos casos, "
            "felicitaciones: estas en el 10% de la poblacion que puede "
            "ahorrar. El 90% restante llega justo a fin de mes."
        )

    return "\n".join(lines)
