import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: salario_mensual [feriados_argentinos]\n"
            "Calcula cuantos dias del ano trabajas realmente.\n"
            "Incluye fines de semana, feriados, vacaciones, licencias.\n"
            "Muestra dias laborales reales, costo por dia, y % del ano.\n"
            "Ej: 2500000\n"
            "Ej: USD 4000\n"
            "Ej: 2500000 15 (15 feriados)\n"
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

    feriados = 19
    if len(parts) >= offset + 2:
        try:
            feriados = int(float(parts[offset + 1]))
        except ValueError:
            pass

    c = "USD" if is_usd else "ARS"
    blue = 1400

    dias_ano = 365
    fines_semana = 104
    vacaciones = 14
    feriados_totales = feriados
    puentes = 3
    licencias = 5

    dias_no_laborales = fines_semana + vacaciones + feriados_totales + puentes + licencias
    dias_laborales = dias_ano - dias_no_laborales

    horas_dia = 8
    horas_anuales = dias_laborales * horas_dia
    horas_totales_ano = 365 * 24
    pct_ano_laboral = (dias_laborales / dias_ano) * 100
    pct_ano_total_horas = (horas_anuales / horas_totales_ano) * 100

    costo_por_dia_laboral = (salary * 12) / dias_laborales if dias_laborales > 0 else 0
    costo_por_hora = costo_por_dia_laboral / horas_dia if horas_dia > 0 else 0

    dias_descanso = dias_ano - dias_laborales
    pct_descanso = (dias_descanso / dias_ano) * 100

    lines = []
    lines.append(f"DIAS LABORALES REALES EN ARGENTINA")
    lines.append(f"Salario: {c} {salary:,.0f}")
    lines.append("---")
    lines.append("COMPOSICION DEL ANO:")
    lines.append(f"  Dias totales:            {dias_ano}")
    lines.append(f"  Fines de semana:         -{fines_semana}")
    lines.append(f"  Vacaciones:              -{vacaciones}")
    lines.append(f"  Feriados:                -{feriados_totales}")
    lines.append(f"  Puentes turisticos:      -{puentes}")
    lines.append(f"  Licencias (enfermedad):  -{licencias}")
    lines.append("  " + "-" * 30)
    lines.append(f"  Dias NO laborales:       {dias_no_laborales}")
    lines.append(f"  Dias laborales REALES:   {dias_laborales} ({pct_ano_laboral:.1f}% del ano)")
    lines.append("")
    lines.append(f"HORAS:")
    lines.append(f"  Horas laborales/ano: {horas_anuales}")
    lines.append(f"  Solo {pct_ano_total_horas:.1f}% del total de horas del ano")
    lines.append("")
    lines.append("COSTOS:")
    lines.append(f"  Salario anual:    {c} {salary * 12:,.0f}")
    lines.append(f"  Costo por dia:    {c} {costo_por_dia_laboral:,.0f}")
    lines.append(f"  Costo por hora:   {c} {costo_por_hora:,.0f}")
    lines.append("")
    lines.append(f"DIAS DE DESCANSO: {dias_descanso} ({pct_descanso:.1f}% del ano)")
    lines.append(f"  Ratio trabajo/descanso: 1:{dias_descanso/dias_laborales:.2f}")

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Costo por dia:  USD {costo_por_dia_laboral/blue:,.0f}")
        lines.append(f"  Costo por hora: USD {costo_por_hora/blue:,.0f}")

    lines.append("")
    if dias_laborales > 240:
        lines.append(
            f"Posta: Trabajas MAS DE 240 DIAS al ano. Sos un esclavo "
            "moderno con feriados. Argentina tiene muchos feriados "
            "pero labura casi 250 dias. Comparado con Francia (218) "
            "o Alemania (220), estas regalando un mes entero de "
            "laburo. Pero bueno, no tenemos sindicatos que peleen "
            "por menos horas, tenemos sindicatos que pelean por "
            "no perder los feriados que ya tenemos."
        )
    elif dias_laborales > 220:
        lines.append(
            f"Posta: Entre 220 y 240 dias laborales. El promedio "
            "argentino. Ni tan mal (gracias a los feriados) ni "
            "tan bien (porque laburas casi el 65% del ano). "
            "La ventaja es que Argentina tiene mas feriados que "
            "el promedio mundial. La desventaja es que laburas "
            "9 horas por dia para compensar."
        )
    elif dias_laborales > 200:
        lines.append(
            f"Posta: Entre 200 y 220 dias. Estas por debajo del "
            "promedio argentino. O tenes mucha antiguedad (mas "
            "vacaciones) o laburas en un lugar con dias "
            "adicionales. Disfrutalo, porque la mayoria de los "
            "laburantes argentinos te miran con envidia mientras "
            "hacen horas extra no remuneradas."
        )
    else:
        lines.append(
            f"Posta: Menos de 200 dias laborales. O sos funcionario "
            "publico de alto rango, o estas en un rubro con muchos "
            "beneficios, o laburas en negro y te tomas dias cuando "
            "quieres. En cualquiera de los casos, aprovecha que "
            "descansas mas del 45% del ano."
        )

    return "\n".join(lines)
