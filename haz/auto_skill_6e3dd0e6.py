import re

def run(ctx):
    t = ctx.get("input", "").strip()
    if not t:
        return "Pone una distancia en km y un medio. Ej: '30km auto' o '10km bici'"

    m_km = re.search(r"(\d+(?:[.,]\d+)?)\s*km", t, re.IGNORECASE)
    m_medio = re.search(r"(auto|moto|colectivo|tren|subte|bici|taxi|uber|caminando)", t, re.IGNORECASE)

    if not m_km:
        return "No entendi. Pone algo como '15km auto'"

    km = float(m_km.group(1).replace(",", "."))
    medio = (m_medio.group(1) if m_medio else "auto").lower()

    # Costs per km in ARS (approximate 2026 CABA)
    costos = {
        "auto":    235,  # nafta + peaje + seguro + patente + desgaste
        "moto":    120,
        "colectivo": 30,  # boleto dividido km promedio (~$350 / 12km)
        "tren":    25,
        "subte":   28,
        "bici":    5,    # mantenimiento
        "taxi":    600,
        "uber":    500,
        "caminando": 0,
    }

    vel = {"auto": 30, "moto": 35, "colectivo": 15, "tren": 25, "subte": 20, "bici": 15, "taxi": 25, "uber": 25, "caminando": 5}

    costo_km = costos.get(medio, costos["auto"])
    velocidad = vel.get(medio, vel["auto"])

    costo_viaje = costo_km * km
    costo_mensual = costo_viaje * 2 * 20  # ida y vuelta, 20 dias
    tiempo_min = (km / velocidad) * 60
    tiempo_mensual_h = tiempo_min * 2 * 20 / 60

    lines = [
        "=== COSTO DE TRANSPORTE ===",
        "Medio: {} | Distancia: {:.0f}km".format(medio.capitalize(), km),
        "",
        "Por viaje (ida): $ {:,.0f} ({:.0f} min)".format(costo_viaje, tiempo_min),
        "Por dia (ida+vuelta): $ {:,.0f} ({:.0f} min)".format(costo_viaje * 2, tiempo_min * 2),
        "Por mes: $ {:,.0f} ({:.1f} horas)".format(costo_mensual, tiempo_mensual_h),
        "",
    ]

    if medio in ("auto", "moto", "taxi", "uber"):
        lines.append("Pro tip: En colectivo ahorrarias $ {:,.0f}/mes".format(
            costo_mensual - costos["colectivo"] * km * 2 * 20
        ))
    elif medio == "bici":
        lines.append("Pro tip: Estas ahorrando $ {:,.0f}/mes y ganando salud.".format(
            costos["auto"] * km * 2 * 20 - costo_mensual
        ))
    elif medio == "caminando":
        lines.append("Pro tip: Gratis y sano. Pero a {:.0f} min por viaje...".format(tiempo_min))

    return "\n".join(lines)
