# Plan: Pilar A — El Mundo Vivo (Reputación Dinámica de Ligas)

**Creado: 3 agosto 2026**

## Objetivo
Las 41 ligas del juego no son estáticas. Su reputación fluctúa según el éxito continental de sus clubes, afectando salarios, valores de jugadores, migración de talento y generando un ecosistema económico vivo.

## Features

### A1. Reputación dinámica de ligas
- `Competition.dynamicReputation`: número 0-100 que arranca = reputación base de la liga
- `WorldManager.updateLeagueReputations()`: al final de cada temporada, recalcula según:
  - Performance continental de clubes de la liga (UCL, Libertadores, etc.)
  - CA promedio de los jugadores de la liga
  - Prize pool actual
- Las ligas se agrupan en tiers: ELITE (80+), PRESTIGE (60-79), DEVELOPING (40-59), EMERGING (20-39), LOCAL (<20)

### A2. Inflación/deflación por mercado
- `getMarketMultiplier(leagueId)`: retorna multiplicador 0.5-2.0 según dynamicReputation
- Afecta: salarios, valores de jugador, prize pools, transfer budgets
- Ligas en ascenso inflan salaries → atraen talento pero cuesta más
- Ligas en declive reducen todo → pierden competitividad

### A3. Migración de talento
- En `processAIActivity`, los clubes de ligas EMERGING/LOCAL tienen prioridad de venta a ligas PRESTIGE/ELITE
- Jugadores jóvenes (U23) con PA>150 prefieren ligas en ascenso
- Jugadores veteranos (32+) aceptan ligas en declive si ofrecen buen salario

### A4. Noticias económicas
- Inbox genera headlines cuando:
  - Una liga cambia de tier
  - Una liga sube/baja >10 puntos en una temporada
  - "La Saudi Pro League supera a la Eredivisie en reputación"
  - "Crisis en la Liga MX: cae al tier EMERGING"

### A5. UI: Ranking mundial de ligas
- Nueva vista o pestaña en TournamentHub
- Tabla ordenable: #, Liga, País, Reputación, Tier, Tendencia (↑↓→), Prize Pool
- Colores por tier: dorado (ELITE), plata (PRESTIGE), bronce (DEVELOPING), gris (EMERGING), negro (LOCAL)

## Orden de implementación
1. `types.ts`: dynamicReputation + LeagueTier
2. `worldManager.ts`: updateLeagueReputations() + getMarketMultiplier()
3. `lifecycleManager.ts`: hook en processEndOfSeason
4. `worldManager.ts`: inflación en finanzas + migración en AI
5. `worldManager.ts`: noticias económicas
6. `components/`: UI ranking de ligas
7. Typecheck + commit
