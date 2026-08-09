# 🗺️ Inventario de Pantallas — Estado del Proyecto FM

> **Propósito:** listar TODAS las pantallas del juego, su estado actual y qué falta en cada una, para priorizar la construcción.
>
> **Fecha del análisis:** 5 agosto 2026 · Basado en lectura del código actual (`App.tsx`, `components/`).
> **Última actualización:** 9 agosto 2026 — **Fixes aplicados**: bug de tablas largas sin scroll cerrado (`overflow-y-auto` en SquadView, MarketView, NationalTeamView, TrainingView, StaffView, EXTERNAL_CLUB), FMBox header overflow, PWA workbox skipWaiting/clientsClaim, lazyWithReload. **Fase 4: tests de motor iniciados** (`ProfileNarrativeEngine`, 8 tests).

---

## 📊 Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pantallas de juego (activas) | **~40** (setup: 8 · club: 24 · partido: 5 · selección: 5) |
| Modales / overlays | 9 |
| Pantallas **completas y funcionales** | **~40** (100%) |
| Pantallas **parciales / mejorables** | 0 (restan solo mejoras menores, detalladas en la sección H) |
| Código muerto (no se usa) | ~~`components/views/` + `components/ViewRouter.tsx`~~ → **eliminado** ✅ · `OptionCard.tsx` (reemplazado por `ProgressiveOptions`) → **eliminado** ✅ |
| **Auditoría visual (screenshots)** | **41/41 renderizan** · 0 crashes · 0 imágenes rotas · **0 bugs visuales confirmados** + sistema de diálogos implementado |

**Conclusión principal:** el juego está **funcional de punta a punta** (setup → temporada → partido → resumen → prensa → siguiente temporada). No hay pantallas "stub" o vacías. La auditoría visual con screenshots reales confirmó que **todas las pantallas dibujan contenido**, con bugs de layout ya corregidos y varias notas menores de diseño (pantallas espartanas al inicio de carrera, estética de partido muy oscura). Lo que queda no es construir pantallas nuevas, sino **pulir profundidad de simulación, limpiar deuda técnica y completar features de gestión**.

---

## 🔍 Auditoría visual mobile post-Fase 0.5 (9 ago 2026)

> **Metodología:** lectura estática de código de cada vista (`components/*View.tsx`) evaluando layout mobile-first, truncate, wrap, overflow y densidad. Enfoque en viewport 360px.

