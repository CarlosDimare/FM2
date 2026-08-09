# 🗺️ Inventario de Pantallas — Estado del Proyecto FM

> **Propósito:** listar TODAS las pantallas del juego, su estado actual y qué falta en cada una, para priorizar la construcción.
>
> **Fecha del análisis:** 5 agosto 2026 · Basado en lectura del código actual (`App.tsx`, `components/`).
> **Última actualización:** 9 agosto 2026 — **Bugs de producción corregidos**: workbox skipWaiting/clientsClaim/cleanupOutdatedCaches, lazyWithReload para recarga en fetch fallido, FMBox header layout fix (truncate + wrap), BoardView accordion para densidad. **Auditoría visual mobile 360px documentada.**

---

## 📊 Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Pantallas de juego (activas) | **~40** (setup: 8 · club: 24 · partido: 5 · selección: 5) |
| Modales / overlays | 9 |
| Pantallas **completas y funcionales** | **~40** (100%) |
| Pantallas **parciales / mejorables** | 0 (restan solo mejoras menores, detalladas en la sección H) |
| Código muerto (no se usa) | ~~`components/views/` + `components/ViewRouter.tsx`~~ → **eliminado** ✅ · `OptionCard.tsx` (reemplazado por `ProgressiveOptions`) → **eliminado** ✅ |
| **Auditoría visual (screenshots)** | **41/41 renderizan** · 0 crashes · 0 imágenes rotas · **1 bug visual crítico** (tablas altas recortadas) + sistema de diálogos implementado |

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
- **OK:** 38/41 vistas
- **Densidad alta:** 3 vistas (`BOARD`, `PEOPLE_HUB`, `STAFF`) — texto pequeño pero sin desbordamiento confirmado
- **Bug visual confirmado:** 0 (FMBox header fix aplicado)

**Criterio de salida:** cumplido — cada vista tiene estado visual documentado; no hay pantallas sin revisar ni bugs de overflow confirmados en 360px.

> **Metodología:** juego real ejecutado en **Chromium headless** (Playwright) con el motor de verdad (`world`, stores de Zustand), carrera creada con Boca Juniors (L_ARG_1), temporada iniciada y fixture del próximo partido activo. Se capturaron **41 screenshots** en desktop (1440×900) + verificación de overflow en móvil (390×844), y se analizaron los píxeles de cada captura (dominancia claro/oscuro, variación de color) + DOM (texto, botones, tablas, cajas). **0 crashes, 0 imágenes rotas, 41/41 pantallas renderizan contenido real.**

### Resultado global

| Verificación | Resultado |
|---|---|
| Pantallas que renderizan | **41/41 (100%)** |
| Crashes / pantalla de error | **0** |
| Imágenes rotas (flags, escudos) | **0** |
| Pantallas vacías o "stub" | **0** |
| 🐞 Bug crítico de layout | **1: tablas altas recortadas sin scroll** (ver 1.1) |
| Estética dominante | Tema claro "FM Industrial Steel" (fondo gris-azulado `#94a3b8`, cajas blancas, texto oscuro) en ~90% de las vistas |
| Excepciones oscuras | Partido en vivo (cancha), Prensa/Crónicas/Buzón (fondos oscuros por diseño), Scouting |

### 1.1 🐞 BUG CRÍTICO CONFIRMADO — Tablas altas recortadas sin scroll

**Síntoma:** las vistas con tablas largas (Plantel, Mercado, Club externo, Calendario de Selección) dibujan la tabla a **alturas enormes** (4.000–23.000 px) por debajo del viewport **sin ningún contenedor con scroll**: el contenido bajo el pliegue es **inaccesible** (no hay forma de llegar a las últimas filas).

**Prueba empírica (desktop 1440×900):**
- `SENIOR_SQUAD` (Plantel): la tabla mide **4.624 px** contra un viewport de 900 px; el `main` tiene `overflow-hidden` y el scroll interno de la tabla **no funciona** (scrollTop se queda en 0) → solo se ven ~848 px del total.
- `MARKET` (Mercado): tabla de ~492 filas → altura del orden de **23.000 px**, la más afectada.
- `EXTERNAL_CLUB`: mismo patrón (tablas de 148 filas).
- `NT_ARG_SCHEDULE` (Calendario Selección): mismo patrón.

