import re

def run(ctx):
    input_text = ctx.get("input", "")
    if not input_text:
        return (
            "Uso: deuda_mora monto dias [tasa_anual] [tasa_punitoria]\n"
            "Calcula intereses resarcitorios y punitorios por mora en Argentina.\n"
            "Tasa resarcitoria default: 80% anual (BCRA)\n"
            "Tasa punitoria default: 50% anual\n"
            "Ej: 500000 30\n"
            "Ej: USD 2000 45 60 40\n"
            "Soporta sufijos k/M."
        )

    parts = input_text.strip().split()
    is_usd = parts[0].upper() == "USD"
    offset = 1 if is_usd else 0

    if len(parts) < offset + 2:
        return "Error: faltan parametros (monto dias [tasa_resarcitoria] [tasa_punitoria])."

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
        monto = parse_num(parts[offset])
        dias = float(parts[offset + 1])
    except ValueError:
        return "Error: no se pudieron parsear los numeros."

    tasa_resarc = 80.0
    tasa_punitoria = 50.0
    if len(parts) >= offset + 3:
        tasa_resarc = parse_num(parts[offset + 2])
    if len(parts) >= offset + 4:
        tasa_punitoria = parse_num(parts[offset + 3])

    c = "USD" if is_usd else "ARS"
    blue = 1400

    # Interes simple diario: tasa nominal anual / 365
    resarc_diario = (tasa_resarc / 100) / 365
    punit_diario = (tasa_punitoria / 100) / 365

    resarc_total = monto * resarc_diario * dias
    punit_total = monto * punit_diario * dias
    total_intereses = resarc_total + punit_total
    total_deuda = monto + total_intereses

    resarc_pct = (resarc_total / monto) * 100
    punit_pct = (punit_total / monto) * 100
    total_pct = resarc_pct + punit_pct

    lines = []
    lines.append("CALCULADORA DE INTERESES POR MORA (ARGENTINA)")
    lines.append(f"Monto original:        {c} {monto:,.0f}")
    lines.append(f"Dias de mora:           {dias:.0f}")
    lines.append(f"Tasa resarcitoria:      {tasa_resarc:.1f}% anual")
    lines.append(f"Tasa punitoria:         {tasa_punitoria:.1f}% anual")
    lines.append("---")
    lines.append(f"Interes resarcitorio:    {c} {resarc_total:,.0f} ({resarc_pct:.1f}%)")
    lines.append(f"Interes punitorio:       {c} {punit_total:,.0f} ({punit_pct:.1f}%)")
    lines.append(f"TOTAL intereses:         {c} {total_intereses:,.0f} ({total_pct:.1f}%)")
    lines.append(f"MONTO TOTAL A PAGAR:     {c} {total_deuda:,.0f}")
    lines.append("")
    lines.append(f"Tasa efectiva mensual:")
    lines.append(f"  Resarcitoria:  {resarc_diario*30*100:.2f}%")
    lines.append(f"  Punitoria:     {punit_diario*30*100:.2f}%")
    lines.append(f"  Combinada:     {(resarc_diario+punit_diario)*30*100:.2f}%")
    lines.append("")

    if dias <= 30:
        lines.append(
            "Posta: Menos de 30 dias y ya te rompieron el orto "
            "con los intereses. Si pagas todo con tarjeta y "
            "te atrasas, esto es lo que te espera. "
            "Los bancos tienen tasas de mora que son "
            "usura legalizada. La tasa resarcitoria cubre "
            "el 'costo del dinero' y la punitoria es el castigo. "
            "Dos castigos por lo mismo. "
            "Como si te multaran por llegar tarde y te "
            "cobraran mas por el cafe que ya te tomaste."
        )
    elif dias <= 90:
        lines.append(
            "Posta: Entre 1 y 3 meses de mora. Ya estas "
            "pagando un sobrecosto importante. En Argentina, "
            "la mora judicial suele calcularse con estas tasas "
            "pero los juzgados pueden reducirlas si "
            "consideran que hay usura. Clave: si te deben "
            "a vos, pedi resarcitorios + punitorios desde "
            "la mora. Si debes vos, pedi quita. "
            "La ley existe pero el que tiene plata para "
            "abogados gana. Como siempre."
        )
    else:
        lines.append(
            "Posta: Mas de 3 meses. A este ritmo los intereses "
            "ya son una parte importante de la deuda. "
            "En Argentina las tasas de mora son tan altas "
            "que en 6 meses podes deber el doble. "
            "No es casualidad: la usura es el negocio "
            "de los bancos y la mora es su mejor producto. "
            "Si debes, negocia una quita. Si te deben, "
            "no esperes mas porque el tiempo trabaja "
            "a favor del deudor en pesos y del "
            "acreedor en dolares."
        )

    if not is_usd:
        lines.append("")
        lines.append(f"USD (blue {blue}):")
        lines.append(f"  Original:   USD {monto/blue:,.0f}")
        lines.append(f"  Intereses:  USD {total_intereses/blue:,.0f}")
        lines.append(f"  Total:      USD {total_deuda/blue:,.0f}")

    return "\n".join(lines)
