# FM — Estado del Proyecto

## 🔵 Completado

### Motor de Partido
- Sustituciones (5 cambios máximo, modal 2 pasos)
- Tarjetas y faltas (amarilla >6, roja >12 o >8 en zona peligrosa, acumulación 5 amarillas → suspensión)
- Lesiones (según bravery+naturalFitness, días aleatorios, post-partido)
- Parte médico visual (panel rojo en SquadView)
- Lesiones graves (>30 días, evento especial, inbox)
- Historial de lesiones (`injuryHistory[]`, `injuryProneness`)
- Instrucciones tácticas activas (mentalidad, cierre, pase, tempo, contraataque, ancho)
- Córneres (15% gol si supera umbral de lanzador+salto)
- Tiros libres (12% gol en zona peligrosa >750)
- Efecto moral (multiplicador `0.95 + morale/1000`)
- Efecto forma (últimos 5 ratings, multiplicador `0.92 + avgForm/30`)
- Pase inteligente (peso por proximidad, focusPassing, usePlaymaker, targetMan)
- Distribución GK (short/long/clearance), saque de banda (THROW_IN)
- Gol + momentum (cambio moral), tácticas activadas (defensiveLine, timeWasting, longShots)
- Marcación hombre vs zona, target man, pases filtrados, centro, fuera de juego, penales
- Rating mejorado (clean sheet, pass completion, bonus posición), ventaja local (+0.15 rating)
- Quick sim mejorado (forma + tácticas + habilidad), auto-sub por lesión, big match temperament

### Partido UI
- Charla en descanso (min 45: motivar/exigir/calmar)
- Resumen post-partido con MVP
- Rueda de prensa pre-partido: 5 preguntas (objetivo, rival, planteamiento, estrella, derbi)
- Rueda de prensa post-partido: 4 preguntas (resultado, actuación, próximo, rumores)

### Competiciones
- Champion League formato suizo (36 equipos, 8 jornadas, playoff → R16 → QF → SF → F)
- Europa + El Conférence (fase grupo → knockouts)
- Copa América / Euro / AFCON (grupo → cuartos → semi final)
- Mundial Clubes (32 equipos, grupo → knockouts)
- Eliminatoria CONMEBOL (10 equipos round-robin)
- Eliminatoria UEFA (grupos → playoff)
- Mundial FIFA final (16 clasificados, 8 grupos, octavos → final)
- Copas domésticas: Copa del Rey, FA Cup, DFB Pokal, Coppa Italia, Coupe de France

### Selecciones Nacionales
- 45 equipos de 6 confederaciones
- `NationalTeamView` (plantilla con filtro por posición, fixtures, estadísticas, banderas)
- `MatchSimulator.simulateNationalTeamMatch()` con reputación y CA
- Sidebar "Selecciones" con top 10

### Scouting
- Vista con CA/PA, fortalezas, debilidades, personalidad
- Buscador por nombre y solicitar informe
- Filtros por posición, edad, CA mínimo
- Lista de seguimiento (bookmark)
- Presupuesto de escouting por club
- Rol de SCOUT generado automáticamente

### Inteligencia Artificial
- Compra en posiciones débiles (mínimos: 2 GK, 5 DEF, 4 MID, 2 FWD)
- Venta de excedentes
- Ofertas: aceptación/rechazo/contraoferta según valor/precio + reputación
- Renovación automática / liberación
- Jóvenes (16-22) PA≥140 para desarrollo futuro
- Reemplazo por edad (≥32 con decline → transferible)
- Cesiones ofrecidas/solicitadas

### Traspasos y Contratos
- Negociación con intentos limitados (3), aceptación según lealtad + salario
- Salario al cambiar de club y duración
- Contract Negotiation Modal para renovación
- Cesiones: `loanDetails`, `completeLoan`, `processLoanReturns`
- Cláusula de rescisión (3× valor, activable pagando)
- Agentes: 15% probabilidad, comisión 5-15%
- Prima de fichaje: 8% del traspaso + CA×200
- Cesión con opción de compra (`LOAN_TO_BUY`)
- Deadline Day: 31 enero, 31 agosto (actividad IA intensificada, inbox especial)