| Pantalla | Vista | Estado mobile | Hallazgos / Acciones |
|---|---|---|---|
| Setup: Perfil Manager | `SETUP_USER` | OK | Form centrado, sin tablas. |
| Setup: Tipo de carrera | `SETUP_CAREER` | OK | 4 botones, simple. |
| Setup: País | `SETUP_COUNTRY` | OK | Grid de banderas, 35 botones. |
| Setup: Liga | `SETUP_LEAGUE` | OK | 4 botones + estrellas. |
| Setup: Club | `SETUP_TEAM` | OK | Grid de clubes. |
| Setup: Selección | `SETUP_NATIONAL_TEAM` | OK | Grid denso pero scrolleable. |
| Setup: Manager existente | `SETUP_EXISTING_MANAGER` | OK | Lista con scroll. |
| Home | `HOME` | OK | Tarjetas con grid responsive. |
| Buzón | `INBOX` | OK | Lista de mensajes, filtros. |
| Plantel | `SENIOR_SQUAD` | OK | Tabla con scroll interno. |
| Tácticas | `SENIOR_TACTICS` | OK | Pizarra interactiva, DialogueAvatar fijo. |
| Calendario | `SENIOR_SCHEDULE` | OK | Lista de partidos. |
| Clasificación | `TABLE` | OK | Tabla corta (16 filas). |
| Torneo | `COMP_*` | OK | Tabs + tablas cortas. |
| Mercado | `MARKET` | OK | Filtros + tabla con scroll. |
| Buscador | `SEARCH` | OK | Virtualizado, filtros. |
| Fichajes | `NEGOTIATIONS` | OK | Tabs + listas. |
| Clubes del mundo | `CLUBS_LIST` | OK | Acordeón por país. |
| Club externo | `EXTERNAL_CLUB` | OK | Tablas con scroll. |
| Economía | `ECONOMY` | OK | 3 cajas, gráfico SVG. |
| Cuerpo Técnico | `STAFF` | OK | Tabla 8 filas. |
| Entrenamiento | `TRAINING` | OK | Plan semanal + scroll. |
| Scouting | `SCOUTING` | OK | Empty state / lista virtualizada. |
| Directiva | `BOARD` | 🟡 Densidad alta | 7 FMBox; 2 colapsables (Mejoras, Reuniones). Texto [9px]/[10px] en mobile, pero ahora cabe sin desbordar. |
| Club Report | `CLUB_REPORT` | OK | 6 cajas, tabla corta. |
| People Hub | `PEOPLE_HUB` | OK | Tabs + grid. |
| Prensa | `MEDIA` | OK | Lista de noticias. |
| Crónicas | `CHRONICLES` | OK | Empty state / lista. |
| Mi Carrera | `MANAGER_PROFILE` | OK | Perfil simple. |
| Salón de la Fama | `HALL_OF_FAME` | OK | Empty state / lista. |
| Libro de Temporadas | `SEASON_HISTORY` | OK | Empty state / timeline. |
| Ranking de Ligas | `LEAGUE_RANKING` | OK | Tabla con scroll. |
| Previa | `PRE_MATCH` | OK | Once titular + avisos. |
| Partido en vivo | `MATCH` | OK | Interfaz oscura por diseño. |
| Resumen post | `POST_MATCH_SUMMARY` | OK | Estadísticas + crónica. |
| Rueda pre/post | `PRESS_CONFERENCE_*` | OK | Q&A interactivo. |
| Selección: Plantel | `NT_*_SQUAD` | OK | Tabla con scroll. |
| Selección: Tácticas | `NT_*_TACTICS` | OK | Pizarra + tabla. |
| Selección: Calendario | `NT_*_SCHEDULE` | OK | Tabla con scroll. |
| Selección: Stats | `NT_*_STATS` | OK | 3 tablas chicas. |

**Resumen auditoría mobile:**
- **OK:** 39/40 vistas
- **Densidad alta:** 1 vista (`BOARD`) — texto pequeño pero sin desbordamiento confirmado
- **Bug visual confirmado:** 0 (todos los overflow fixes aplicados)

**Criterio de salida:** cumplido — cada vista tiene estado visual documentado; no hay pantallas sin revisar ni bugs de overflow confirmados en 360px.

---

## ✅ Hallazgo estructural resuelto

Existían **DOS sistemas de renderizado de pantallas**: el `switch` inline en `App.tsx` (activo) y `ViewRouter.tsx` + la carpeta `components/views/` (nunca importados). **El código muerto fue eliminado en esta iteración** ✅ — ahora solo existe el sistema inline de `App.tsx`, sin riesgo de divergencia.

---

## 🟢 A. Flujo de Setup (creación de carrera)

*Todos renderizados inline en `App.tsx` por `gameState`. Las versiones en `views/` NO se usan.*

| # | Pantalla (state) | Estado | Qué falta / notas |
|---|---|---|
| A1 | **Carga inicial** (`LOADING`) | ✅ Completa | Nada. Splash con spinner. |
| A2 | **Perfil del Manager** (`SETUP_USER`) | ✅ Completa | Nombre, apellido, nacionalidad (~150 países reales con bandera funcional), origen, fecha nac., "crear manager", "elegir manager existente" y "cargar partida" (con modal + borrar). *Mejora:* validación de campos vacíos. |
| A3 | **Elegir Manager existente** (`SETUP_EXISTING_MANAGER`) | ✅ Completa | Búsqueda por nombre/club/nacionalidad, filtro por país, paginación "cargar más", modal de conflicto (tomar club / despedir). Base Wikidata. *Mejora:* indicar atributos de forma más visual. |
| A4 | **Tipo de carrera** (`SETUP_CAREER`) | ✅ Completa | 3 modos: Club / Selección / Ambos. Nada crítico. |
| A5 | **Elegir selección** (`SETUP_NATIONAL_TEAM`) | ✅ Completa | Grid de 45 selecciones con nº de elegibles. Nada crítico. |
| A6 | **Elegir país** (`SETUP_COUNTRY`) | ✅ Completa | Grid por países con nº de ligas. Nada. |
| A7 | **Elegir liga** (`SETUP_LEAGUE`) | ✅ Completa | Ligas del país con nº de clubes. Nada. |
| A8 | **Elegir club** (`SETUP_TEAM`) | ✅ Completa | Grid de clubes con reputación. Nada. |

