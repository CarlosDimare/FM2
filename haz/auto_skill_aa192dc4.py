import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: servicio1:precio1 servicio2:precio2 ... [horas_diarias]\n"
            "Calcula el costo total de tus suscripciones de streaming.\n"
            "Muestra total por mes, por ano, costo por hora, y alternativas.\n"
            "Ej: netflix:15000 disney:8000 prime:7000 max:12000 3\n"
            "Ej: spotify:5000 netflix:15000 2\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()

    services = []
    horas_diarias = 2
    for p in parts:
        p = p.strip()
        if ":" in p:
            name, price_str = p.split(":", 1)
            price_str = price_str.upper()
            mult = 1
            if "K" in price_str:
                mult = 1000
                price_str = price_str.replace("K", "")
            elif "M" in price_str:
                mult = 1_000_000
                price_str = price_str.replace("M", "")
            try:
                price = float(price_str) * mult
                services.append((name, price))
            except ValueError:
                pass
        else:
            try:
                horas_diarias = float(p)
            except ValueError:
                pass

    if not services:
        return (
            "Error: no se reconocieron servicios. Formato: nombre:precio\n"
            "Ej: netflix:15000 disney:8000 prime:7000 max:12000 3"
        )

    total_monthly = sum(p for _, p in services)
    total_annual = total_monthly * 12

    horas_mes = horas_diarias * 30
    total_horas_mes = horas_mes
    costo_por_hora = total_monthly / total_horas_mes if total_horas_mes > 0 else 0

    costo_por_dia = total_monthly / 30

    blue = 1400

    equivalencias = [
        ("docena de empanadas", 12000),
        ("kg de asado", 18000),
        ("cafe de especialidad", 3500),
        ("viaje en bondi", 1200),
        ("litro de Coca-Cola", 2800),
        ("Big Mac", 8500),
        ("atado de puchos", 7000),
        ("cerveza artesanal pinta", 4000),
        ("cuota de gimnasio", 25000),
        ("libro", 25000),
    ]

    lines = []
    lines.append(f"STREAMING - COSTO TOTAL")
    lines.append(f"Horas de uso por dia: {horas_diarias:.0f} ({horas_mes:.0f} h/mes)")
    lines.append("---")
    lines.append("SERVICIOS:")
    for name, price in sorted(services, key=lambda x: -x[1]):
        pct = (price / total_monthly) * 100
        lines.append(f"  {name:<20} $ {price:>8,.0f}  ({pct:.0f}%)")
    lines.append("")
    lines.append("TOTALES:")
    lines.append(f"  Por mes:  $ {total_monthly:,.0f}")
    lines.append(f"  Por ano:  $ {total_annual:,.0f}")
    lines.append(f"  Por dia:  $ {costo_por_dia:,.0f}")
    lines.append(f"  Costo/hora: $ {costo_por_hora:,.0f}")
    lines.append("")
    lines.append(f"USD (blue {blue}):")
    lines.append(f"  Por mes:  USD {total_monthly/blue:,.0f}")
    lines.append(f"  Por ano:  USD {total_annual/blue:,.0f}")
    lines.append("")
    lines.append("EQUIVALE POR MES A:")
    for item, cost in equivalencias:
        cant = total_monthly / cost
        if cant >= 2:
            lines.append(f"  {cant:.0f} x {item}")
        elif cant >= 0.5:
            lines.append(f"  {cant:.1f} x {item}")
    lines.append("")
    lines.append(f"SERVICIOS POR HORA:")
    lines.append(f"  (si ves todo a la vez, imposible. Si rotas, barato)")

    lines.append("")
    if total_monthly > 100000:
        lines.append(
            "Posta: Mas de 100 lucas por mes en streaming. Tenes mas "
            "suscripciones que tiempo para verlas. Netflix, Disney, "
            "Max, Prime, Apple, Spotify, Crunchyroll... el capitalismo "
            "te vende contenido como si fueran estampitas: coleccionas "
            "mas de lo que consumis. La pregunta es: ves todo esto "
            "o pagas por la tranquilidad de saber que PODRIAS verlo?"
        )
    elif total_monthly > 50000:
        lines.append(
            f"Posta: Entre 50 y 100 lucas por mes en streaming. Estas "
            "en el rango de la clase media con 3-4 plataformas. "
            "Probablemente compartis contraseinas con familiares y "
            "amigos, formando una economia colaborativa no declarada "
            "que Netflix llama 'perdidas' y nosotros llamamos 'solidaridad "
            "de clase'. Cuando te pidan dejar de compartir, recorda: "
            "la cuenta es tuya, el contenido es de ellos, pero la "
            "plusvalia es de los accionistas."
        )
    elif total_monthly > 20000:
        lines.append(
            f"Posta: Menos de 50 lucas por mes. Tenes 1-2 servicios "
            "nada mas. Probablemente rotas: un mes Netflix, otro "
            "Max, otro Disney. O compartis con alguien. O pirateas "
            "el resto. Sos el usuario racional del streaming: el que "
            "no compra mascotas de lujo sino que alimenta al perro "
            "que tiene. Bien ahi. El capitalismo te quiere con 7 "
            "suscripciones, no con 2."
        )
    else:
        lines.append(
            "Posta: Menos de 20 lucas por mes. O tenes una sola "
            "plataforma o compartis con medio mundo. En cualquier "
            "caso, estas ganando la guerra del streaming: pagas "
            "menos que el costo de un cable basico y ves lo mismo "
            "que el que paga 7 suscripciones. La clase obrera "
            "siempre encuentra la manera de no pagar el lujo ajeno."
        )

    if len(services) >= 5:
        lines.append("")
        lines.append(
            "Tip: Si tenes 5 o mas servicios, considera rotarlos "
            "mensualmente en lugar de tenerlos todos activos. Ves "
            "lo mismo, pagas la mitad. El streaming no es una "
            "coleccion, es un grifo: abri solo el que vas a usar."
        )

    return "\n".join(lines)
