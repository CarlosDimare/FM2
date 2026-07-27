import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: actividad1:horas_dia actividad2:horas_dia ...\n"
            "Calcula cuanto tiempo de tu vida gastas en cada actividad.\n"
            "Muestra horas por dia, mes, ano, y total en 80 anios de vida.\n"
            "Ej: dormir:8 laburar:9 viajar:2 tele:3 redes:2\n"
            "Ej: trabajar:8 gym:1 leer:1 cocinar:1.5"
        )

    parts = input_text.strip().split()
    if not parts:
        return "Error: no se ingresaron actividades. Formato: actividad:horas actividad:horas ..."

    activities = []
    total_hours = 0
    for p in parts:
        if ":" in p:
            name, hours_str = p.split(":", 1)
            try:
                hours = float(hours_str)
                activities.append((name, hours))
                total_hours += hours
            except ValueError:
                pass

    if not activities:
        return "Error: no se reconocieron actividades. Formato: actividad:horas"

    life_years = 80
    life_hours = life_years * 365 * 24
    day_hours = 24

    lines = []
    lines.append("DONDE SE TE VA LA VIDA")
    lines.append(f"Total de actividades registradas: {total_hours:.1f} h/dia")
    if total_hours > day_hours:
        lines.append("  (sumas mas de 24h - revisa tus numeros)")
    elif total_hours < day_hours:
        diff = day_hours - total_hours
        lines.append(f"  (quedan {diff:.1f} h/dia sin registrar)")
    lines.append("---")
    lines.append("ACTIVIDAD     h/dia   h/mes    h/ano    en 80 anios  % de vida")
    lines.append("-" * 70)

    for name, hours in sorted(activities, key=lambda x: -x[1]):
        per_month = hours * 30
        per_year = hours * 365
        per_life = per_year * life_years
        pct_life = (per_life / life_hours) * 100
        pct_day = (hours / day_hours) * 100
        lines.append(
            f"{name:<12} {hours:>5.1f}  {per_month:>7.0f}  {per_year:>7.0f}  "
            f"{per_life:>9.0f}  {pct_life:>5.1f}%"
        )

    lines.append("")
    lines.append("RESUMEN:")
    for name, hours in sorted(activities, key=lambda x: -x[1]):
        per_life_years = hours * 365 * life_years / (365 * 24)
        lines.append(f"  Pasas {per_life_years:.1f} anios de tu vida {name}")

    lines.append("")
    lines.append("PROYECCIONES:")
    for name, hours in sorted(activities, key=lambda x: -x[1]):
        per_life_years = hours * 365 * life_years / (365 * 24)
        if per_life_years >= 10:
            lines.append(
                f"  {per_life_years:.0f} anios {name}. "
                "Eso es MUCHO. Pensalo."
            )

    trabajos = [a for a in activities if a[0].lower() in ("laburar", "trabajar", "trabajo", "oficina", "trabajo")]
    suenio = [a for a in activities if a[0].lower() in ("dormir", "suenio", "siesta")]
    pantallas = [a for a in activities if a[0].lower() in ("tele", "tv", "netflix", "streaming", "redes", "celular", "instagram", "tiktok")]

    lines.append("")
    if trabajos:
        t_name, t_hours = trabajos[0]
        t_life = t_hours * 365 * life_years / (365 * 24)
        lines.append(
            f"Posta: {t_life:.0f} anios laburando. Un tercio de tu vida "
            "yendo a que otro se haga rico con tu esfuerzo. "
            "El capitalismo te promete jubilacion a los 65. "
            "La realidad te dice que a los 60 ya estas fundido "
            "o te echaron por 'reestructuracion'. Si sumas "
            "el tiempo de viaje, son {:.0f} anios mas. ".format(
                t_hours * 365 * life_years / (365 * 24) * 0.2 if False else 0
            )
        )

    if suenio:
        s_name, s_hours = suenio[0]
        s_life = s_hours * 365 * life_years / (365 * 24)
        lines.append(
            f"Posta: {s_life:.0f} anios durmiendo. Es el unico momento "
            "del dia en que el patron no te explota, el Estado no "
            "te cobra impuestos y las aplicaciones no te venden "
            "algo. El sueno es el ultimo refugio de la clase "
            "trabajadora. Y cada vez dormimos menos."
        )

    if pantallas:
        total_pantalla = sum(h for _, h in pantallas)
        p_life = total_pantalla * 365 * life_years / (365 * 24)
        lines.append(
            f"Posta: {p_life:.0f} anios mirando pantallas. Eso es "
            "mas tiempo del que pasas con tu familia, tus amigos "
            "y tu pareja combinados. Las redes sociales no son "
            "gratis: las pagas con tu atencion, tu tiempo y tu "
            "salud mental. Pero segui scrolleando, que el "
            "algoritmo te quiere entretenido mientras el mundo "
            "se quema."
        )

    return "\n".join(lines)