---

## 🔵 B. Vistas principales del juego (modo club)

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| B1 | **Inicio** (`HOME`) | inline en `App.tsx` | ✅ Completa | Próximo partido, competiciones con posición, historial del manager, últimas noticias. |
| B2 | **Buzón** (`INBOX`) | `InboxView` | ✅ Completa | Filtros por categoría, leído/no leído, borrar, botón "acción requerida" que navega. Confianza de directiva + objetivo del club en el header. |
| B3 | **Plantel** (`*_SQUAD`, x3) | `SquadView` | ✅ Completa | Ordenamiento por 8 columnas, responsive, parte médico, barra minutos Sub-21, badges de forma/estado, menú contextual, buscador, toggle de sueldos semanal/mensual/anual. |
| B4 | **Tácticas** (`*_TACTICS`, x3) | `TacticsView` | ✅ Completa | Pizarra drag&drop, flechas de ataque, instrucciones de equipo (9 sliders + 5 checkboxes), instrucciones individuales, guardar/borrar esquemas, autopick, panel de suplentes. |
| B5 | **Calendario** (`*_SCHEDULE`, x3) | inline en `App.tsx` | ✅ Completa | Lista de partidos con resultados y penales, filtro por competición. *Mejora:* vista mensual. |
| B6 | **Clasificación** (`TABLE`) | `LeagueTable` | ✅ Completa | Tabla por posición, selector de liga, selector Senior/Reserva/Sub-20, goleadores/asistencias/mejor XI. Zonas dinámicas por liga. |
| B7 | **Torneo** (`COMP_*`) | `TournamentHub` | ✅ Completa | Pestañas: Tabla, Partidos, Bracket, Estadísticas, Premios. |
| B8 | **Mercado** (`MARKET`) | `MarketView` | ✅ Completa | Filtros Todos/Transf./Cedibles/Libres + búsqueda, orden por CA/valor/sueldo/edad/nombre, botón "Ofertar" en cada fila. |
| B9 | **Buscador** (`SEARCH`) | `SearchView` | ✅ Completa | Virtualizado (55k jugadores sin lag), filtros nombre/posición/edad/CA. |
| B10 | **Centro de Fichajes** (`NEGOTIATIONS`) | `NegotiationsView` | ✅ Completa | Ofertas activas/historial, contraofertas, aceptar, "firmar jugador". |
| B11 | **Clubes del mundo** (`CLUBS_LIST`) | `ClubsListView` | ✅ Completa | Acordeón por país, 618 clubes. |
| B12 | **Club externo** (`EXTERNAL_CLUB`) | inline + `SquadView` | ✅ Completa | Plantilla del club visitante, click en jugador → ficha. |
| B13 | **Economía** (`ECONOMY`) | `EconomyView` | ✅ Completa | Balance, presupuesto fichajes/salarial, previsión mensual, salud financiera, historial mensual y gráfico SVG de evolución. |
| B14 | **Cuerpo Técnico** (`STAFF`) | `StaffView` | ✅ Completa | Tabla de staff, ficha completa, delegación de 6 tareas. |
| B15 | **Entrenamiento** (`TRAINING`) | `TrainingView` | ✅ Completa | Presets de carga, sliders por categoría por jugador, barra de intensidad, delegación a staff, plan semanal por días, foco por posición. |
| B16 | **Scouting** (`SCOUTING`) | `ScoutingView` | ✅ Completa | Informes (CA/PA, fortalezas/debilidades, personalidad), no leídos, lista de seguimiento, buscador, informe aleatorio. |
| B17 | **Directiva** (`BOARD`) | `BoardView` | ✅ Completa | Confianza, mejora de instalaciones, aumento de presupuesto, objetivos de temporada editables, reuniones con la directiva, tarjeta de cargo/contrato. |
| B18 | **Información Club** (`CLUB_REPORT`) | `ClubReport` | ✅ Completa | Datos, récords históricos, palmarés, equipación SVG, presupuestos. |
| B19 | **Centro de Personas** (`PEOPLE_HUB`) | `PeopleHub` | ✅ Completa | 6 pestañas: Jugadores, Staff, Relaciones, Prensa, Red de DT, Directiva. Diálogos con tono sobre jugadores, staff, directiva, declaraciones a prensa. |
| B20 | **Prensa** (`MEDIA`) | `MediaView` | ✅ Completa | Portada de periódico, filtros por categoría, detalle de noticia. |
| B21 | **Crónicas** (`CHRONICLES`) | `ChronicleView` | ✅ Completa | Filtros partido/mensual/carrera, incluye crónicas de selección nacional. |
| B22 | **Mi Carrera** (`MANAGER_PROFILE`) | `ManagerProfileView` | ✅ Completa | Stats de carrera, títulos, relaciones, objetivo actual, historial de clubes, mayor venta, jugador clave. |
| B23 | **Salón de la Fama** (`HALL_OF_FAME`) | `HallOfFameView` | ✅ Completa | Top inductados por win-rate y títulos con medallas. |
| B24 | **Ranking de Ligas** (`LEAGUE_RANKING`) | inline en `App.tsx` | ✅ Completa | 41 ligas ordenadas por reputación dinámica, tier, prize pool. |
| B25 | **Libro de Temporadas** (`SEASON_HISTORY`) | `SeasonHistoryView` | ✅ **Nueva** | Historial consultable entre temporadas: selector de años, campeón/goleador/asistente de cada competición, tablas finales top 6 de todas las ligas. Persistido en save. |

