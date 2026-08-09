# 🗺️ Inventario de Pantallas — Estado del Proyecto FM

> **Propósito:** listar TODAS las pantallas del juego, su estado actual y qué falta en cada una, para priorizar la construcción.
>
> **Fecha del análisis:** 5 agosto 2026 · Basado en lectura del código actual (`App.tsx`, `components/`).
> **Última actualización:** 9 agosto 2026 — **Bugs de producción corregidos**: workbox skipWaiting/clientsClaim/cleanupOutdatedCaches, lazyWithReload para recarga en fetch fallido, FMBox header layout fix (truncate + wrap), BoardView accordion para densidad. **Bug de tablas largas sin scroll cerrado** (SquadView, MarketView, NationalTeamView, TrainingView, StaffView, EXTERNAL_CLUB). **Auditoría visual mobile 360px documentada.** **Fase 4: tests de motor ampliados** (ProfileNarrativeEngine 8 tests + MatchSimulator 18 tests nuevos).

---

## 📊 Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pantallas de juego (activas) | **~40** (setup: 8 · club: 24 · partido: 5 · selección: 5) |
| Modales / overlays | 9 |
| Pantallas **completas y funcionales** | **~40** (100%) |
| Pantallas **parciales / mejorables** | 0 (restan solo mejoras menores, detalladas en la sección H) |
| Código muerto (no se usa) | ~~`components/views/` + `components/ViewRouter.tsx`~~ → **eliminado** ✅ · `OptionCard.tsx` (reemplazado por `ProgressiveOptions`) → **eliminado** ✅ |
| **Auditoría visual (screenshots)** | **40/40 renderizan** · 0 crashes · 0 imágenes rotas · **0 bugs visuales críticos** (tablas altas recortadas corregidas) + sistema de diálogos implementado |

**Conclusión principal:** el juego está **funcional de punta a punta** (setup → temporada → partido → resumen → prensa → siguiente temporada). No hay pantallas "stub" o vacías. La auditoría visual con screenshots reales confirmó que **todas las pantallas dibujan contenido**, con un **único bug de layout grave** (las tablas muy largas quedan recortadas sin posibilidad de scroll — ver sección I) y varias notas menores de diseño (pantallas espartanas al inicio de carrera, estética de partido muy oscura). Lo que queda no es construir pantallas nuevas, sino **corregir ese bug de layout, pulir profundidad de simulación, limpiar deuda técnica y completar features de gestión**.

---

## 🔴 URGENTE — Bugs de producción (9 ago 2026)

### 1. Crash en producción por SW/chunk obsoleto — RESUELTO

**Causa:** deploy a GitHub Pages reemplaza archivos con hashes nuevos; si el usuario tiene pestaña abierta o SW desactualizado, el `index.html` viejo pide un chunk que ya no existe → 404 → crash.

**Fix aplicado:**
- `vite.config.ts`: agregado `skipWaiting: true`, `clientsClaim: true`, `cleanupOutdatedCaches: true` en bloque `workbox`.
- `App.tsx`: creado `lazyWithReload()` que captura error de import dinámico y fuerza `window.location.reload()` en vez de crashear. Aplicado a `MatchView`, `TacticsView`, `PreMatchView`, `PostMatchSummaryView`.

**Validación:** `dist/sw.js` incluye `self.skipWaiting()`, `e.clientsClaim()`, `e.cleanupOutdatedCaches()`.

### 2. FMBox header overflow en 4 pantallas — RESUELTO

**Causa:** `FMUI.tsx` línea 75: header con `h-8` fija, título sin `truncate`, `headerRight` sin wrap. En viewport angosto (360px), texto + badge se desbordaban y montaban sobre contenido vecino.

**Fix aplicado:**
- `FMUI.tsx`: quitado `h-8` fija, reemplazado por `min-h-8 flex-wrap`; agregado `min-w-0 truncate` al título; `headerRight` ahora tiene `min-w-0 flex-wrap`.
- `BoardView.tsx`: agregado acordeón para "Mejoras de Instalaciones" y "Reunión con la directiva" (colapsados por defecto) para reducir densidad en mobile.

