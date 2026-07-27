# FM Argentina — Mejoras Implementadas

## 🟢 Completadas

### Motor de Partido
- **Sustituciones** — 5 cambios máximos, modal en 2 pasos (reemplazado → sustituto), evento SUBSTITUTION
- **Tarjetas y faltas** — Faltas según entrada+agresión, amarilla (>6), roja (>12 o >8 en zona peligrosa), acumulación de 5 amarillas → suspensión
- **Lesiones** — Según bravery+naturalFitness, días de recuperación aleatorios, aplicadas post-partido
- **Instrucciones tácticas** — Mentalidad afecta remate, cierre afecta presión, estilo de pase agrega penalización, tempo afecta tiempo consumido, ancho afecta spread, contraataque agrega boost
- **Saques de esquina** — Centro desde córner con calidad del lanzador + salto del atacante vs defensa, 15% de gol si supera umbral
- **Tiros libres** — Faltas en zona peligrosa (>750) activan tiro libre directo, calidad según freeKickTaking, 12% de opción de gol
- **Estadísticas de balón parado** — Córners y tiros libres registrados en TeamMatchStats

### Partido (UI)
- **Charla técnica en el descanso** — Modal al minuto 45 con 3 opciones: Motivar (+15 moral), Exigir más (-5 moral), Mantener calma (+5 moral)
- **Resumen post-partido con MVP** — Modal al minuto 90 con resultado final, ratings de jugadores por puntuación, MVP destacado con corona 👑

### Ojeo (Scouting)
- **Vista Scouting** — Lista de informes con CA/PA, fortalezas, debilidades, personalidad
- **Buscador de jugadores** — Buscar por nombre y solicitar informe bajo demanda
- **Filtros avanzados** — Posición (13 opciones), rango de edad, CA mínimo
- **Columna de forma** — Promedio de últimos 5 partidos visible en resultados
- **Lista de seguimiento** — Botón bookmark para agregar/quitar jugadores de seguimiento
- **Presupuesto de scouting** — `scoutingBudget` por club, se gasta al generar informes
- **Rol Scout** — Nuevo `StaffRole.SCOUT` con mayor `judgingAbility`/`judgingPotential`, generado automáticamente en cada club

### Competiciones
- **Registro de plantilla** — Límite de 28 jugadores y mínimo 4 sub-21 para L_ARG_1 y L_ARG_2, verificado al iniciar temporada
- **Inscripción continental** — Clasificación a Libertadores/Sudamericana según posición en liga
- **Regla sub-21 en partido** — 600 minutos mínimos acumulados por temporada; penalización de hasta 6 puntos en tabla
- **Sanciones económicas** — $5,000 de multa automática por cada tarjeta roja
- **Premios económicos** — Distribución por posición en liga (25%/15%/8%/3% del prize pool) y copas (50% al campeón)

### Inteligencia Artificial (Clubes)
- **Compra IA** — Clubes compran en posiciones débiles según profundidad de plantilla (mínimos: 2 GK, 5 DEF, 4 MID, 2 FWD)
- **Venta IA** — Clubes marcan como transferibles a los jugadores excedentes (GK>2, DEF>6, MID>6, FWD>3)
- **Ofertas pendientes** — `processPendingOffers` acepta/rechaza/contraoferta según relación valor/precio + reputación
- **Renovaciones automáticas** — `checkRenewalTriggers` renueva o libera agentes libres con presupuesto salarial

### Traspasos y Contratos
- **Negociación real** — `submitContractOffer` con intentos limitados (3), aceptación según lealtad + salario, posibilidad de ruptura
- **Salario post-traspaso** — `completeTransfer` asigna nuevo salario y duración de contrato al cambiar de club
- **Renovación desde PlayerModal** — Modal `ContractNegotiationModal` con selector de salario y años
- **Cesiones** — `loanDetails` en Player, `completeLoan` con wageShare, IA ofrece/solicita cesiones, `processLoanReturns` al finalizar temporada

### Plantilla (Squad)
- **Forma del jugador** — `formRatings[]` con últimos 5 partidos, puntos de color (verde≥8, amarillo≥6, rojo<5) en columna "Forma"
- **Ordenamiento** — Por posición, nombre, edad, tendencia, salario, física, moral, valor
- **Iconos de estado** — Lesión, suspensión, transferible, problemas de contrato
- **Indicador de titular** — Negrita para titulares
- **Barra sub-21** — Progreso de minutos juveniles (0/600) visible en SquadView con indicador verde/ámbar

### Carrera del Técnico
- **Reputación** — `managerReputation` (1-100), sube con victorias y títulos
- **Ofertas de trabajo** — `checkManagerJobOffers`, clubes con mayor reputación ofrecen trabajo cuando la reputación del técnico es ≥60
- **Historial** — PJ, G, E, P, GF, GC, racha, títulos, temporadas completadas

### Directiva (Board)
- **Vista Directiva** — BoardView con confianza de la directiva, saldo, presupuesto
- **Mejora de instalaciones** — Solicitar mejora de entrenamiento o juveniles, costo = nivel² × 50,000, probabilidad según confianza
- **Aumento de presupuesto** — Solicitar +30% del presupuesto de fichajes
- **Confianza dinámica** — `evaluateBoardConfidence` según objetivo de temporada y resultados

### Mensajes (Inbox)
- **Categorías** — MARKET, SQUAD, STATEMENTS, FINANCE, COMPETITION, SCOUTING
- **Nuevos mensajes** — Parte médico, próximo a recuperarse, ofertas de trabajo, traspasos completados, rechazo/aprobación de mejoras, registro de plantilla
- **Acciones** — Botón "Acción Requerida" para MARKET→Fichajes, SQUAD→Plantilla, COMPETITION→Tabla, STATEMENTS→Ver Club