**Causa raíz (solo diagnóstico, sin tocar código):** el contenedor `<main>` de `App.tsx` usa `overflow-hidden` dentro de una cadena flex sin `min-h-0`/`overflow` en el eslabón intermedio; el FMBox que envuelve las tablas crece al alto de su contenido (falta `min-h-0`/`overflow-y-auto` en esa cadena flex). Las tablas cortas (Clasificación, Torneo, Ranking, Staff) no lo sufren.

**Severidad:** 🔴 Alta — afecta vistas de gestión centrales (Plantel, Mercado, Club externo, Calendario Selección). *Prioridad #13 en la sección H.*

### 1.2 Desglose por pantalla (hallazgos visuales)

| Pantalla | Screenshot | Estado visual | Hallazgos del análisis de píxeles / DOM |
|---|---|---|---|
| **Setup: Perfil Manager** (`SETUP_USER`) | ✅ | Correcto | Form centrado, claro (20% claro), 1.930 chars de texto, 2 botones. Buen contraste. |
| **Setup: Tipo de carrera** (`SETUP_CAREER`) | ✅ | Correcto | 392 chars, 4 botones (3 modos + volver). Simple y legible. |
| **Setup: País** (`SETUP_COUNTRY`) | ✅ | Correcto | 35 botones (grid de países con banderas), 53% claro. Rico. |
| **Setup: Liga** (`SETUP_LEAGUE`) | ✅ | Correcto | 136 chars, 4 botones. Minimalista pero suficiente (lista de ligas). |
| **Setup: Club** (`SETUP_TEAM`) | ✅ | Correcto | 16 botones (grid de clubes con reputación), 41% claro. |
| **Setup: Selección** (`SETUP_NATIONAL_TEAM`) | ✅ | Correcto | 45 botones (grid de 45 selecciones), 61% claro — la pantalla más densa del setup. |
| **Setup: Manager existente** (`SETUP_EXISTING_MANAGER`) | ✅ | Correcto | 22 botones, 660 chars, alta variación de color (lista de perfiles). |
| **Home** (`HOME`) | ✅ | Correcto | 44 botones, 1.107 chars, 52% claro. Tarjetas bien distribuidas. |
| **Buzón** (`INBOX`) | ✅ | Correcto | Fondo oscuro por diseño (variación de color baja), 49 botones. |
| **Plantel** (`SENIOR_SQUAD`) | 🐞 | **Recorte crítico** | Tabla de 148 filas × 4.624 px, sin scroll accesible. Además: 82% claro, 8.295 chars. |
| **Tácticas** (`SENIOR_TACTICS`) | ✅ | Correcto | La más interactiva: 325 botones, pizarra, alta variación de color (campo). |
| **Calendario** (`SENIOR_SCHEDULE`) | ✅ | Correcto | 80% claro, 2.563 chars, lista de partidos + filtro. |
| **Clasificación** (`TABLE`) | ✅ | Correcto | Tabla de 16 filas — **cabe bien**, no sufre el bug. |
| **Torneo** (`COMP_L_ARG_1`) | ✅ | Correcto | Tablas de 16 filas, 4 cajas, pestañas. Bien. |
| **Mercado** (`MARKET`) | 🐞 | **Recorte crítico** | 492 filas ≈ 23.000 px sin scroll → peor caso del bug. 538 botones. |
| **Buscador** (`SEARCH`) | ✅ | Correcto | 74% claro, lista virtualizada. |
| **Fichajes** (`NEGOTIATIONS`) | ✅ | Correcto | 2 cajas, tono oscuro suave, legible. |
| **Clubes del mundo** (`CLUBS_LIST`) | ✅ | Correcto | 35 cajas (acordeón por país), 109 botones — denso pero organizado. |
| **Club externo** (`EXTERNAL_CLUB`) | 🐞 | **Recorte crítico** | Mismas tablas de 148 filas sin scroll. |
| **Economía** (`ECONOMY`) | ✅ | Correcto | 3 cajas, 1.007 chars, gráfico SVG visible. |
| **Cuerpo Técnico** (`STAFF`) | ✅ | Correcto | Tabla de 8 filas (cabe bien), 65% claro. |
| **Entrenamiento** (`TRAINING`) | ✅ | Correcto | Muy rica: 9.772 chars, tabla 183 filas (tiene su propio scroll interno funcional), 7 cajas. |
| **Scouting** (`SCOUTING`) | ✅ | Correcto | Fondo oscuro por diseño, 619 chars (pocos informes al inicio — estado vacío esperable). |
| **Directiva** (`BOARD`) | ✅ | Correcto | 9 cajas, 1.732 chars, 44% de variación — panel rico y balanceado. |
| **Club Report** (`CLUB_REPORT`) | ✅ | Correcto | 6 cajas, tabla de 4 filas. |
| **People Hub** (`PEOPLE_HUB`) | ✅ | Correcto | 8.885 chars, 342 botones — muy denso pero con pestañas que lo ordenan. |
| **Prensa** (`MEDIA`) | ✅ | Correcto | Portada oscura por diseño (23% claro), 654 chars. |
| **Crónicas** (`CHRONICLES`) | ✅ | Correcto | 543 chars, poca variación (estado vacío al inicio de carrera — esperable). |
| **Mi Carrera** (`MANAGER_PROFILE`) | ✅ | Correcto | 65% claro, 755 chars, bien legible. |
| **Salón de la Fama** (`HALL_OF_FAME`) | ✅ | Correcto | 509 chars (vacío al inicio — esperable), fondo oscuro suave. |
| **Libro de Temporadas** (`SEASON_HISTORY`) | ✅ | Correcto | 573 chars (vacío hasta fin de temporada — esperable). |
| **Ranking de Ligas** (`LEAGUE_RANKING`) | ✅ | Correcto | Tabla de 42 filas — cabe con scroll propio. |
| **Previa** (`PRE_MATCH`) | ✅ | Correcto | 78% claro, once titular + advertencias. |
| **Partido en vivo** (`MATCH`) | ✅ | Correcto | **La más oscura del juego** (5.7% claro) — estética de cancha/relato; solo 64 chars en captura (simulación en curso, marcador 0-0). Correcto para su función. |
| **Resumen post** (`POST_MATCH_SUMMARY`) | ✅ | Correcto | 515 chars + estadísticas, alta variación (colores de marcador). |
| **Rueda pre/post** (`PRESS_CONFERENCE_*`) | ✅ | Correcto | ~700 chars cada una, 45 botones, legibles. |
| **Selección: Plantel** (`NT_ARG_SQUAD`) | ✅ | Correcto | Tabla de 24 filas — cabe bien. |
| **Selección: Tácticas** (`NT_ARG_TACTICS`) | ✅ | Correcto | Pizarra + tabla 12 filas. |
| **Selección: Calendario** (`NT_ARG_SCHEDULE`) | 🐞 | **Recorte crítico** | Tabla de 21 filas desbordada (mismo bug). 83% claro. |
| **Selección: Stats** (`NT_ARG_STATS`) | ✅ | Correcto | 3 tablas chicas (2 filas c/u), 5 cajas. |