**Pantallas afectadas verificadas:**
- `BoardView.tsx`: 7 FMBox apiladas → 2 secciones ahora colapsables (Mejoras, Reuniones)
- `EconomyView.tsx`: FMBox "Previsión Mensual" con badge de netProfit → truncate aplicado
- `NationalTeamView.tsx`: FMBox "Mejor Valoración" con headerRight → truncate aplicado
- `TrainingView.tsx`: FMBox "Plan Semanal" con headerRight → truncate aplicado

**Criterio de salida:** cumplido — las 4 pantallas ya no muestran texto desbordado en viewport de 360px.

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
- **Bug visual confirmado:** 0 (FMBox header fix aplicado)

**Criterio de salida:** cumplido — cada vista tiene estado visual documentado; no hay pantallas sin revisar ni bugs de overflow confirmados en 360px.

---

## ✅ Hallazgo estructural resuelto

Existían **DOS sistemas de renderizado de pantallas**: el `switch` inline en `App.tsx` (activo) y `ViewRouter.tsx` + la carpeta `components/views/` (nunca importados). **El código muerto fue eliminado en esta iteración** ✅ — ahora solo existe el sistema inline de `App.tsx`, sin riesgo de divergencia.

---

## 🟢 A. Flujo de Setup (creación de carrera)

*Todos renderizados inline en `App.tsx` por `gameState`. Las versiones en `views/` NO se usan.*

| # | Pantalla (state) | Estado | Qué falta / notas |
|---|---|---|---|
| A1 | **Carga inicial** (`LOADING`) | ✅ Completa | Nada. Splash con spinner. |
| A2 | **Perfil del Manager** (`SETUP_USER`) | ✅ Completa | Nombre, apellido, nacionalidad (**~150 países reales del mundo** con bandera funcional), origen, fecha nac., "crear manager", "elegir manager existente" y "cargar partida" (con modal + borrar). *Mejora:* validación de campos vacíos. |
| A3 | **Elegir Manager existente** (`SETUP_EXISTING_MANAGER`) | ✅ Completa | Búsqueda por nombre/club/nacionalidad, filtro por país, paginación "cargar más", modal de conflicto (tomar club / despedir). Base Wikidata (~miles de perfiles, algunos con datos básicos). *Mejora:* indicar atributos de forma más visual. |
| A4 | **Tipo de carrera** (`SETUP_CAREER`) | ✅ Completa | 3 modos: Club / Selección / Ambos. Nada crítico. |
| A5 | **Elegir selección** (`SETUP_NATIONAL_TEAM`) | ✅ Completa | Grid de 45 selecciones con nº de elegibles. Nada crítico. |
| A6 | **Elegir país** (`SETUP_COUNTRY`) | ✅ Completa | Grid por países con nº de ligas. Nada. |
| A7 | **Elegir liga** (`SETUP_LEAGUE`) | ✅ Completa | Ligas del país con nº de clubes. Nada. |
| A8 | **Elegir club** (`SETUP_TEAM`) | ✅ Completa | Grid de clubes con reputación. Nada. |

---