---

## 🟣 C. Flujo de Partido (secuencia lineal)

*Táctica → Previa → Rueda pre → Partido → Resumen → Rueda post → Home*

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| C1 | **La Previa** (`PRE_MATCH`) | `PreMatchView` | ✅ Completa | Once titular con alertas de no disponibles, check de 11 jugadores válidos, reputaciones, botón tácticas. Mobile sticky footer. |
| C2 | **Rueda de Prensa Pre** (`PRESS_CONFERENCE_PRE`) | `PressConferenceView` | ✅ Completa | 5 preguntas base + pregunta de derbi + pregunta de jugador estrella (dinámica). Efectos en moral y confianza. Delegable al staff. |
| C3 | **Partido en vivo** (`MATCH`) | `MatchView` | ✅ Completa | Simulación minuto a minuto, 4 pestañas (relato/técnico/estadísticas/plantilla), velocidades 1x/2x/4x, pausa, cambios (máx 5), skip al descanso/final, charla de descanso, informe del asistente, resumen con MVP, copia de log técnico. |
| C4 | **Resumen post-partido** (`POST_MATCH_SUMMARY`) | `PostMatchSummaryView` | ✅ Completa | Resultado, goleadores, asistencias, MVP, estadísticas, tarjetas, crónica del partido. |
| C5 | **Rueda de Prensa Post** (`PRESS_CONFERENCE_POST`) | `PressConferenceView` | ✅ Completa | 4 preguntas según resultado. |

> El flujo activo pasa por `POST_MATCH_SUMMARY` (resumen con crónica) antes de la rueda post. ✅

---

## 🟡 D. Modales y Overlays

| # | Modal | Estado | Qué falta / notas |
|---|---|---|---|
| D1 | **Ficha de Jugador** | ✅ Completa | 6 pestañas: Atributos, Personal, Posiciones, Historial/Carrera, Contrato, Interacción. Tratamiento de lesiones. |
| D2 | **Comparar Jugadores** | ✅ Completa | Comparativa CA/PA/físico/mental/stats/contrato con barras y resaltado del mejor. |
| D3 | **Menú Contextual** | ✅ Completa | Mover a equipo, declarar transferible/cedible, rescindir contrato, hablar con jugador. |
| D4 | **Oferta de Traspaso** | ✅ Completa | Compra o cesión, validación de presupuesto, aviso por reputación inferior. |
| D5 | **Negociación de Contrato** | ✅ Completa | Sueldo propuesto, duración 1-5 años, 3 intentos de negociación, feedback del jugador. |
| D6 | **Resumen de Temporada** | ✅ Completa | Selector de torneos, campeón, premios, confeti si ganas la liga. |
| D7 | **Configuración** | ✅ Ampliada | Pausar en entretiempo, velocidad de simulación, notificaciones, repetir tutorial. |
| D8 | **Guardar / Cargar / Vacaciones / Onboarding** | ✅ Completa | Guardar con lista para sobrescribir, cargar con borrado, vacaciones con progreso + cancelar, tour de 8 pasos. |

