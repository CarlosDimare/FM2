# 🗺️ Inventario de Pantallas — Estado del Proyecto FM

> **Propósito:** listar TODAS las pantallas del juego, su estado actual y qué falta en cada una, para priorizar la construcción.
>
> **Fecha del análisis:** 5 agosto 2026 · Basado en lectura del código actual (`App.tsx`, `components/`).
> **Última actualización:** 5 agosto 2026 — código muerto eliminado, Tácticas de Selección con pizarra, Settings ampliado, bugs de texto corregidos.

---

## 📊 Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pantallas de juego (activas) | **~40** (setup: 8 · club: 24 · partido: 5 · selección: 5) |
| Modales / overlays | 9 |
| Pantallas **completas y funcionales** | **~38** (95%) |
| Pantallas **parciales / mejorables** | 3–4 (detalladas abajo) |
| Código muerto (no se usa) | ~~`components/views/` + `components/ViewRouter.tsx`~~ → **eliminado** ✅ |

**Conclusión principal:** el juego está **funcional de punta a punta** (setup → temporada → partido → resumen → prensa → siguiente temporada). No hay pantallas "stub" o vacías. Lo que queda no es construir pantallas nuevas, sino **pulir profundidad de simulación, limpiar deuda técnica y completar features de gestión**.

---

## ✅ Hallazgo estructural resuelto

Existían **DOS sistemas de renderizado de pantallas**: el `switch` inline en `App.tsx` (activo) y `ViewRouter.tsx` + la carpeta `components/views/` (nunca importados). **El código muerto fue eliminado en esta iteración** ✅ — ahora solo existe el sistema inline de `App.tsx`, sin riesgo de divergencia.

---

## 🟢 A. Flujo de Setup (creación de carrera)

*Todos renderizados inline en `App.tsx` por `gameState`. Las versiones en `views/` NO se usan.*