## 🔵 B. Vistas principales del juego (modo club)

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| B1 | **Inicio** (`HOME`) | inline en `App.tsx` | ✅ Completa | Próximo partido, competiciones con posición, historial del manager, últimas noticias. *Nota:* la `HomeView.tsx` (muerta) tiene header temático más atractivo que la versión activa. |
| B2 | **Buzón** (`INBOX`) | `InboxView` | ✅ Completa | Filtros por categoría, leído/no leído, borrar, botón "acción requerida" que navega (fichajes, plantel, torneo, club externo). Confianza de directiva + objetivo del club en el header. |
| B3 | **Plantel** (`*_SQUAD`, x3: Senior/Reserva/Sub-20) | `SquadView` | ✅ Completa | Ordenamiento por 8 columnas, responsive (mobile/tablet/desktop), parte médico, barra minutos Sub-21 (600 min), badges de forma/estado, menú contextual, **buscador por nombre/posición**, **toggle de sueldos semanal/mensual/anual** (el sueldo base del juego es mensual). |
| B4 | **Tácticas** (`*_TACTICS`, x3) | `TacticsView` | ✅ Completa | Pizarra drag&drop, flechas de ataque, instrucciones de equipo (9 sliders + 5 checkboxes), instrucciones individuales por puesto, guardar/borrar esquemas, autopick "el segundo elige 11", panel de suplentes, modal de elección con "mejores opciones". Es la pantalla más rica del juego. |
| B5 | **Calendario** (`*_SCHEDULE`, x3) | inline en `App.tsx` | ✅ Completa | Lista de partidos del equipo con resultados y penales, **filtro por competición** (con reseteo automático si el filtro no aplica al equipo). *Mejora:* vista mensual. |
| B6 | **Clasificación** (`TABLE`) | `LeagueTable` | ✅ Completa | Tabla por posición, selector de liga, selector Senior/Reserva/Sub-20, goleadores/asistencias/mejor XI del torneo. *Zonas dinámicas por liga* (CONMEBOL: 5 Lib + 5 Sud · UEFA: 4 UCL + 2 UEL · otras confederaciones con sus cupos; descenso proporcional al tamaño; ascenso en 2ª división). |
| B7 | **Torneo** (`COMP_*`) | `TournamentHub` | ✅ Completa | Pestañas: Tabla (con grupos), Partidos, Bracket (eliminatorias), Estadísticas (goleadores/asist/rating), Premios. Maneja ligas, copas, continentales y torneos de selecciones. |
| B8 | **Mercado** (`MARKET`) | `MarketView` | ✅ Completa | Filtros Todos/Transf./Cedibles/Libres + búsqueda, **orden por CA/valor/sueldo/edad/nombre con dirección**, **botón "Ofertar" en cada fila** que abre el modal de traspaso directo. |
| B9 | **Buscador de jugadores** (`SEARCH`) | `SearchView` | ✅ Completa | Virtualizado (55k jugadores sin lag), filtros nombre/posición/edad/CA. |
| B10 | **Centro de Fichajes** (`NEGOTIATIONS`) | `NegotiationsView` | ✅ Completa | Ofertas activas/historial, contraofertas, aceptar, "firmar jugador" para cerrar el trato. |
| B11 | **Clubes del mundo** (`CLUBS_LIST`) | `ClubsListView` | ✅ Completa | Acordeón por país, 618 clubes. |
| B12 | **Club externo** (`EXTERNAL_CLUB`) | inline + `SquadView` | ✅ Completa | Plantilla del club visitante, click en jugador → ficha. |
| B13 | **Economía** (`ECONOMY`) | `EconomyView` | ✅ Completa | Balance, presupuesto fichajes/salarial, previsión mensual (ingresos/gastos detallados), salud financiera, historial mensual y **gráfico SVG de evolución** (línea de saldo + barras de resultado mensual). |
| B14 | **Cuerpo Técnico** (`STAFF`) | `StaffView` | ✅ Completa | Tabla de staff, ficha completa (biografía generada, perfil táctico, atributos, contrato, historial, palmarés, clubes previos), delegación de 6 tareas (entreno, prensa, charlas, reserva, sub-20, scouting). |
| B15 | **Entrenamiento** (`TRAINING`) | `TrainingView` | ✅ Completa | Presets de carga, sliders por categoría por jugador, barra de intensidad, delegación a staff, editor mobile, **plan semanal por días (Lun-Dom, 8 categorías + descanso)** que refuerza el desarrollo de las categorías elegidas, **foco por posición** (Porteros/Defensas/Medios/Delanteros) con presets específicos. |
| B16 | **Scouting** (`SCOUTING`) | `ScoutingView` | ✅ Completa | Informes (CA/PA, fortalezas/debilidades, personalidad), no leídos, lista de seguimiento, buscador para pedir informe, informe aleatorio. |
| B17 | **Directiva** (`BOARD`) | `BoardView` | ✅ Completa | Confianza, mejora de instalaciones (entreno/juveniles), aumento de presupuesto, **objetivos de temporada editables** (6 objetivos con aprobación de la junta, efectos en confianza + mensaje al buzón), **reuniones con la directiva** (4 temas con respuesta contextual según confianza y acta), tarjeta de cargo/contrato del manager. |
| B18 | **Información Club** (`CLUB_REPORT`) | `ClubReport` | ✅ Completa | Datos, récords históricos (max goleador/más partidos), palmarés, equipación SVG, presupuestos. |
| B19 | **Centro de Personas** (`PEOPLE_HUB`) | `PeopleHub` | ✅ Completa | 6 pestañas: Jugadores, Staff, Relaciones, Prensa, Red de DT, Directiva. Diálogos con tono (suave/moderado/agresivo) sobre jugadores, staff, directiva, declaraciones a prensa y contacto con otros DTs. Es el corazón del "mundo vivo". |
| B20 | **Prensa** (`MEDIA`) | `MediaView` | ✅ Completa | Portada de periódico, filtros por categoría, detalle de noticia. *Bug de typo `PRASE` corregido.* |
| B21 | **Crónicas** (`CHRONICLES`) | `ChronicleView` | ✅ Completa | Filtros partido/mensual/carrera, incluye crónicas de selección nacional. |
| B22 | **Mi Carrera** (`MANAGER_PROFILE`) | `ManagerProfileView` | ✅ Completa | Stats de carrera, títulos, relaciones (directiva/prensa/afición), objetivo actual, historial de clubes, mayor venta, jugador clave. |
| B23 | **Salón de la Fama** (`HALL_OF_FAME`) | `HallOfFameView` | ✅ Completa | Top inductados por win-rate y títulos con medallas. |
| B25 | **Libro de Temporadas** (`SEASON_HISTORY`) | `SeasonHistoryView` | ✅ **Nueva** | Historial consultable entre temporadas: selector de años, campeón/goleador/asistente de cada competición, tablas finales top 6 de todas las ligas. Persistido en save. |
| B24 | **Ranking de Ligas** (`LEAGUE_RANKING`) | inline en `App.tsx` | ✅ Completa | 41 ligas ordenadas por reputación dinámica, tier, prize pool. |

