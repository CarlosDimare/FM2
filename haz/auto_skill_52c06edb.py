import re

def run(ctx):
    msg = ctx.get("message", "")
    if not msg:
        return "Poneme una descripcion de tu relacion laboral (horarios, cliente unico, herramientas, supervisor, etc) y te digo si sos un empleado no registrado bajo la reforma del art 23."
    return analyze(msg)


RED_FLAGS = {
    "cliente_unico": [
        "unico cliente", "solo cliente", "un solo cliente", "single client",
        "una sola empresa", "misma empresa", "mismo cliente",
    ],
    "horario_fijo": [
        "horario fijo", "de 9 a", "de 8 a", "de 10 a", "de lunes a viernes",
        "lunes a sabado", "entrada fija", "salida fija", "cumplir horario",
        "horario laboral", "jornada completa", "full time", "tiempo completo",
    ],
    "herramientas_empresa": [
        "computadora de la empresa", "pc de la empresa", "notebook de la empresa",
        "herramientas de la empresa", "licencia corporativa", "acceso VPN",
        "cuenta de correo de la empresa", "mail corporativo", "slack de la empresa",
        "teams de la empresa", "equipo de la empresa", "compu corporativa",
    ],
    "supervision": [
        "supervisor", "supervisa", "reporto a", "le reporto", "mi jefe",
        "mi lider", "mi manager", "scrum master", "daily", "sprint review",
        "retro", "me asignan tareas", "tareas asignadas", "tickets",
    ],
    "exclusividad": [
        "exclusividad", "dedicacion exclusiva", "no podes trabajar para otro",
        "no trabajar para otra", "full time exclusivo", "jornada completa",
    ],
    "dependencia_economica": [
        "unico ingreso", "principal ingreso", "vivo de esto",
        "dependo de este ingreso", "mi unico trabajo",
    ],
    "subordinacion_tecnica": [
        "siguen mis commits", "code review", "revision de codigo",
        "siguen mis vacaciones", "piden permiso", "pedir permiso",
        "autorizacion", "aprobacion", "requiere aprobacion",
    ],
    "lugar_trabajo": [
        "oficina", "presencial", "voy a la oficina", "trabajo en sede",
        "coworking pago por la empresa",
    ],
}


FLAG_LABELS = {
    "cliente_unico": "Cliente unico (dependencia economica)",
    "horario_fijo": "Horario fijo (subordinacion juridica)",
    "herramientas_empresa": "Herramientas provistas por el empleador",
    "supervision": "Supervision directa (control jerarquico)",
    "exclusividad": "Exigencia de exclusividad",
    "dependencia_economica": "Dependencia economica (unico ingreso)",
    "subordinacion_tecnica": "Subordinacion tecnica (control de calidad)",
    "lugar_trabajo": "Lugar de trabajo impuesto por el empleador",
}


def analyze(text):
    text_lower = text.lower()
    detected = {}
    for key, patterns in RED_FLAGS.items():
        for p in patterns:
            if p in text_lower:
                detected[key] = True
                break
    total = len(detected)
    lines = []
    if total == 0:
        return ("No detecte indicadores de relacion de dependencia. "
                "Si laburas asi, felicidades: realmente sos autonomo. "
                "O no me diste suficiente texto. Proba con mas detalles "
                "(horarios, herramientas, supervision, etc).")
    lines.append(f"Indicadores detectados: {total}/8")
    lines.append("")
    for key in sorted(detected.keys()):
        lines.append(f"  [X] {FLAG_LABELS.get(key, key)}")
    for key in sorted(set(FLAG_LABELS.keys()) - set(detected.keys())):
        lines.append(f"  [ ] {FLAG_LABELS.get(key, key)}")
    lines.append("")
    if total >= 6:
        lines.append("VEREDICTO: Relacion de dependencia encubierta.")
        lines.append("Bajo la reforma del art 23, si facturas como monotributista")
        lines.append("pero tenes 6+ indicadores, tu 'cliente' es tu empleador.")
        lines.append("Te deben aguinaldo, vacaciones, ART, obra social e indemnizacion.")
        lines.append("Telegrama laboral urgente.")
        lines.append(
            "Mientras tanto: segui facturando, pero empeza a buscar abogado laboral."
        )
    elif total >= 4:
        lines.append("VEREDICTO: Alta probabilidad de relacion de dependencia.")
        lines.append("El art 23 reformado dice que los jueces evaluaran los")
        lines.append("'elementos concretos de subordinacion'. Con 4+ indicadores,")
        lines.append("tenes un caso solido para reclamar registro formal.")
        lines.append("Junta chats, mails y capturas de pantalla.")
        lines.append("Tu 'cliente' te debe mas que el monotributo que le facturas.")
    elif total >= 2:
        lines.append("VEREDICTO: Zona gris. Algunos indicadores de dependencia.")
        lines.append("Con la reforma del art 23, la presuncion ya no es automatica.")
        lines.append("Si tenes dudas, consulta con un abogado laboral.")
        lines.append("O segui asi y cruza los dedos para que no te rajen sin indemnizacion.")
    else:
        lines.append("VEREDICTO: Probablemente sos autonomo de verdad.")
        lines.append("O sos empleado pero muy cuidadoso de no dejar evidencias.")
    lines.append("")
    lines.append("Disclaimer: esto no es asesoria legal. Es una skill hecha")
    lines.append("por hazbot para joder. Si necesitas abogado, busca uno de verdad.")
    return "\n".join(lines)