### 1.3 Notas de diseño (menores, no bloqueantes)

1. **Estados vacíos**: Scouting, Crónicas, Salón de la Fama y Libro de Temporadas se ven espartanos al **inicio** de una carrera (poca variación de color) — es contenido que crece con el tiempo, no un defecto. ✅ *Resuelto:* empty-states ilustrados con `FMEmptyState` (icono en círculo, título, subtítulo, acción opcional).
2. **Partido en vivo** era la pantalla con menor riqueza visual. ✅ *Resuelto:* iconos por tipo de evento en el relato, barra de posesión en vivo, estado inicial con animación.
3. **Setup: Liga** (`SETUP_LEAGUE`) era la pantalla con menos contenido del flujo (136 chars). ✅ *Resuelto:* estrellas de reputación, división, nº de clubes, prize pool total y confederación.
4. **Móvil**: verificado con viewport 390×844 — ninguna vista rompe el layout móvil. ✅ *Resuelto:* el bug de tablas recortadas también aplicaba en móvil y quedó corregido con `min-h-0`.
5. ~~**Fondos oscuros en Buzón/Prensa/Crónicas/Scouting**~~ → **NOTA CORREGIDA**: era un artefacto de la primera pasada contaminada por el ErrorBoundary. Los screenshots reales de ambas auditorías confirman que esas vistas son **claras (~90% light)**, coherentes con el resto. *No hay fondos oscuros por diseño fuera del flujo de partido.*

### 1.4 Auditoría de coherencia estética (análisis transversal)

> **Resultado:** coherencia **~90%** — se percibe un único juego con sistema de diseño ("FM Industrial Steel"). Verificado con color medio de píxeles (meanRGB) de las 41 pantallas + análisis de código.