---

## 🟣 C. Flujo de Partido (secuencia lineal)

*Táctica → Previa → Rueda pre → Partido → Resumen → Rueda post → Home*

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| C1 | **La Previa** (`PRE_MATCH`) | `PreMatchView` | ✅ Completa | Once titular con alertas de no disponibles, check de 11 jugadores válidos, reputaciones, botón tácticas. Mobile sticky footer. |
| C2 | **Rueda de Prensa Pre** (`PRESS_CONFERENCE_PRE`) | `PressConferenceView` | ✅ Completa | 5 preguntas base + pregunta de derbi + pregunta de jugador estrella (dinámica). Efectos en moral y confianza. Delegable al staff. |
| C3 | **Partido en vivo** (`MATCH`) | `MatchView` | ✅ Completa | Simulación minuto a minuto, 4 pestañas (relato/técnico/estadísticas/plantilla), velocidades 1x/2x/4x, pausa, **cambios (máx 5)**, skip al descanso/final, charla de descanso (motivar/exigir/calmar), informe del asistente, resumen con MVP, copia de log técnico. |
| C4 | **Resumen post-partido** (`POST_MATCH_SUMMARY`) | `PostMatchSummaryView` | ✅ Completa | Resultado, goleadores, asistencias, MVP, estadísticas, tarjetas, **crónica del partido**. |
| C5 | **Rueda de Prensa Post** (`PRESS_CONFERENCE_POST`) | `PressConferenceView` | ✅ Completa | 4 preguntas según resultado. |

> El flujo activo pasa por `POST_MATCH_SUMMARY` (resumen con crónica) antes de la rueda post. ✅

---

## 🟡 D. Modales y Overlays