### Plantilla (Squad)
- `formRatings[]` con puntos de color (verde≥8, ama≥6, rojo<5) en columna "Forma"
- Ordenamiento: posición, nombre, edad, tendencia, salario, física, moral, valor
- Iconos de estado: lesión, suspensión, transferible, contrato
- Negrita para titulares
- Barra sub-21 (progreso minutos)

### Cantera y Desarrollo
- Hornada anual el 1 de agosto según instalaciones (`youthRecruitment`, `youthFacilities` 1-20)
- Regiones de captación (`scoutingRegion`)
- Préstamos de jóvenes U17-U21 por IA
- Curvas de desarrollo: 6 fases (EARLY_WITH/YOUTH/EARLY_PRIME/PRIME/LATE_PRIME/VETERAN)
- Promoción automática al primer equipo (CA≥100) y liberación (PA<100)
- Desarrollo mensual (`developYouthPlayers`)

### Rueda de Prensa
- Pre-partido: 5 preguntas (objetivo, rival, planteamiento, jugador estrella, derbi)
- Post-partido: 4 preguntas (resultado, actuación, próximo, rumores)
- Efecto en moral de equipo y confianza de directiva
- Detección automática de mejor goleador

### Crónicas Automatizadas
- Crónica de partido (3-4 líneas tras cada partido)
- Crónica mensual (5-7 líneas al cambio de mes)
- Crónica de carrera (10-15 líneas al finalizar partida)
- `ChronicleView` con filtros (Todos/Partido/Mensual/Carrera)
- Sidebar: botón "Crónicas" (BookOpen)
- Generación en paths: avance diario, vacaciones, hacia próximo partido
- Persistencia: guardado y cargado con la partida

### Ficha de Entrenador (Manager Profile)
- `ManagerProfile` con datos personales, carrera, histórico, relaciones
- SETUP_USER con nacionalidad (15 países), origen (exjugador/cantras/jornalista), fecha nacimiento
- Actualización tras cada partido: W/D/L, goles, jugador clave
- Actualización tras fin de temporada: temporada+1, títulos, relaciones (directiva/prensa/afición), objetivo
- `ManagerProfileView` con stats, títulos, relaciones, historial de clubes
- Objetivo según reputación relativa del club vs liga
- Sidebar: "Mi Carrera" (User icon)
- `clubHistory` se popula: seasons incrementado cada temporada, títulos al ganar

### Directiva (Board)
- BoardView con confianza, saldo, presupuesto
- Mejora de instalaciones de entrenamiento/juveniles
- Aumento de presupuesto extra si confianza alta
- `evaluateBoardConfidence` según objetivos, liga, copas, selecciones

### Mensajes (Inbox)
- 6 categorías: MARKET, SQUAD, STATEMENTS, FINANCE, COMPETITION, SCOUTING
- Acciones: botón "Acción Requerida" con destino según categoría

### Prensa y Medios
- `MediaView` con portada de periódico
- Tipos: HEADLINE, FEATURE, RUMOR, CRITICISM, PRAISE
- Generación automática en eventos de partidos

### UI/UX
- Tema oscuro (toggle sol/luna, CSS variables, persistencia)
- Onboarding 8 pasos (`OnboardingTour`)
- Responsive (vista tablet en SquadView/LeagueTable, BottomNav)
- Teclas rápidas: Space, Esc, M, T, S
- Auto-save (toggle), lotes de 7 días en vacaciones
- Notificaciones push del navegador
- Múltiples slots de guardado IndexedDB
- Loading skeletón
- FM Steel-Gray homogeneizado (todas las vistas migradas)
- FMLoadingOverlay con spinner, progress bar, cancel button (vacaciones)
- Selección de liga 2 pasos: país con bandera → liga filtrada
- ClubReport: vista de información del club (equipación, palmarés, presupuestos)

### Open‑Football‑Database
- 54,645 jugadores reales, 570 clubes, 35 ligas en 30+ países
- Atributos FM posiciones convertidos a Position enum
- CA/PA convertidos a 1-20 (Fórmula weighted por posición)
- JSON servidos estáticamente (fetch al arranque, no bund)
- Selección de liga al crear partida (las 35 disponibles)
- 33 países con banderas (COUNTRY_CODES), 26 nacionalidades (NATIONS)
- Performance: club caching con TTL, invalidación en mutaciones de clubId

