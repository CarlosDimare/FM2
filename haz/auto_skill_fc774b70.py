import re

SIGNOS = [
    ("16|17|18|19|20.*h", 3, "Jornadas de 16+ horas con IA."),
    ("14|15.*h", 2, "Laburando 14+ horas. Tus ojos lloran sangre."),
    ("12.*h", 2, "12 horas y todavia respondes mails."),
    ("10.*h", 1, "10 horas. La cafeteria te conoce de nombre."),
    ("sabad.*trabaj|domingo.*trabaj|fds.*trabaj|fds.*labur|finde.*labur|finde.*trabaj|trabaj.*finde|trabaj.*sabad|domingo.*cod|sabad.*compu", 2, "Laboras los findes. El descanso es para debiles."),
    ("no.*duerm|insomnio|poco.*sue", 2, "No dormis bien. El codigo no es excusa."),
    ("no.*cort|sin.*paus|sin.*almuerz", 1, "No haces pausas. No sos un CI pipeline."),
    ("ansiedad|estres|estresado|quemado|burnout|no.*puedo.*mas", 3, "Burnout declarado. No es normal."),
    ("impostor|no.*sirvo|no.*valgo|fraude", 2, "Sindrome del impostor. No es tu culpa, es el sistema."),
    ("no.*vacacion|no.*salgo|encerrad", 1, "No te tomas vacaciones. El capitalismo te agradece."),
    ("siempre.*conectad|24/7|apag.*nunc", 2, "Siempre conectado. El descanso digital no existe."),
    ("comprime|asfixi|presion|urgencia", 1, "Presion constante. Sprint perpetuo."),
    ("llor|angusti|trist", 2, "Malestar emocional. No es debilidad, es agotamiento."),
    ("monotribut|factur.*mes|no.*aport|precarizad", 1, "Precarizacion laboral detectada. Eso cansa el alma."),
    ("ningun.*reconoc|no.*valor|invisibl", 1, "Falta de reconocimiento. No laburas para que no te vean."),
    ("no.*sue.*lo|no.*veo.*futur|sin.*sentid", 2, "Falta de proyeccion. El sinsentido quema."),
]

FACTORES_PROTECTORES = [
    ("sindica|convenio.*colectiv|paritari|gremio", "Tenes paritaria. Eso protege."),
    ("horario.*flexibl|horas.*ajust|jornada.*corta", "Tenemos flexibilidad. Bien ahi."),
    ("terap|psicolog|ayuda.*profesion|acompa", "Buscas ayuda. Eso es fortaleza."),
    ("deleg|no.*hago.*todo|equipo", "Delegas. Eso es sabiduria."),
    ("no.*trabaj.*finde|finde.*no|descans", "Respetas los limites. Bien."),
    ("habl.*jefe|convers.*manager|pido.*ayud", "Comunicas tus limites. Eso es clave."),
]

FRASES = [
    (0, "Estas bien. Segui asi y cuidate igual."),
    (1, "Algunas senales. Monitoreate. No es normal pero es comun."),
    (2, "Riesgo moderado. El sistema esta disenado para quemarte."),
    (3, "Riesgo alto. Necesitas cambios. La terapia no es lujo."),
    (4, "Riesgo muy alto. No es aguante lo que falta. Es estructura."),
    (5, "Burnout critico. Busca ayuda profesional. Tu laburo no es tu vida."),
]


def run(ctx):
    text = ctx.get("text", "")
    if not text:
        lines = [
            "[ Termometro de Burnout ]",
            "",
            "  Contame como estas laburando y te digo",
            "  si el sistema te esta quemando vivo.",
            "",
            "  Ej: 'trabajo 12 horas, siempre conectado, no duermo bien'",
            "  Ej: 'laburo 8hs, hago pausas, finde no toco la compu'",
        ]
        return "\n".join(lines)

    t = text.lower()
    puntaje = 0
    detalles = []
    protectores = []

    for patron, peso, mensaje in SIGNOS:
        if re.search(patron, t):
            puntaje += peso
            detalles.append((peso, mensaje))

    for patron, mensaje in FACTORES_PROTECTORES:
        if re.search(patron, t):
            protectores.append(mensaje)
            puntaje = max(0, puntaje - 1)

    nivel = min(5, puntaje // 3)
    etiqueta = FRASES[nivel][1]

    lines = ["[ Termometro de Burnout ]"]
    lines.append("")

    if not detalles and not protectores:
        lines.append("  No detecte senales claras ni en un sentido ni en otro.")
        lines.append("  Contame mas sobre tu dia a dia.")
        lines.append("")
        lines.append("  Puntaje: 0/15 | Riesgo: bajo")
        lines.append("  (Esto no es un diagnostico. Es una alerta sabandija.)")
        return "\n".join(lines)

    lines.append(f"  Puntaje: {puntaje}/15 | Riesgo: {'BAJO' if puntaje < 3 else 'MODERADO' if puntaje < 6 else 'ALTO' if puntaje < 10 else 'CRITICO'}")
    lines.append("")
    if detalles:
        lines.append("  Senales detectadas:")
        for peso, msg in sorted(detalles, reverse=True):
            lines.append(f"    ({'+' * peso}{'.' * (3 - peso)}) {msg}")
        lines.append("")
    if protectores:
        lines.append("  Factores protectores:")
        for p in protectores:
            lines.append(f"    (+) {p}")
        lines.append("")
    lines.append(f"  -> {etiqueta}")
    lines.append("")
    lines.append(f"  El burnout no es debilidad. Es el resultado natural")
    lines.append(f"  de un sistema que pide mas de lo que da.")
    lines.append(f"  Si podes, reduci horas. Si no podes, organizate.")
    lines.append(f"  Y si nada cambia, recorda: tu salud vale mas que el sprint.")

    return "\n".join(lines)
