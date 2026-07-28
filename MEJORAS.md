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
- Onboarding 6 pasos (`OnboardingTour`)
- Responsive (vista tablet en SquadView/LeagueTable, BottomNav)
- Teclas rápidas: Space, Esc, M, T, S
- Auto-save (toggle), lotes de 7 días en vacaciones
- Notificaciones push del navegador
- Múltiples slots de guardado IndexedDB
- Loading skeletón

### Open‑Football‑Database
- 54,645 jugadores reales, 570 clubes, 35 ligas en 30+ países
- Atributos FM posiciones convertidos a Position enum
- CA/PA convertidos a 1-20 (Fórmula weighted por posición)
- JSON servidos estáticamente (fetch al arranque, no bund)
- Selección de liga al crear partida (las 35 disponibles)

---

## 🟡 Recientemente Completado
- Crónicas (MATCH/MONTHLY/CAREER con ChronicleView y sidebar)
- Entrenador (ManagerProfile + vista + setup + actualización en tiempo real)
- Selección de ligas (35 disponibles, no solo Argentina)
- Fix SquadView crash (`formRatings` undefined)
- Fix `seasonStats` undefined en jugadores convertidos

---

## ⚠️ Faltan / Bugs

### Bugs activos
- [ ] Transferencia saliente no actualiza bien mínimos de plantilla
- [ ] Vacaciones largas pueden abrir 2 ruedas de prensa simultáneas
- [ ] loadSave: reconstrucción de selecciones a veces vacías
- [ ] Onboarding desactualizado (faltan steps Crónicas y Mi Carrera)
- [ ] Errores TS existentes: ErrorBoundary state/props, standing variable, `firstName` en Player

### Mejoras sugeridas
- [ ] Familiaridad táctica (forma se mejoran con tiempo)
- [ ] Personalidad de jugador (leadership, consistency, big-match temperament)
- [ ] Clubes en deuda → takeover (venta desesperada de activos o insolvencia)
- [ ] Salario del staff según economía del país/liga
- [ ] Historial de competitión de los partidos (records)
- [ ] Actualizar pasos del Onboarding para incluir el nuevo recorrido
- [ ] PWA cache streaming para los 18MB de JSON generados en `public/data/`
- [ ] Calendario de torneos del año inicial (loseir año si la liga empezó otro año)

---

*Última actualización: julio 2026*