| # | Pantalla (state) | Estado | Qué falta / notas |
|---|---|---|---|
| A1 | **Carga inicial** (`LOADING`) | ✅ Completa | Nada. Splash con spinner. |
| A2 | **Perfil del Manager** (`SETUP_USER`) | ✅ Completa | Nombre, apellido, nacionalidad (lista **hardcodeada de 15 países**), origen, fecha nac., "crear manager", "elegir manager existente" y "cargar partida" (con modal + borrar). *Mejora:* nacionalidad por país real del mundo, validación de campos vacíos. |
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
| B3 | **Plantel** (`*_SQUAD`, x3: Senior/Reserva/Sub-20) | `SquadView` | ✅ Completa | Ordenamiento por 8 columnas, responsive (mobile/tablet/desktop), parte médico, barra minutos Sub-21 (600 min), badges de forma/estado, menú contextual. *Mejora:* buscador dentro del plantel; vista de sueldos anuales vs. mensuales. |
| B4 | **Tácticas** (`*_TACTICS`, x3) | `TacticsView` | ✅ Completa | Pizarra drag&drop, flechas de ataque, instrucciones de equipo (9 sliders + 5 checkboxes), instrucciones individuales por puesto, guardar/borrar esquemas, autopick "el segundo elige 11", panel de suplentes, modal de elección con "mejores opciones". Es la pantalla más rica del juego. |
| B5 | **Calendario** (`*_SCHEDULE`, x3) | inline en `App.tsx` | ✅ Completa | Lista de partidos del equipo con resultados y penales. *Mejora:* filtro por competición, vista mensual. |
| B6 | **Clasificación** (`TABLE`) | `LeagueTable` | ✅ Completa | Tabla por posición, selector de liga, selector Senior/Reserva/Sub-20, goleadores/asistencias/mejor XI del torneo. *Zonas dinámicas por liga* (CONMEBOL: 5 Lib + 5 Sud · UEFA: 4 UCL + 2 UEL · otras confederaciones con sus cupos; descenso proporcional al tamaño; ascenso en 2ª división). |
| B7 | **Torneo** (`COMP_*`) | `TournamentHub` | ✅ Completa | Pestañas: Tabla (con grupos), Partidos, Bracket (eliminatorias), Estadísticas (goleadores/asist/rating), Premios. Maneja ligas, copas, continentales y torneos de selecciones. |
| B8 | **Mercado** (`MARKET`) | `MarketView` | ✅ Completa | Filtros Todos/Transf./Cedibles/Libres + búsqueda. *Mejora:* ordenar por valor/precio, oferta rápida desde la lista. |
| B9 | **Buscador de jugadores** (`SEARCH`) | `SearchView` | ✅ Completa | Virtualizado (55k jugadores sin lag), filtros nombre/posición/edad/CA. |
| B10 | **Centro de Fichajes** (`NEGOTIATIONS`) | `NegotiationsView` | ✅ Completa | Ofertas activas/historial, contraofertas, aceptar, "firmar jugador" para cerrar el trato. |
| B11 | **Clubes del mundo** (`CLUBS_LIST`) | `ClubsListView` | ✅ Completa | Acordeón por país, 618 clubes. |
| B12 | **Club externo** (`EXTERNAL_CLUB`) | inline + `SquadView` | ✅ Completa | Plantilla del club visitante, click en jugador → ficha. |
| B13 | **Economía** (`ECONOMY`) | `EconomyView` | ✅ Completa | Balance, presupuesto fichajes/salarial, previsión mensual (ingresos/gastos detallados), salud financiera, historial mensual. *Mejora:* gráfico de evolución (hoy es tabla). |
| B14 | **Cuerpo Técnico** (`STAFF`) | `StaffView` | ✅ Completa | Tabla de staff, ficha completa (biografía generada, perfil táctico, atributos, contrato, historial, palmarés, clubes previos), delegación de 6 tareas (entreno, prensa, charlas, reserva, sub-20, scouting). |
| B15 | **Entrenamiento** (`TRAINING`) | `TrainingView` | ✅ Completa | Presets de carga, sliders por categoría por jugador, barra de intensidad, delegación a staff, editor mobile. *Mejora:* plan de entrenamiento semanal (días), foco por posición. |
| B16 | **Scouting** (`SCOUTING`) | `ScoutingView` | ✅ Completa | Informes (CA/PA, fortalezas/debilidades, personalidad), no leídos, lista de seguimiento, buscador para pedir informe, informe aleatorio. |
| B17 | **Directiva** (`BOARD`) | `BoardView` | 🟡 Parcial | Confianza, mejora de instalaciones (entreno/juveniles), aumento de presupuesto. **Falta:** objetivos de temporada editables, reuniones/diálogos más profundos (sí existen en PeopleHub), control de contrato del manager. |
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
| E5 | **Estadísticas Selección** (`NT_*_STATS`) | `NationalTeamView` | ✅ Completa | Goleadores, asistencias, mejor valoración. *Mejora:* usar ratings reales en vez de (goles+asist)/PJ. |

---

## ⚙️ F. Infraestructura (no son "pantallas" pero sostienen todo)

| Componente | Estado | Notas |
|---|---|---|
| `Sidebar` (desktop/menu) | ✅ Completa | Menús por equipo, torneos, selecciones, mercado, gestión; vacaciones/guardar/config. |
| `BottomNav` (mobile) | ✅ Completa | 5 slots (Inicio/Plantilla/Táctica/Continuar/Más) + sheet "Más". |
| `FMUI` (design system) | ✅ Completa | FMBox, FMButton, FMTable, FMModal, spinners, barras. Estilo "FM Industrial Steel". |
| `ScreenBackground` | ✅ Completa | Overlay sutil de profundidad (no bloqueante). |
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
8. **Editor de datos** (clubes, jugadores, competiciones) — feature grande pendiente.
9. **Directiva** (B17): objetivos de temporada editables y reuniones más profundas.
10. **Nacionalidades hardcodeadas en setup** (A2): usar los países reales del mundo.

---

*Documento generado automáticamente a partir del análisis del código. Los estados pueden desactualizarse; se recomienda regenerarlo tras cada iteración grande.*