### Deuda Técnica
- ✅ Tailwind CSS local (npm package v3 + PostCSS) en lugar de CDN — funciona offline, precacheado por PWA
- ✅ Flag CDN cache — runtimeCaching para flagcdn.com en workbox
- ✅ Limpieza enum Position — eliminados 7 valores duplicados (DRC, DLC, MCR, MCL, AMC, STC, DMC)
- ✅ Código muerto — eliminados `advanceTime`/`simulateDay` no utilizados de gameStore.ts
- ✅ Bugfix: `simulateToNextMatch` — ya no simula el partido del usuario
- ✅ Bugfix: `advanceTime` desde SENIOR_TACTICS — navega a PRESS_CONFERENCE_PRE en día de partido

### Varios
- **Auto-save** — Toggle en el encabezado, guarda antes de cada avance
- **Teclas rápidas** — Space (avanzar), Esc (volver), M (Mercado), T (Táctica), S (Plantilla)
- **Vacaciones optimizadas** — Procesa en lotes de 7 días, 52 re-renders vs 365
- **Notificaciones granulares** — `notifyPlayers`, `notifyClubs`, `notifyInbox`, `notifyOffers`, `notifyTactics`
- **Valor dinámico de jugadores** — Recalculado mensualmente según forma (últimos 5), edad (pico 26), y duración de contrato
- **Cantera** — `generateYouthIntake` ejecutado el 1 de agosto, genera juveniles según nivel de instalaciones
- **Múltiples slots de guardado** — IndexedDB con nombre personalizado, lista en modal de carga/guardado, sobrescritura rápida
- **Tema oscuro** — CSS variables + clase `dark` en html, toggle persistente en guardados
- **IA fichajes a largo plazo** — Clubes fichan jóvenes (16-22) con PA≥140 para desarrollo futuro
- **IA reemplazo por edad** — Clubes marcan transferibles a jugadores ≥32 con tendencia declinante
- **Cláusula de rescisión** — `releaseClause` 3x valor en cada jugador, activable pagando el monto (salta negociación)
- **Ingresos por taquilla** — Partidos como local generan ingreso según capacidad del estadio y tipo de competición
- **Loading states** — Esqueleto de carga animado en modal de simulación

---

## 🟡 Pendientes / Por Hacer

### Motor de Partido (Profundización)
- [ ] **Efecto de moral en rendimiento** — La moral del jugador debería afectar atributos durante el partido (implementado parcialmente en getEffectiveAttribute)
- [ ] **Efecto de forma en rendimiento** — Últimos 5 ratings deberían influir en el rendimiento (implementado parcialmente en getEffectiveAttribute)

### Inteligencia Artificial (Profundización)
- [ ] **Fichajes a largo plazo** — IA debería fichar jóvenes con potencial, no solo necesidad inmediata (implementado)
- [ ] **Cesiones** — IA debería aceptar/solicitar cesiones de jugadores (implementado básico)
- [ ] **Reemplazo por edad** — IA debería reemplazar jugadores mayores de 32 (implementado)
- [ ] **Precios dinámicos** — Valor de jugador debería fluctuar según rendimiento y edad (implementado)

### Lesiones
- **Parte médico visual** — Panel rojo en SquadView con jugadores lesionados: nombre, tipo de lesión, días restantes
- **Lesiones graves** — Lesiones >30 días con evento especial
- **Historial de lesiones** — Registrar lesiones pasadas, propensión a lesiones

### Contratos (Profundización)
- **Cláusula de rescisión** — `releaseClause` en Player (3x valor), `makeTransferOffer` acepta automáticamente si ≥ cláusula, IA usa cláusulas
- **Agentes** — Representantes con exigencias de comisión
- **Primas de fichaje** — Bono por firmar, primas por objetivos
- **Cesiones con opción de compra** — Tipo de oferta LOAN_TO_BUY (implementadas cesiones básicas)

### Competiciones (Profundización)
- **Fase de grupos** — Fixture calendario para Libertadores y Sudamericana (ya implementado con `generateContinentalGroups`, 8 grupos de 4, ida/vuelta)

### Cantera y Desarrollo
- [ ] **Calidad de hornada según captación** — `youthRecruitment` como atributo del club (implementado via youthFacilities)
- [ ] **Regiones de captación** — Asignar regiones para buscar talento
- [ ] **Préstamos de jóvenes** — Enviar a juveniles a préstamo para desarrollo
- [ ] **Curvas de desarrollo por edad** — Refinar curvas existentes para YOUNG/PRIME/VETERAN

### UI/UX
- **Tema oscuro** — Toggle en encabezado (luna/sol), CSS variables, persistencia en guardado (`darkMode` en gameStore)
- **Onboarding** — Tutorial interactivo para nuevos jugadores
- **Notificaciones push** — Para PWA cuando el juego está en segundo plano
- [ ] **Responsive** — Probar y ajustar para tablets

### Guardado
- **Múltiples slots** — Lista de guardados con nombre personalizado, fecha, equipo (mejorado: selector en modal y sobrescritura desde el mismo)
- [ ] **Cloud save** — Sincronización con IndexedDB/localStorage
- [ ] **Guardado en rasgo (profile)** — Guardar por perfil de manager

### Economía
- [ ] **Ingresos mensuales** — Abonos, patrocinios, merchandising
- [ ] **Gastos mensuales** — Sueldos del staff, mantenimiento
- [ ] **Presupuesto dinámico** — Ajustes de presupuesto según rendimiento financiero

### Red Social / Multijugador
- [ ] **Clasificaciones online** — Comparar logros con otros managers
- [ ] **Compartir partidas** — Exportar/importar saves
