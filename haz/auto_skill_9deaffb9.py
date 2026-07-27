import re

def run(ctx):
    msg = ctx.get("message", "")
    if not msg:
        return "Pegame un texto con estructura salarial (cargos y sueldos) y te digo cuantos trabajadores rasos podria pagar tu jefe."
    salaries = parse_salaries(msg)
    if not salaries:
        return "No encontre sueldos. Pone algo como 'CEO 5 palos, dev 300k' o 'gerente 1.5M, becario 150k'."
    result = analyze(salaries)
    return result


def parse_salaries(text):
    lines = text.replace("\n", " ").split(",")
    salaries = []
    for line in lines:
        parts = line.strip().split()
        if len(parts) < 2:
            continue
        amount, title_parts = extract_amount(parts)
        if amount is None or amount <= 0:
            continue
        title = " ".join(title_parts).lower()
        salaries.append((title, amount))
    return salaries


def extract_amount(parts):
    for i in range(len(parts) - 1, -1, -1):
        candidate = " ".join(parts[i:])
        parsed = parse_amount(candidate)
        if parsed is not None:
            return parsed, parts[:i]
    parsed = parse_amount(parts[-1])
    if parsed is not None:
        return parsed, parts[:-1]
    return None, parts


def parse_amount(s):
    s = s.strip().lower().replace("$", "").replace(",", "").strip()
    if s.replace(".", "").isdigit() and s.count(".") <= 1:
        return int(float(s))
    if s.endswith("palos") or s.endswith("palo"):
        n = s.replace("palos", "").replace("palo", "").strip()
        if n.replace(".", "").isdigit() and n.count(".") <= 1:
            return int(float(n) * 1_000_000)
    if s.endswith("k"):
        n = s[:-1].strip()
        if n.replace(".", "").isdigit() and n.count(".") <= 1:
            return int(float(n) * 1000)
    if s.endswith("millon") or s.endswith("millones"):
        n = s.replace("millones", "").replace("millon", "").strip()
        if n.replace(".", "").isdigit() and n.count(".") <= 1:
            return int(float(n) * 1_000_000)
    if s.endswith("m"):
        n = s[:-1].strip()
        if n.replace(".", "").isdigit() and n.count(".") <= 1:
            return int(float(n) * 1_000_000)
    return None


ROLES_BOSS = ["ceo", "cto", "cfo", "coo", "vp", "director", "gerente", "jefe", "manager", "head", "lead"]
ROLES_WORKER = ["dev", "developer", "programador", "trainee", "jr", "junior", "ssr", "senior",
    "becario", "practicante", "admin", "asistente", "soporte", "qa", "analista", "disenador",
    "designer", "frontend", "backend", "fullstack", "data", "sysadmin", "infra"]


def analyze(salaries):
    bosses = []
    workers = []
    other = []
    for title, amount in salaries:
        if any(r in title for r in ROLES_BOSS):
            bosses.append((title, amount))
        elif any(r in title for r in ROLES_WORKER):
            workers.append((title, amount))
        else:
            other.append((title, amount))
    if not bosses:
        return "No detecte cargos gerenciales. Los sueldos de los que laburan no alcanzan para el analisis."
    if not workers:
        return "Hay jefes pero no laburantes. Tipica foto de una empresa Argentina."
    avg_worker = sum(w[1] for w in workers) // len(workers)
    total_boss = sum(b[1] for b in bosses)
    can_pay = total_boss // avg_worker if avg_worker else 0
    best_boss = max(bosses, key=lambda x: x[1])
    ratio = best_boss[1] // avg_worker if avg_worker else 0
    lines = [f"Jefes detectados: {len(bosses)}, laburantes: {len(workers)}",
        f"Sueldo promedio laburante: ${avg_worker:,}",
        f"Costo total de jefes: ${total_boss:,}",
        f"Con ese dinero podrias tener {can_pay} laburantes mas (o sea, {can_pay - len(workers) if can_pay > len(workers) else 0} adicionales a los actuales)."]
    if ratio >= 20:
        lines.append(f"Tu '{best_boss[0].title()}' gana como {ratio} laburantes juntos. Podria ser una SAS y aun asi le sobrarian gerentes.")
    elif ratio >= 10:
        lines.append(f"'{best_boss[0].title()}' gana lo mismo que {ratio} laburantes. Si se baja un sueldo, contrata un equipo de delivery.")
    elif ratio >= 5:
        lines.append(f"Cada '{best_boss[0].title()}' cuesta como {ratio} laburantes. Relacion casi razonable para una PyME, casi.")
    else:
        lines.append(f"'{best_boss[0].title()}' gana apenas {ratio} veces lo de un laburante. Raro. Seguro es cooperativa.")
    yearly = total_boss * 13
    lines.append(f"Proyeccion anual (13 sueldos): ${yearly:,}")
    lines.append(f"Con eso compras {yearly // 500_000_000 if yearly >= 500_000_000 else 0} departamentos de 50m2 en CABA (o {yearly // 1_000_000_000 if yearly >= 1_000_000_000 else 0} si el dolar se fue al carajo, que es siempre).")
    return "\n".join(lines)