| # | Modal | Estado | Qué falta / notas |
|---|---|---|---|
| D1 | **Ficha de Jugador** | ✅ Completa | 6 pestañas: Atributos (visibles + internos expandibles), Personal, Posiciones (mapa de campo), Historial/Carrera (stats de por vida), Contrato (renovar/rescindir), Interacción (diálogos + pedidos del jugador). Tratamiento de lesiones (conservador/agresivo). *Bug de etiqueta "LEAL" fija corregido: ahora usa `player.loyalty` (LEAL / PROFESIONAL / INESTABLE).* |
| D2 | **Comparar Jugadores** | ✅ Completa | Comparativa CA/PA/físico/mental/stats/contrato con barras y resaltado del mejor. |
| D3 | **Menú Contextual (click derecho)** | ✅ Completa | Mover a equipo (Senior/Reserva/Sub-20), declarar transferible/cedible, rescindir contrato. |
| D4 | **Oferta de Traspaso** | ✅ Completa | Compra o cesión, validación de presupuesto, aviso por reputación inferior, estado "ofertas enviadas". |
| D5 | **Negociación de Contrato** | ✅ Completa | Sueldo propuesto, duración 1-5 años, 3 intentos de negociación, feedback del jugador, validación de presupuesto salarial. |
| D6 | **Resumen de Temporada** | ✅ Completa | Selector de torneos, campeón, premios (goleador/asistidor/mejor def/mejor portero), confeti si ganas la liga. *Bug del título de temporada fijo corregido.* |
| D7 | **Configuración** | ✅ Ampliada | **Pausar en entretiempo / simulación continua** (select de elección), **velocidad de simulación** (1x/2x/4x + avanzar día), **notificaciones** (activar/desactivar tipo por tipo con guardado en `localStorage`), repetir tutorial. |
| D8 | **Guardar / Cargar / Vacaciones / Onboarding** | ✅ Completa | Guardar con lista para sobrescribir, cargar con borrado, vacaciones con progreso + cancelar, tour de 8 pasos con spotlight. |

---

## ⚪ E. Selección Nacional (`NT_*`)

| # | Pantalla (view key) | Componente | Estado | Qué falta / notas |
|---|---|---|---|---|
| E1 | **Home Nacional** (`HOME` en modo solo-selección) | inline en `App.tsx` | ✅ Completa | Cargo activo + próximo compromiso. |
| E2 | **Plantel Selección** (`NT_*_SQUAD`) | `NationalTeamView` | ✅ Completa | Convocatoria gestionable (23 jugadores), asumir control, filtro por posición, tabla ordenable, dorsales. |
| E3 | **Tácticas Selección** (`NT_*_TACTICS`) | `NationalTeamView` | ✅ Completa | **Pizarra táctil editable** con 5 formaciones (4-4-2, 4-3-3, 4-2-3-1, 3-5-2, 5-4-1): toca un casillero para elegir jugador de la convocatoria (ranked por aptitud), **selección de capitán** (C), instrucciones de equipo (mentalidad/presión/pase + foco + contraataque), guardado separado de once y de instrucciones. El motor **respeta la alineación guardada** al simular y el capitán recibe bonus. |
| E4 | **Partidos Selección** (`NT_*_SCHEDULE`) | `NationalTeamView` | ✅ Completa | Calendario de compromisos internacionales. |
| E5 | **Estadísticas Selección** (`NT_*_STATS`) | `NationalTeamView` | ✅ Completa | Goleadores, asistencias, **mejor valoración con media real por partido** (`totalRating / PJ`). |

---

## ⚙️ F. Infraestructura (no son "pantallas" pero sostienen todo)

