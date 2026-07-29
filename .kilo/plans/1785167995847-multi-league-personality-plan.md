# Plan: Expansión Mundial de Ligas + Sistema de Interacciones entre Personajes

## 1. Objetivo
Agregar soporte para múltiples ligas de todos los continentes manteniendo el rendimiento, diferenciando simulación profunda vs. ligera, y construir un sistema mecánico profundo de interacciones entre DT, jugadores, staff y prensa.

## 2. Alcance
### Dentro
- Ampliar el catalogo de ligas y datos estáticos (CONMEBOL, UEFA, CONCACAF, AFC, CAF, OFC).
- Ejecutar TODAS las ligas cada temporada sin selección manual, diferenciando profundidad de simulación por cluster.
- Agregar relaciones reputacionales y química entre personajes.
- Implementar interacciones mecánicas profundas entre DT ↔ jugadores, staff, directiva y prensa.
- Mantener compatibilidad con saves existentes y no romper vistas actuales.

### Fuera de alcance (posponer)
- Reescritura del motor gráfico táctico 2D del partido.
- Agentes y comisiones.

### Cantidades objetivo
- Máximo 35-40 ligas activas en el mundo.
- Ligas profundas = ligas elegidas por el usuario en setup + afinidad continental. Objetivo 5-10 ligas profundas como máximo.
- Mini-juego: fixture count objetivo según ligas elegidas ~1600-2000 fixtures, no hard limit pero guía de rendimiento.
- Descansos en ligas impares: profunda = generar un "bye" dummy por ronda; ligera = omitir byes y simular solo partidos reales.

## 4. Decisiones bloqueadas
| Decisión | Valor |
|---|---|
| ¿Cómo simular todas las ligas sin explotar el tiempo CPU? | Simulación profunda para ligas elegidas por el usuario en setup. El resto se simula "ligeramente". Copa y continental del usuario son profundas. |
| ¿Cuál es el límite aceptable de fixtures activos? | Objetivo: ~1600-2000 fixtures en memoria cuando el usuario elige ligas. Guía de rendimiento, no hard limit. |
| ¿Cómo manejar descansos en ligas con número impar de equipos? | Profunda: generar un "bye" dummy por ronda para cerrar el fixture. Ligera: omitir byes y solo simular partidos reales. |
| ¿Cómo evitar defaults genéricos? | Cada liga debe aportar identidad real: nombre, país, tipo, tier, mapeo de países, premios, requisitos de plantilla y datos reales mínimos. |
| ¿Qué hacer si falta información específica? | Fallback determinista: `leagueId` existe, hay al menos un club real con nombre, país, colores y capacidad; fixtures válidos; sin `undefined`. |

## 4. Estructura de datos
### 4.1 Competencias
Ampliar `Competition` con:
- `continent`
- `confederation`
- `defaultPrizePool`
- `squadLimit`
- `u21Required`
- `continentalSlots`

### 4.2 Cluster de simulación
Agregar a `GameState` o `WorldState`:
- `deepSimLeagues`: string[]
- `deepSimComps`: string[]
- `userLeagueId`: string

### 4.3 Personajes
Ampliar `Staff` con:
- `personality`
- `morale`
- `reputation`
- `relationships: { [id]: { trust, respect, tension } }`

Ampliar `Player` con:
- `relationships: { [id]: { trust, respect, tension } }`

Agregar `Manager` o reusar `Staff` con `role === 'HEAD_COACH'` para DT:
- `staffRelationships`
- `playerRelationships`
- `pressReputation`
- `boardRelationship`

### 4.4 Eventos/Historia de interacciones
Agregar al mundo:
- `interactionLog: Interaction[]`
- `activeReputationalBuffs: RepBuff[]`

`Interaction`: quién con quién, tipo, tono, resultado, delta reputación/moral.

## 5. Motor de simulación múltiple
### 5.1 Selección de ligas profundas
- Singleton `LeagueEngine` con metodo `resolveDeepSimulation(userLeagueId)`:
  - Usuario SIEMPRE en deep.
  - Continental affinity del usuario → deep.
  - Ligas en mismo país → deep.
  - Resto → light.
  - Límite superior: máximo N competiciones profundas para no explotar CPU.

### 5.2 Simulación ligera
- No genera eventos por minuto.
- Calcula resultados finales por fecha usando `MatchSimulator.simulateQuickMatch`.
- Solamente actualiza goles, puntos, líderes, descensos, clasificados.
- Genera eventos de resumen al final de temporada.

