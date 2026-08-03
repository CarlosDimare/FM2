# Plan: Expansión Mundial de Ligas + Sistema de Interacciones entre Personajes

**Última actualización: 3 agosto 2026**

## ✅ PROGRESO — Fase final (95% completado)

| # | Paso | Estado |
|---|------|--------|
| 1 | `types` + `data/static` ampliados | ✅ |
| 2 | `LeagueEngine` + simulación ligera/profunda | ✅ |
| 3 | `initWorld` + `loadRealClubs` genéricos | ✅ |
| 4 | `Scheduler` multi-liga | ✅ |
| 5 | Datos estáticos por continente (38 ligas) | ✅ |
| 6 | Sistema de relaciones y tipo `Interaction` | ✅ |
| 7 | Extensión de `DialogueSystem` | ✅ |
| 8 | UI PeopleHub (Jugadores/Staff/Relaciones/Directiva/Prensa/Red de DT) | ✅ |
| 9 | Migraciones y validaciones de save/load | ✅ |
| 10 | Instrumentación de rendimiento (console.time) | ✅ |

---

## 1. Catálogo de ligas: 38 ligas activas

### Cargadas del open-football-database (35 ligas)
| Continente | Ligas |
|---|---|
| **CONMEBOL** | Argentina (2), Brasil (2), Chile, Colombia, Uruguay |
| **UEFA** | Inglaterra (2), España (2), Italia (2), Alemania, Francia (2), Portugal, Países Bajos, Bélgica, Turquía, Rusia, Croacia, Grecia, Austria, Suiza, Dinamarca, Suecia, Noruega, Polonia, Ucrania |
| **CONCACAF** | México, USA (2 conferencias) |
| **AFC** | Japón, Arabia Saudita |

### Generadas con datos estáticos reales (3 ligas)
| Continente | Ligas | Clubes |
|---|---|---|
| **AFC** | K League 1 (Corea del Sur), Chinese Super League (China) | 12 + 16 |
| **OFC** | A-League (Australia) | 12 |

**Total: 38 ligas · ~570 clubes · ~55,000 jugadores**

---

## 2. Infraestructura de datos completa

### REGEN_DB: 36 países con nombres y apellidos realistas
- CONMEBOL: Argentina, Brasil, Uruguay, Chile, Colombia, Ecuador, Paraguay, Bolivia, Perú, Venezuela
- UEFA: España, Inglaterra, Alemania, Francia, Portugal, Italia, Países Bajos, Bélgica, Turquía, Rusia, Croacia, Grecia, Austria, Suiza, Dinamarca, Suecia, Noruega, Polonia, Ucrania
- CONCACAF: México, USA
- AFC: Japón, Corea del Sur, China, Arabia Saudita
- CAF: Egipto, Marruecos, Sudáfrica, Nigeria, Ghana
- OFC: Australia

### COUNTRY_CODES: 45+ países con banderas
### NATIONS: 33 nacionalidades
### countryEconomy: 35+ multiplicadores salariales
### getContinentForCountry: cobertura completa de todos los países

---

## 3. Motor de simulación

### LeagueEngine
- `resolveDepth()`: DEEP vs LIGHT por afinidad continental
- `resolveDeepLeagueIds()`: liga del usuario + misma división mismo país + 2 tier-1 del continente
- `buildCluster()`: agrupación por continente
- `generateFixturesForLeague()`: round-robin con soporte para SENIOR/RESERVE/U20

### Scheduler multi-liga
- `initSeasonFixtures()` procesa las 38 ligas automáticamente
- DEEP: fixtures SENIOR + RESERVE + U20
- LIGHT: fixtures solo SENIOR
- Copas continentales, domésticas y de selecciones incluidas

### Instrumentación
- `console.groupCollapsed` con breakdown DEEP/LIGHT por día
- `console.time` por sección (⚽ simular partidos, 🔄 ciclo diario)
- `console.table` al iniciar temporada con fixture count por liga

---

## 4. Sistema de interacciones

### DialogueSystem
- Tipos: PRAISE_FORM, CRITICIZE_FORM, PRAISE_TRAINING, DEMAND_MORE, WARN_CONDUCT, SET_CAPTAIN, CHANGE_POSITION, INDIVIDUAL_TRAINING_FOCUS, THREATEN_TRANSFER, GRANT_CAPTANCY, ASSIGN_TRAINING, DELEGATE_MATCH, REPRIMAND, PROMISE_RESOURCES, SCOUTING_FOCUS, **PRESS_STATEMENT**, **CONTACT_MANAGER**
- Canales: COACH_PLAYER, COACH_STAFF, COACH_MANAGER, COACH_PRESS, COACH_BOARD
- Efectos: delta moral, cambio en relationships, interactionLog, reputationalBuffs

### PeopleHub (6 pestañas)
- **Jugadores**: elogiar, criticar, exigir, capitanía, amonestar
- **Staff**: asignar entrenamiento, delegar partido, reprender, prometer recursos
- **Relaciones**: red de confianza/respeto/tensión con decay automático
- **Prensa**: declaraciones (expectativas, rival, vestuario, rumores) + tono + feed de noticias
- **Red de DT**: contacto con entrenadores rivales, reputación, relación
- **Directiva**: confianza, presupuesto, instalaciones

---

## 5. Pendiente (5%)

- ⬜ Medir rendimiento real con 5-10 ligas DEEP (~1600-2000 fixtures) — la instrumentación ya está, falta correr el juego y ver los números
- ⬜ Optimizar si `⚽ simular partidos` supera ~100ms/día
- ⬜ Agregar ligas CAF con datos estáticos (Egipto, Marruecos, Sudáfrica) si se desea
- ⬜ Expandir `processDeadlineDay` para que afecte a todas las ligas, no solo la del usuario