| Componente | Estado | Notas |
|---|---|---|
| `Sidebar` (desktop/menu) | ✅ Completa | Solo visible en desktop (`lg:static`). En mobile no existe como drawer ni botón hamburguesa; la navegación es exclusivamente `BottomNav` + sheet "Más". No hay doble menú. |
| `BottomNav` (mobile) | ✅ Completa | 5 slots (Inicio/Plantilla/Táctica/Continuar/Más) + sheet "Más". |
| `FMUI` (design system) | ✅ Completa | FMBox, FMButton, FMTable, FMModal, spinners, barras. Estilo "FM Industrial Steel". |
| `ScreenBackground` | ⚠️ Pendiente real | 12 entradas de gradientes radiales sutiles (placeholder). La spec requiere escenas fotográficas con grano/desenfoque — queda para Fase 6. |
| `ErrorBoundary` | ✅ Completa | Pantalla de error + recarga. |
| Stores (`uiStore`, `gameStore`, `worldStore`, `navStore`, `saveStore`, `matchStore`, `userStore`) | ✅ Completa | Estado global con Zustand. |

---

## 🧹 G. Código muerto (resuelto)

| Archivo | Estado |
|---|---|
| `components/ViewRouter.tsx` | ✅ **Eliminado** (no se importaba; duplicaba el switch de `App.tsx`). |
| `components/views/*` (12 archivos) | ✅ **Eliminados** (solo los usaba `ViewRouter`). |

---

## 🎯 H. Prioridades sugeridas para "terminar" el juego

1. ~~Resolver la duplicación~~ → **hecho** ✅ (se eliminó `views/` + `ViewRouter.tsx`).
2. ~~Tácticas de Selección~~ → **hecho** ✅ (pizarra editable con once, capitán e instrucciones).
3. ~~Settings~~ → **hecho** ✅ (velocidad, notificaciones, pausa entretiempo).
4. ~~Bugs de texto~~ → **hecho** ✅ (PRASE, LEAL, header temporada; el juego ahora usa la lealtad real del jugador).
5. ~~IA de partido~~ → **hecho** ✅ (sustituciones con conciencia de marcador: refresco ofensivo persiguiendo, cierre defensivo protegiendo ventaja).
6. ~~Historial entre temporadas~~ → **hecho** ✅ (Libro de Temporadas `SEASON_HISTORY` consultable).
7. ~~Generalizar la tabla de clasificación~~ → **hecho** ✅ (zonas dinámicas por confederación/tier).
8. **Editor de datos** (clubes, jugadores, competiciones) — feature grande pendiente (dejado para el final a propósito).
9. ~~**Directiva** (B17)~~ → **hecho** ✅ (objetivos editables + reuniones con acta + tarjeta de cargo).
10. ~~**Nacionalidades hardcodeadas en setup** (A2)~~ → **hecho** ✅ (~150 países reales con bandera).
11. ~~Buscador/sueldos en Plantel, filtro Calendario, orden/oferta Mercado, gráfico Economía, plan semanal + foco posición en Entrenamiento, ratings reales en Selección~~ → **hechos** ✅.
12. *Mejoras menores restantes:* validación de campos vacíos en setup (A2), vista mensual del Calendario, control de contrato del manager negociable (hoy informativo).
13. ~~🔴 **FIX BUG VISUAL CRÍTICO — tablas altas recortadas sin scroll**~~ → **hecho** ✅ (se añadió `min-h-0` al `FMBox` del design system; verificado en navegador real: Plantel 4.590px scrolleable, Mercado 22.622px scrolleable, Calendario Selección scrolleable — test de scroll con scrollTop 0→3880 OK).
14. ~~**Partido en vivo con mayor riqueza visual** (C3)~~ → **hecho** ✅ (iconos por tipo de evento en el relato, barra de posesión en vivo bajo el marcador, estado inicial con animación y jerarquía de mitad).
15. ~~**Empty-states ilustrados** (Scouting, Crónicas, Salón de la Fama, Libro de Temporadas)~~ → **hechos** ✅ (nuevo componente `FMEmptyState` del design system: icono en círculo, título, subtítulo y acción opcional).
16. ~~**Setup: Liga enriquecida** (A7)~~ → **hecho** ✅ (por liga: estrellas de reputación dinámica, división, nº de clubes, prize pool total y confederación).
17. ~~**Unificación de paleta y dark mode**~~ → **hecho** ✅ (análisis de coherencia estética en sección I.1.4: main a `#b8c4b8`, slate azulado → verde-gris en 14 archivos, botones azules → verde militar, dark mode residual eliminado del CSS y del DOM; también bordes internos de los modales de traspaso/contrato unificados a `#3a4a3a`).
18. ~~**Análisis de jerarquía tipográfica/espaciado/densidad**~~ → **hecho** ✅ (sección I.1.5: jerarquía y espaciado coherentes; densidad varía por tipo de superficie —tabla vs. flujo—, correcto; se documentó la mejora opcional de accesibilidad en lecturas largas).
19. ~~**Sistema de diálogos staff → jugadores**~~ → **hecho** ✅ (bottom sheet, avatar persistente + badge, reveal progresivo, cierre con frase, memoria `siguioConsejoUltimaVez`, diálogos bidireccionales con personalidad, relación jugador `-1 a +1`, triggers automáticos, badges en Plantel/Buzón, persistencia en save/load).
20. ~~🔴 **FIX BUG — Sidebar duplica navegación de BottomNav** → Resuelto en Fase 0.5: Sidebar es desktop-only, en mobile no hay trigger ni drawer; navegación mobile es exclusivamente BottomNav + sheet "Más".
21. ~~🔴 **FIX BUG — Botón de ayudante duplicado en Táctica** → Resuelto en Fase 0.5: botón viejo eliminado; solo queda DialogueAvatar fijo con badge condicional.
22. **Fondos temáticos: placeholder, no escenas fotográficas** → `ScreenBackground.tsx` tiene gradientes radiales sutiles. Pendiente Fase 6 real con imágenes fotográficas + grano/desenfoque.

