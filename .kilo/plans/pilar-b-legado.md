# Plan: Pilar B — Legado y Salón de la Fama

**Creado: 3 agosto 2026**

## Objetivo
Construir un sistema de legado que persista entre temporadas: stats de carrera de jugadores, récords históricos de clubes, y un Salón de la Fama con los mejores entrenadores de la historia del juego.

## Features

### B1. Salón de la Fama
- `HallOfFameEntry`: managerId, name, club, country, titles, winRate, games, era, yearInducted
- `worldManager.hallOfFame`: array persistente en saves
- `updateHallOfFame()`: al final de cada temporada evalúa HEAD_COACHes con ≥60% win-rate y ≥100 partidos
- UI: vista `HALL_OF_FAME` con tabla ordenable (nombre, títulos, win-rate, partidos, era)
- Sidebar: enlace "Salón de la Fama" con ícono 🏆

### B2. Stats históricas de jugadores
- `Player.careerStats`: { totalApps, totalGoals, totalAssists, totalCleanSheets, clubsPlayedFor: string[] }
- Se acumulan en `finalizeSeasonStats()` después de cada partido
- Visibles en `PlayerModal` como sección "Carrera"

### B3. Récords históricos de club
- `ClubRecords` ampliado: `allTimeTopScorer`, `allTimeMostApps`, `allTimeCleanSheets`
- Se actualizan al final de temporada comparando stats de carrera de jugadores del club
- Visibles en `ClubReport` como sección "Récords Históricos"

### B4. Comparador de eras
- Modal `EraCompareModal` que compara dos `ManagerProfile` o `HallOfFameEntry`
- Side-by-side: títulos, win-rate, partidos, goles, era, clubes dirigidos
- Accesible desde el Salón de la Fama

## Orden
1. types.ts: HallOfFameEntry + careerStats + ClubRecords all-time
2. worldManager.ts: hallOfFame + updateHallOfFame() + updateClubAllTimeRecords()
3. engine.ts: acumular careerStats en finalizeSeasonStats
4. UI: HallOfFameView + CareerStats en PlayerModal + AllTimeRecords en ClubReport
5. Typecheck + commit