### 5.3 Simulación profunda
- Genera fixtures detallados por fecha.
- Genera eventos instantáneos/que pueden solicitar interacción.

### 5.4 Actualización de fixtures
- Mantener fixture global por liga.
- `processCompetitionProgress` soporta múltiples ligas/copas.
- `updateNextFixture` puede devolver el próximo partido del usuario o un partido destacado del cluster.
- Las competiciones generan fixtures independientes, no hardcodeadas a Argentina.

## 6. Datos estáticos y catálogos
### 6.1 Ligas objetivo (mínimo viable por continente)
| Continente | Ligas |
|---|---|
| Sudamérica | Argentina (2 divisiones), Brasil (Serie A/B), Chile, Colombia, Uruguay, Ecuador, Paraguay |
| Europa | España (LaLiga/Segunda), Italia (Serie A/B), Alemania (Bundesliga/2.Bundesliga), Francia (Ligue 1/2), Portugal, Países Bajos |
| Resto | México (Liga MX), USA (MLS), Inglaterra (Premier/Championship), Japón (J1/J2) |

Cada liga trae: `id`, `name`, `country`, `type='LEAGUE'`, `tier`, `continent`, `confederation`, `defaultPrizePool`, `squadLimit`, `u21Required`, clubs asociados.

### 6.2 Datos RealClubDef
- `data/static.ts` → `<continent>_<LEAGUE_ID>` arrays.
- Estructura existente: `RealClubDef`.
- Si no hay uno, agregar generador por país para completar cupos mínimos (regen locales).

### 6.3 Nombres y nacionalidades
- Ampliar `REGEN_DB`: España, Inglaterra, Alemania, Francia, Portugal, Italia, Países Bajos, México, USA, Japón.
- Mapa `NATIONS` debe incluir todos los países de las ligas.

## 7. Sistema de interacciones profundas
### 7.1 Canales
- **DT ↔ Jugador**: elo actual ampliado (ya existe `DialogueSystem`).
  - Nuevos tipos: `SET_CAPTAIN`, `CHANGE_POSITION`, `INDIVIDUAL_TRAINING_FOCUS`, `THREATEN_TRANSFER`, `GRANT_CAPTANCY`.
  - Efectos mecánicos: delta moral, cambio en `relationships`, efecto en rendimiento.
- **DT ↔ Staff**:
  - Tipos: `ASSIGN_TRAINING`, `DELEGATE_MATCH`, `REPRIMAND`, `PROMISE_RESOURCES`, `SCOUTING_FOCUS`.
  - Efectos: motivación, química (`cohesionScore`), renuncia staff.
- **DT ↔ DT / DT ↔ Prensa**:
  - Panel independiente `PressHub` y `ManagerNetwork`.
  - Efectos: reputación pública, tensiones con colegas, filtraciones.
- **Directiva**:
  - Extender `BoardView` con propuestas y reuniones mecánicas.

### 7.2 Relaciones y tensión
- Cada relación tiene `trust`, `respect`, `tension`.
- Tensiones altas pueden generar:
  - Pedido de traspaso.
  - Renuncia de staff.
  - Filtración a prensa.
  - Baja de moral colectiva.

### 7.3 UI
- `PeopleHub`: unifica DT, staff, jugadores, prensa.
- Subvistas: Jugadores, Staff, Prensa, Red de DT.
- Context menu y diálogos persistentes con historial.

## 8. Migraciones y compatibilidad
### 8.1 Saves legacy
- Si falta `deepSimLeagues`, inicializar por defecto: usuario deep, resto light.
- Si falta `relationships`, inicializar mapa vacío.
- Si falta `continent` en competencias, derivar por país.

### 8.2 IDs
- Usar ids estables por competición: `L_<country>_<division>`.

## 9. Validación
- Build limpio.
- Load/save completo sin excepciones.
- Simular temporada completa con 6 ligas profundas sin crash.
-Fixture count < 2000 sin paginación.
- No más `world.getPlayer(...)` como función; usar helpers existentes.

## 10. Orden de implementación
1. `types` + `data/static` ampliados.
2. `LeagueEngine` + simulación ligera/profunda.
3. `initWorld` + `loadRealClubs` genéricos.
4. `Scheduler` multi-liga.
5. Datos estáticos por continente (1 liga por país, mínimo viable).
6. Sistema de relaciones y tipo `Interaction`.
7. Extensión de `DialogueSystem`.
8. UI PeopleHub y vistas nuevas.
9. Migraciones y validaciones de save/load.
10. Performance tuning y fallbacks.