**Criterio de salida Fase 0:** pendiente Fase 0.5.

- [x] Reemplazar README.md (template CodeSandbox eliminado)
- [x] Actualizar ESTADO_PANTALLAS.md con estado real
- [x] Resolver duplicación de fuentes de datos de jugadores: **`public/data/convertedPlayers.json` es la fuente canónica para población masiva (29K jugadores, carga en runtime). `data/realPlayers.ts` se mantiene como lista específica de jugadores reales para inyección selectiva (`injectRealPlayers`). No son redundantes — propósitos distintos.**
- [x] Congelar diseño de navegación y estética → **hecho** ✅ (Sidebar desktop-only, BottomNav + sheet "Más" como navegación mobile única; sin doble menú).

**Criterio de salida Fase 0:** pendiente Fase 0.5.

---

## 📋 Fase 0.5 — Corregir lo que quedó a medias (hallazgos de auditoría real)

- [x] **Doble menú de navegación (BUG, prioridad alta).** Resuelto: `Sidebar.tsx` es solo desktop (`lg:static`, sin botón hamburguesa mobile). En mobile no hay trigger `setIsSidebarOpen(true)` en ningún componente; la navegación es exclusivamente `BottomNav` + sheet "Más". Código mobile residual eliminado de `Sidebar.tsx`.
- [x] **Botón de ayudante duplicado en Táctica (BUG, prioridad alta).** Confirmado: el botón viejo `🎩 CONSEJO DEL AYUDANTE` no existe en `TacticsView.tsx`. Solo queda el `DialogueAvatar` fijo con badge condicional.
- [x] **Wrapper redundante de Sidebar.** Eliminado el `<div className="hidden lg:block">` exterior en `App.tsx` que duplicaba la visibilidad ya controlada por `Sidebar.tsx` con `hidden lg:flex`.
- [x] **`isSidebarOpen`/`setIsSidebarOpen` sin uso.** Eliminados del destructuring en `App.tsx` al no tener uso funcional activo.
- [ ] **Fondos temáticos son placeholder, no lo especificado (calidad, prioridad media).** `ScreenBackground.tsx` tiene gradientes radiales sutiles. Pendiente Fase 6 con imágenes fotográficas.

**Criterio de salida:** cumplido — navegación unificada, un solo punto de entrada por diálogo de personaje, sin código residual de visibilidad.

---

## 📋 Fase 1 — Cerrar sistema de diálogos (estado)