| Dimensión | Veredicto | Detalle |
|---|---|---|
| **Tipografía** | 🟢 Excelente | `Verdana, sans-serif` en ~todos los componentes (FMUI + vistas). |
| **Paleta fondo/cajas** | 🟢 Muy buena | 35/41 pantallas en la familia verde-gris clara (meanRGB `[213-235, 219-236, 197-219]`); cajas `#e8ece8` + borde `#a0b0a0`. |
| **Componentes UI** | 🟢 Muy buena | FMBox/FMButton/FMTable/FMModal centralizados; tabs activos `#3a4a3a`; esquinas `rounded-sm`. |
| **Flujo Setup vs juego** | 🟡 Diferente por diseño | El wizard de creación usa estética propia (fondo más azulado `SETUP_USER`), coherente internamente pero distinta del juego. |
| **Verde-gris vs gris azulado** | 🟠 Antes ruidoso → ✅ **unificado** | Se reemplazó el gris azulado visible por la paleta verdosa (main `#b8c4b8`, theads, ErrorBoundary, PeopleHub, InboxView, menú contextual, modales de traspaso/contrato, Scouting, ClubReport, LOADING). |
| **Botones de acción** | 🟠 Antes mixto → ✅ **unificado** | El azul `blue-700`/`blue-600` del flujo de partido y modales ahora usa verde militar `#3a4a3a`/`#4a6a4a`. |
| **Dark mode residual** | ✅ **eliminado** | Se quitó el toggle de clase `dark` y todo el bloque CSS `.dark` (index.css); `darkMode` queda solo como campo de guardado para retrocompatibilidad. |
| **Excepciones intencionales** | ✅ Correctas | Cancha en Tácticas/Partido (verde oscuro), marcador negro en Partido/Resumen, colores de equipos (azules reales en `data/static.ts`) — no se tocan. |

### 1.5 Coherencia de jerarquía, espaciado y densidad

> Medido con DOM real de las 41 pantallas (texto, botones, filas de tabla) + análisis de clases.

| Dimensión | Veredicto | Detalle |
|---|---|---|
| **Jerarquía tipográfica** | 🟢 Coherente | Patrón consistente en todas las vistas: título grande `text-xl/2xl font-black uppercase italic tracking-tighter`, subtítulo `text-[9-10px] font-bold uppercase tracking-widest`, cuerpo `text-[10-11px]`. Cabeceras de FMBox con degradado propio. |
| **Escala de tamaños** | 🟢 Uniforme | Textos micrométricos en rango `text-[8px]`–`text-[12px]` en casi todo el juego; solo los títulos escalan (`xl/2xl/3xl`). Es una decisión de diseño "densa" pero consistente. |
| **Espaciado** | 🟢 Coherente | `p-2/4`, `gap-2/3`, `rounded-sm` en la práctica totalidad; modales flotantes con `max-h-[85-90vh] overflow-y-auto`. |
| **Densidad (texto por pantalla)** | 🟠 Desbalanceada pero justificada | Rango enorme: Mercado 25.050 chars y Plantel 8.742 vs. Partido 129 y Setup Liga 239. Las pantallas densas son tablas de datos (esperable); las ligeras son flujos de acción (partido, setup). El único outlier raro: **Partido en vivo con solo 129 chars** (es inmersivo por diseño, el relato crece con la simulación). |
| **Densidad (interacción)** | 🟢 Aceptable | Tácticas 283 botones (pizarra), PeopleHub 300 (diálogos), Mercado 476 (filas) — todas son superficies interactivas por naturaleza. |
| **Responsive** | 🟢 Verificado | 390×844 sin roturas; tablas con vistas mobile dedicadas (SquadView/NT tienen 3 layouts). |
| **Conclusión jerarquía** | 🟢 | No hay pantallas "perdidas"; la jerarquía tipográfica y el espaciado son sistemáticos. La densidad varía por tipo de superficie (tabla vs. flujo), lo cual es correcto. *Mejora opcional:* aumentar el tamaño de texto base en pantallas de lectura (Media/Crónicas) si se busca accesibilidad. |

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
| `Sidebar` (desktop/menu) | ⚠️ Pendiente reescritura | Actualmente es lista plana original (30+ ítems, submenús sueltos). Coexiste con `BottomNav` como dos árboles completos — bug de navegación pendiente en Fase 0.5. |
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
20. **🔴 FIX BUG — Sidebar duplica navegación de BottomNav** → Sidebar es la lista plana original sin modificar; coexiste con BottomNav como dos árboles completos. Pendiente reescribir Sidebar con 3 capas (Núcleo/Departamentos/Detalle) en Fase 0.5.
21. **🔴 FIX BUG — Botón de ayudante duplicado en Táctica** → El botón viejo `🎩 CONSEJO DEL AYUDANTE` sigue en la toolbar junto al `DialogueAvatar` condicional. Pendiente eliminar botón viejo en Fase 0.5.
22. **Fondos temáticos: placeholder, no escenas fotográficas** → `ScreenBackground.tsx` tiene 12 gradientes radiales sutiles. Pendiente Fase 6 real con imágenes fotográficas + grano/desenfoque.

