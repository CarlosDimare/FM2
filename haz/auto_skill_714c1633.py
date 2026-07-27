import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: km_totales rendimiento_km_por_litro precio_nafta_x_litro [peajes] [pasajeros]\n"
            "Calcula el costo de un viaje en auto.\n"
            "Divide el costo entre pasajeros y muestra el total por persona.\n"
            "Ej: 800 12 1300 15000 4\n"
            "Ej: 200 15 1800 0 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    if len(parts) < 3:
        return "Error: faltan parametros (km rendimiento precio_litro [peajes] [pasajeros])."

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
        km = float(parts[0])
        rendimiento = float(parts[1])
        nafta = parse_num(parts[2])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    peajes = 0
    pasajeros = 1

    if len(parts) >= 4:
        peajes = parse_num(parts[3])
    if len(parts) >= 5:
        try:
            pasajeros = int(float(parts[4]))
        except ValueError:
            pass

    litros = km / rendimiento if rendimiento > 0 else 0
    costo_nafta = litros * nafta
    costo_total = costo_nafta + peajes
    costo_por_pasajero = costo_total / pasajeros if pasajeros > 0 else 0
    costo_por_km = costo_total / km if km > 0 else 0

    depreciacion_km = 150
    costo_con_depreciacion = costo_total + km * depreciacion_km
    costo_real_por_pasajero = costo_con_depreciacion / pasajeros if pasajeros > 0 else 0

    equivalencias = [
        ("cafe", 3500),
        ("cerveza", 4000),
        ("empanada", 1200),
        ("kg de asado", 18000),
    ]

    lines = []
    lines.append("COSTO DE VIAJE EN AUTO")
    lines.append(f"Distancia:      {km:.0f} km")
    lines.append(f"Rendimiento:    {rendimiento:.0f} km/l")
    lines.append(f"Nafta:          $ {nafta:,.0f}/l")
    lines.append(f"Peajes:         $ {peajes:,.0f}")
    lines.append(f"Pasajeros:      {pasajeros}")
    lines.append("---")
    lines.append(f"Litros necesarios:  {litros:.1f} l")
    lines.append(f"")
    lines.append("COSTO SOLO DE NAFTA:")
    lines.append(f"  Total:          $ {costo_nafta:,.0f}")
    lines.append(f"  Por km:         $ {costo_nafta/km:,.0f}" if km > 0 else "")
    lines.append("")
    lines.append("COSTO TOTAL (nafta + peajes):")
    lines.append(f"  Total:          $ {costo_total:,.0f}")
    lines.append(f"  Por km:         $ {costo_por_km:,.0f}")
    lines.append(f"  Por pasajero:   $ {costo_por_pasajero:,.0f}")
    lines.append("")
    lines.append("COSTO REAL (incluye desgaste del auto):")
    lines.append(f"  Depreciacion:   $ {km * depreciacion_km:,.0f} ({depreciacion_km}/km)")
    lines.append(f"  Total real:     $ {costo_con_depreciacion:,.0f}")
    lines.append(f"  Por pasajero:   $ {costo_real_por_pasajero:,.0f}")
    lines.append("")
    lines.append("EQUIVALENCIA DEL VIAJE (por pasajero):")
    for item, cost in equivalencias:
        cant = costo_por_pasajero / cost
        if cant >= 1:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")

    lines.append("")
    lines.append("COMPARACION CON OTROS MEDIOS:")
    costo_colectivo_km = 30
    costo_colectivo_total = km * costo_colectivo_km
    lines.append(f"  Colectivo:      $ {costo_colectivo_total:,.0f} ({costo_colectivo_mlabel(costo_colectivo_total)})")
    costo_avion_km = 80
    costo_avion_total = km * costo_avion_km
    lines.append(f"  Avion (aprox):  $ {costo_avion_total:,.0f} ({costo_colectivo_mlabel(costo_avion_total)})")

    lines.append("")
    if km > 500:
        lines.append(
            f"Posta: Viaje largo ({km:.0f} km). En Argentina, viajar "
            "en auto es mas barato que en avion para 2 o mas personas, "
            "pero mas lento. La Ruta 2 a Mar del Plata (400 km) te "
            "cuesta unos $ 50,000 de nafta + peajes. En micro salis "
            "$ 20,000 por persona. En avion, $ 80,000. El auto "
            "es negocio para grupos, no para viajero solitario."
        )
    elif km > 100:
        lines.append(
            f"Posta: Viaje medio ({km:.0f} km). Tipico finde largo o "
            "escapada. El auto gana en comodidad y flexibilidad. Perdes "
            "en estacionamiento y estres de manejo. La pregunta clasica: "
            "'Vamos en auto o en micro?' La respuesta siempre depende "
            "de si el que maneja quiere manejar o quiere dormir."
        )
    else:
        lines.append(
            f"Posta: Viaje corto ({km:.0f} km). Para menos de 100 km, "
            "el auto es la opcion mas comoda. Pero ojo: el desgaste "
            "del auto es real aunque no lo veas. Cada km que moves "
            "el auto perde plata en nafta, aceite, cubiertas, "
            "frenos, y valor de reventa. Viajar en auto no es "
            "gratis: es mas comodo pero mas caro de lo que parece."
        )

    return "\n".join(lines)

def costo_colectivo_mlabel(valor):
    if valor >= 1000000:
        return f"$ {valor/1000000:.1f}M"
    elif valor >= 1000:
        return f"$ {valor/1000:.0f}k"
    return f"$ {valor:,.0f}"