- [x] Triggers bidireccionales jugador→manager y manager→jugador
- [x] 3 tonos (EMPÁTICO/FIRME/DISTANTE) con efecto real en `relacion_jugador` y moral, diferenciado por personalidad
- [x] Modales alcanzables: TransferOfferModal, ContractNegotiationModal, SettingsModal conectados al flujo
- [x] UI: avatar persistente + badge + revelado progresivo en diálogos de staff; en jugadores badge en Plantilla/Ficha + Buzón

**Criterio de salida Fase 1:** completado. Se puede jugar una temporada y recibir/iniciar diálogos de jugador con consecuencia visible en moral/relación.

---

## 📋 Fase 2 — Cerrar huecos del motor (estado)

- [x] Fichajes CPU a CPU: `processAIActivity` con ofertas cruzadas DEEP, migración de talentos, venta de excedentes y compra por necesidades
- [x] Objetivos de temporada: `evaluateBoardConfidence` con cambio de confianza según objetivo cumplido/incumplido
- [x] Bonus por objetivo cumplido: `applySeasonObjectiveBonus` agrega presupuesto y confianza
- [x] Despido por confianza <= 0: modal de despido con opción de nueva carrera
- [x] Economía: balance, presupuesto fichajes/salarial, previsión mensual, gráfico SVG
- [x] Scouting: informes automáticos diarios desde pool de 29K jugadores, filtrado por ojeadores

**Criterio de salida Fase 2:** completado. Mercado CPU activo, objetivos con consecuencia jugable (bonus/despido), scouting sobre pool completo.

---

## 📋 Fase 4 — Testing (estado)

- [x] Tests unitarios básicos: `dialogueStore.test.ts` (3 tests pasando)
- [x] Tests de motor: `engine.test.ts` (ProfileNarrativeEngine 8 tests) + `matchSimulator.test.ts` (MatchSimulator 18 tests: initMatchStats, initMatchState, performSubstitution, adjustTacticsDynamically, selectBestXI, distributeStats, simulateLightMatch, simulateQuickMatch, simulateNationalTeamMatch, finalizeSeasonStats)
- [ ] Tests de economía por temporada y guardado/carga (pendiente para próxima iteración)

**Criterio de salida Fase 4:** parcial. Cobertura de MatchSimulator agregada; falta economía y guardado/carga.

---

## 📋 Fase 5 — Performance (estado)

- [x] Code-splitting: MatchView, TacticsView, PreMatchView, PostMatchSummaryView como lazy chunks
- [ ] Revisar `manualChunks` para separar datos del bundle (pendiente)
- [ ] Medir tiempo de carga real en mobile (pendiente)

**Criterio de salida Fase 5:** parcial. Bundle principal reducido de ~1.17MB a ~1.08MB; chunks separados para vistas pesadas.

---

## 📋 Fase 6 — Pulido visual (estado)

- [ ] ScreenBackground: **reclasificado como pendiente real**. Las 12 variantes actuales son gradientes radiales sutiles (placeholder). La spec requiere escenas fotográficas con grano/desenfoque en b/n por pantalla (vestuario, sala de prensa, pizarra, etc.). `VIEW_BACKGROUNDS` existe como estructura lista para conectar imágenes reales.
- [x] Paleta unificada verde-gris `#b8c4b8` + verde militar `#3a4a3a`
- [ ] Fondos temáticos adicionales por pantalla (pendiente hasta Fase 6 real)
- [ ] Patrón de home-campo (pendiente)

**Criterio de salida Fase 6:** pendiente. Fondos fotográficos por pantalla no implementados.

---

## 📋 Fase 7 — Beta y lanzamiento (estado)

- [ ] Playtesting con usuarios reales
- [x] Criterio de v1.0 documentado: juego jugable de punta a punta, sin crasheos conocidos, diálogos staff/jugadores funcionando, mercado/economía estables
- [x] Build de producción subido a GitHub Pages

**Criterio de salida Fase 7:** build desplegado; playtesting pendiente.

---

*Documento generado automáticamente a partir del análisis del código. Los estados pueden desactualizarse; se recomienda regenerarlo tras cada iteración grande.*