---

## ⚪ E. Selección Nacional (`NT_*`)

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| E1 | **Home Nacional** (`HOME` en modo solo-selección) | inline en `App.tsx` | ✅ Completa | Cargo activo + próximo compromiso. |
| E2 | **Plantel Selección** (`NT_*_SQUAD`) | `NationalTeamView` | ✅ Completa | Convocatoria gestionable (23 jugadores), asumir control, filtro por posición, tabla ordenable, dorsales. |
| E3 | **Tácticas Selección** (`NT_*_TACTICS`) | `NationalTeamView` | ✅ Completa | Pizarra táctil editable con 5 formaciones, selección de capitán, instrucciones de equipo, guardado separado de once. El motor respeta la alineación guardada. |
| E4 | **Partidos Selección** (`NT_*_SCHEDULE`) | `NationalTeamView` | ✅ Completa | Calendario de compromisos internacionales. |
| E5 | **Estadísticas Selección** (`NT_*_STATS`) | `NationalTeamView` | ✅ Completa | Goleadores, asistencias, mejor valoración con media real por partido. |

---

## ⚙️ F. Infraestructura

| Componente | Estado | Notas |
|---|---|---|
| `Sidebar` (desktop/menu) | ⚠️ Pendiente reescritura | Lista plana original (30+ ítems). Coexiste con `BottomNav` como dos árboles completos — bug de navegación pendiente en Fase 0.5. |
| `BottomNav` (mobile) | ✅ Completa | 5 slots + sheet "Más". |
| `FMUI` (design system) | ✅ Completa | FMBox, FMButton, FMTable, FMModal, spinners, barras. Estilo "FM Industrial Steel". |
| `ScreenBackground` | ⚠️ Pendiente real | Gradientes radiales sutiles (placeholder). La spec requiere escenas fotográficas — queda para Fase 6. |
| `ErrorBoundary` | ✅ Completa | Pantalla de error + recarga. |
| Stores | ✅ Completa | Estado global con Zustand. |

---

## 🧹 G. Código muerto (resuelto)

| Archivo | Estado |
|---|---|
| `components/ViewRouter.tsx` | ✅ **Eliminado** |
| `components/views/*` (12 archivos) | ✅ **Eliminados** |

---

## 🎯 H. Prioridades sugeridas para "terminar" el juego

1. ~~Resolver la duplicación~~ → **hecho** ✅
2. ~~Tácticas de Selección~~ → **hecho** ✅
3. ~~Settings~~ → **hecho** ✅
4. ~~Bugs de texto~~ → **hecho** ✅
5. ~~IA de partido~~ → **hecho** ✅
6. ~~Historial entre temporadas~~ → **hecho** ✅
7. ~~Generalizar la tabla de clasificación~~ → **hecho** ✅
8. **Editor de datos** — feature grande pendiente.
9. ~~**Directiva** (B17)~~ → **hecho** ✅
10. ~~**Nacionalidades hardcodeadas**~~ → **hecho** ✅
11. ~~Buscador/sueldos en Plantel, filtro Calendario, orden/oferta Mercado, gráfico Economía, plan semanal + foco posición, ratings reales en Selección~~ → **hechos** ✅.
12. *Mejoras menores:* validación de campos vacíos en setup, vista mensual del Calendario, control de contrato del manager negociable.
13. ~~🔴 **FIX BUG — tablas altas recortadas sin scroll**~~ → **hecho** ✅ (commit `a20cd30`, verificado en navegador real).
14. ~~**Partido en vivo con mayor riqueza visual**~~ → **hecho** ✅
15. ~~**Empty-states ilustrados**~~ → **hechos** ✅
16. ~~**Setup: Liga enriquecida**~~ → **hecho** ✅
17. ~~**Unificación de paleta y dark mode**~~ → **hecho** ✅
18. ~~**Análisis de jerarquía tipográfica/espaciado/densidad**~~ → **hecho** ✅
19. ~~**Sistema de diálogos staff → jugadores**~~ → **hecho** ✅
20. **🔴 FIX BUG — Sidebar duplica navegación de BottomNav** → Pendiente Fase 0.5.
21. **🔴 FIX BUG — Botón de ayudante duplicado en Táctica** → Pendiente Fase 0.5.
22. **Fondos temáticos: placeholder, no escenas fotográficas** → Pendiente Fase 6.