---

## 🟡 Recientemente Completado
- Motor de partido refinado (3 fases):
  - Pase inteligente (peso por proximidad, focusPassing, usePlaymaker, targetMan)
  - Distribución GK (short/long/clearance), saque de banda (THROW_IN)
  - Gol + momentum (cambio moral), tácticas activadas (defensiveLine, timeWasting, longShots)
  - Marcación hombre vs zona, target man, pases filtrados, centro, fuera de juego, penales
  - Rating mejorado (clean sheet, pass completion, bonus posición), ventaja local (+0.15 rating)
  - Quick sim mejorado (forma + tácticas + habilidad), auto-sub por lesión, big match temperament
- Homogeneización visual FM Steel-Gray (`bg-[#d4dcd4]`, `border-[#a0b0a0]`, `bg-white`)
  - Todas las vistas migradas: MatchView, PreMatchView, PressConferenceView, MediaView
  - ChronicleView, ManagerProfileView, Sidebar, BottomNav, TrainingView, StaffView
  - FMUI: FMSpinner, FMProgressBar, FMLoadingOverlay
- Vacaciones async con progreso visual (FMLoadingOverlay, cancel button, día actual)
- Selección de liga 2 pasos: país → liga (SETUP_COUNTRY con banderas, SETUP_LEAGUE filtrado)
- Player flags: COUNTRY_CODES 33 países, NATIONS 26 países, Perú normalizado con tilde
- Performance: club caching con TTL (`playersByClubCache`, `clubByIdCache`), `invalidateClubCache()`
- **Elegir Manager Existente al inicio:** nueva pantalla SETUP_EXISTING_MANAGER con ~22 DTs reales de las ligas del juego (Guardiola, Ancelotti, Simeone, Flick, Klopp-like Slot, Arteta, Mourinho, Farioli, Gallardo, Abel Ferreira, etc.). Cada uno con atributos personalizados (coaching, tacticalKnowledge, manManagement, motivation, etc.), personalidad, reputación e historial. Click → si tiene club, toma posesión directa (skipea selección de país/liga/equipo); si está desempleado (Simeone, Gallardo), va al flujo normal de selección de club. Nuevo método `createExistingManager` en WorldManager reemplaza al HEAD_COACH AI con los datos del manager real. Helpers: `AttrBar` component, datos en `REAL_MANAGERS` array en data/static.ts
- **8 Features nuevos:**
  - League Stats: pestaña con goleadores, asistencias y mejor XI por posición en LeagueTable
  - Formaciones UI: grid visual de mini-canchas en TacticsView (reemplaza dropdown)
  - Comparar jugadores: modal lado a lado con atributos, stats, forma y barras de comparación
  - Bracket visual: árbol de eliminación directa en TournamentHub para copas/knockouts
  - Free agents: pestaña "Libres" en MarketView con pool de jugadores sin club
  - Awards: pestaña "Premios" en TournamentHub (goleador, asistidor, mejor calificación, mejor joven)
  - Historial financiero: tabla de últimos 12 meses en EconomyView (ingresos, egresos, neto, balance)
  - Match speed: botones 1x/2x/4x en barra del partido para controlar velocidad de simulación
- Fix ClubReport no conectado en App.tsx (case 'CLUB_REPORT' agregado)
- Fix `primaryPosition` añadida a interfaz Player (asignada en worldManager pero invisible a TS)
- Fix staff.history: se popula al final de cada temporada en processEndOfSeason
- Fix managerProfile.clubHistory: `seasons` se incrementa cada temporada (no solo al ganar títulos)
- Fix import muerto TacticalReport eliminado de engine.ts
- Fix `isInVacation` no destructurado en App.tsx
- Fix `player.secondaryPositions?.map` optional chaining en PlayerModal
- Fix `widthSetting` scoping en engine.ts (declaración movida antes, duplicados eliminados)
- Fix `wouldDropBelowMinimums` implementado en WorldManager
- Fix `ChevronLeft` import faltante en App.tsx
- GitHub push a https://github.com/CarlosDimare/FM2

---

## ⚠️ Faltan / Bugs

### Bugs activos
- Sin bugs activos pendientes

---

*Última actualización: 30 julio 2026*