**Criterio de salida Fase 0:** pendiente Fase 0.5.

- [x] Reemplazar README.md (template CodeSandbox eliminado)
- [x] Actualizar ESTADO_PANTALLAS.md con estado real
- [x] Resolver duplicación de fuentes de datos de jugadores: **`public/data/convertedPlayers.json` es la fuente canónica para población masiva (29K jugadores, carga en runtime). `data/realPlayers.ts` se mantiene como lista específica de jugadores reales para inyección selectiva (`injectRealPlayers`). No son redundantes — propósitos distintos.**
- [ ] Congelar diseño de navegación y estética → **movido a Fase 0.5** (Sidebar sigue sin reescribir; coexiste con BottomNav como dos árboles completos)

**Criterio de salida Fase 0:** pendiente Fase 0.5.

---

## 📋 Fase 0.5 — Corregir lo que quedó a medias (hallazgos de auditoría real)

Estos ítems fueron reportados como parte de fases "✅" pero **verificados como incompletos o contradictorios** contra la spec, leyendo el código directamente:

- [ ] **Doble menú de navegación (BUG, prioridad alta).** `Sidebar.tsx` sigue siendo la lista plana original (30+ ítems, submenús SENIOR/RESERVE/U20/MARKET/TORNEOS sueltos) — ningún commit lo modificó desde su creación. Corre en paralelo con `BottomNav.tsx` (los 5 tabs de Capa 1), sin relación jerárquica entre ambos. **Acción:** reescribir `Sidebar.tsx` para reflejar las 3 capas ya definidas (Núcleo/Departamentos/Detalle), o eliminarlo si `BottomNav` + sheet "Más" alcanza en mobile — no deben coexistir dos árboles completos.
- [ ] **Botón de ayudante duplicado en Táctica (BUG, prioridad alta).** El `DialogueAvatar` (avatar de esquina fija, `position: fixed`, con badge pulsante) **sí está bien implementado** — pero solo aparece condicionalmente (`assistantTrigger`). El botón viejo `🎩 CONSEJO DEL AYUDANTE` de la toolbar **sigue existiendo, siempre visible, sin condición**, en `TacticsView.tsx` línea ~762. Quedaron dos entradas al mismo diálogo en la misma pantalla. **Acción:** eliminar el botón de toolbar; el avatar de esquina es la única entrada, tal como se diseñó.
- [ ] **Fondos temáticos son placeholder, no lo especificado (calidad, prioridad media).** `ScreenBackground.tsx` tiene 12 entradas, es cierto — pero son gradientes radiales de un solo color sin foto ni textura (ej. `MATCH: 'radial-gradient(...rgba(10,30,10,0.10)...)'`). La spec pedía escenas fotográficas con grano/desenfoque en b/n (vestuario, sala de prensa, pizarra). Lo actual es un tinte de color, no un fondo escenográfico. **Acción:** esto sigue siendo trabajo de Fase 6, no está "hecho" — solo hay un lugar (`VIEW_BACKGROUNDS` en ese archivo) donde después conectar las imágenes reales.
- [ ] **Auditar el resto de vistas por el mismo patrón de duplicación.** Solo se confirmó el bug en Táctica; `MarketView` y `TrainingView` (donde `DialogueAvatar` también se usa) están limpios (sin botón viejo). `PreMatchView` tiene el botón viejo sin `DialogueAvatar` — no es duplicación, pero usa el patrón antiguo; pendiente alinear cuando `checkAssistantTrigger` soporte `PRE_MATCH`.

**Criterio de salida:** un solo sistema de navegación visible a la vez, un solo punto de entrada por diálogo de personaje, y `ScreenBackground` reclasificado en el estado del proyecto como "pendiente real" en vez de aparecer como resuelto.

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
- [ ] Tests de motor, economía y guardado/carga (pendiente para próxima iteración)

**Criterio de salida Fase 4:** parcial. Suite mínima creada y funcionando.

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