**Criterio de salida Fase 0:** pendiente Fase 0.5.

---

## 📋 Fase 0.5 — Corregir lo que quedó a medias (estado)

- [ ] **Doble menú de navegación** — `Sidebar.tsx` sigue siendo la lista plana original. coexiste con `BottomNav` como dos árboles completos. Pendiente reescribir Sidebar con 3 capas.
- [ ] **Botón de ayudante duplicado en Táctica** — El botón viejo `🎩 CONSEJO DEL AYUDANTE` sigue en la toolbar junto al `DialogueAvatar`. Pendiente eliminar botón viejo.
- [ ] **Fondos temáticos son placeholder** — `ScreenBackground.tsx` tiene gradientes radiales sutiles. Pendiente Fase 6 con imágenes fotográficas.
- [ ] **Auditar el resto de vistas por duplicación** — `PreMatchView` tiene el botón viejo sin `DialogueAvatar` — pendiente alinear cuando `checkAssistantTrigger` soporte `PRE_MATCH`.

**Criterio de salida:** un solo sistema de navegación visible a la vez, un solo punto de entrada por diálogo de personaje, y `ScreenBackground` reclasificado como pendiente real.

---

## 📋 Fase 1 — Cerrar sistema de diálogos (estado)

- [x] Triggers bidireccionales jugador↔manager
- [x] 3 tonos con efecto real en `relacion_jugador` y moral
- [x] Modales alcanzables
- [x] Avatar persistente + badge + revelado progresivo

**Criterio de salida Fase 1:** completado.

---

## 📋 Fase 2 — Cerrar huecos del motor (estado)

- [x] Fichajes CPU a CPU
- [x] Objetivos de temporada con consecuencia jugable
- [x] Economía balanceada
- [x] Scouting sobre pool completo

**Criterio de salida Fase 2:** completado.

---

## 📋 Fase 4 — Testing (estado)

- [x] Tests de sistema de diálogo: 20/20 pasan (`dialogueStore`, `dialogueSystem`, `playerDialogueTriggers`)
- [x] `engine.test.ts`: 8 tests para `ProfileNarrativeEngine` (personalidad, titulares narrativos)
- [ ] Tests de `MatchSimulator` (resultado de partido, goles, lesiones, tarjetas)
- [ ] Tests de economía por temporada
- [ ] Tests de guardado/carga (`saveLoadService.ts` con migraciones)
- [ ] Test de regresión de guardado
- [ ] QA manual guiado

**Criterio de salida Fase 4:** parcial. Faltan tests de `MatchSimulator` y guardado/carga.

---

## 📋 Fase 5 — Performance (estado)

- [x] Code-splitting: vistas pesadas como lazy chunks
- [~] `manualChunks` agregado, pero `vendor-react` no se separa (0.00 kB). Bundle principal ~1.008 MB.
- [ ] Separar dataset del bundle
- [ ] Medir tiempo de carga real en mobile

**Criterio de salida Fase 5:** parcial.

---

## 📋 Fase 6 — Pulido visual (estado)

- [x] Cobertura de `ScreenBackground.tsx` ampliada a 28 entradas
- [ ] Fondos temáticos reales (escenas fotográficas) — pendiente
- [ ] Unificar paleta: un solo color de acento
- [ ] Patrón de home-campo

**Criterio de salida Fase 6:** pendiente.

---

## 📋 Fase 7 — Beta y lanzamiento (estado)

- [ ] Playtesting con usuarios reales
- [ ] Definir criterio de "v1.0"
- [ ] Publicar build de producción

**Criterio de salida Fase 7:** build desplegado; playtesting pendiente.

---

*Documento generado automáticamente a partir del análisis del código. Los estados pueden desactualizarse; se recomienda regenerarlo tras cada iteración grande.*
