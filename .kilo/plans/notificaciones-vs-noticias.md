# Notificaciones vs Noticias: separar el buzón del diario

## Estado: ✅ PASOS 1-6 IMPLEMENTADOS (tipos, migración, generadores, reasignación, push, UI). Pendiente: paso 7 (validación en partida real: avanzar ~30 días y revisar buzón + diario).

## 1. Contexto y problema

Hoy conviven **dos canales** que se pisan entre sí:

| Canal | Estructura | UI | Problemas |
|---|---|---|---|
| Buzón (`world.inbox`, `InboxMessage`) | Categorías `MARKET, SQUAD, STATEMENTS, FINANCE, COMPETITION, SCOUTING, PEOPLE` | `InboxView` ("CORREO") | Mezcla mensajes personales con cosas de prensa: "Ranking Mundial de Ligas", traspasos de otros clubes, "Noticias de Liga" de terceros |
| Prensa (`world.mediaNews`, `MediaNews`) | `type: HEADLINE/FEATURE/RUMOR/CRITICISM/PRAISE` + `category: MATCH/TRANSFER/INJURY/BOARD/GENERAL` | `MediaView` ("Prensa y Medios") | Categorías planas, no son secciones de diario. No hay secciones ni generación de *Despidos* ni de *Clasificación* |
| Push del navegador (`services/notifications.ts`) | API Notification | SettingsModal | Dispara para SQUAD/MARKET/FINANCE sin distinción de importancia → spam |

**Regla de oro (nueva):**
- **Notificación** = asunto interno e importante para el *usuario humano* (le exige saber y/o decidir). Es el correo entre el juego y el manager.
- **Noticia** = lo que dice la palabra: el diario deportivo del mundo del juego, organizado por **secciones**.
- Un mismo evento puede emitir **ambos**: noticia siempre (si es relevante para el diario) + notificación solo si **involucra directamente al usuario** (su club, su plantel, su cargo).

---

## 2. Modelo de datos (`types.ts`)

### 2.1 Secciones del diario (nuevo)

```ts
export type NewsSection =
  | 'MERCADO'        // Fichajes, cesiones, cláusulas, rumores, deadline day
  | 'CLASIFICACION'  // Tablas, movimientos, ascensos, descensos, sanciones de puntos
  | 'DESPIDOS'       // Ceses y nombramientos de entrenadores en todo el mundo
  | 'RESULTADOS'     // Partidos destacados, goleadas, sorpresas, derbis
  | 'LESIONES'       // Lesiones de jugadores importantes (cualquier club)
  | 'INTERNACIONAL'  // Selecciones, copas continentales, ranking de ligas
  | 'TU_CLUB';       // Noticias que involucran al club del usuario
```

**Decisión:** `TU_CLUB` es una **sección virtual** (filtro/etiqueta destacada), no una sección temática: una noticia de tu club también pertenece a su sección temática (p. ej. un traspaso tuyo es `MERCADO` con etiqueta "Tu club"). Evita duplicar noticias y permite la portada "Tu Club" sin copias.

### 2.2 `MediaNews` (cambios)

```ts
export interface MediaNews {
  id: string;
  date: Date;
  type: 'HEADLINE' | 'FEATURE' | 'RUMOR' | 'CRITICISM' | 'PRAISE'; // género periodístico (se mantiene)
  section: NewsSection;          // NUEVO: reemplaza `category`
  headline: string;
  subheadline: string;
  body: string;
  clubId?: string;
  competitionId?: string;
  playerId?: string;
  isUserClubNews: boolean;       // se mantiene → alimenta TU_CLUB
  read: boolean;
  featured?: boolean;            // NUEVO: noticia destacada en portada
}
```

`generateGeneralNews` (el filler diario) se reencuadra a secciones reales o se elimina: hoy genera titulares genéricos e inmutables ("El VAR sigue generando polémica…") que se repiten; se reemplaza por noticias derivadas de estado real del mundo.

### 2.3 `InboxMessage` (cambios)

```ts
export type NotificationPriority = 'INFO' | 'IMPORTANT' | 'CRITICAL';

export interface InboxMessage {
  id: string;
  date: Date;
  category: MessageCategory;     // se mantiene
  priority: NotificationPriority; // NUEVO (default 'INFO' en saves viejos)
  actionRequired?: boolean;      // NUEVO: el mensaje exige una decisión del usuario
  subject: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
}
```

### 2.4 Push del navegador (`services/notifications.ts`)

- Nueva firma `sendNotification(title, body, tag, priority)`.
- **Solo disparan push `IMPORTANT` y `CRITICAL`.** `INFO` nunca genera push del navegador.
- `addInboxMessage` deja de decidir por categoría (`SQUAD/MARKET/FINANCE` → push); decide por prioridad. Se elimina `sendInboxNotification(subject)` como disparo automático por categoría.

---

## 3. Emisión de eventos: doble canal

En `WorldManager` se agregan dos helpers y se usa en cada punto de emisión:

```ts
// Noticia: informa al mundo. Se llama SIEMPRE que el evento sea digno del diario.
publishNews(section: NewsSection, data: Partial<MediaNews>): void
  // setea id/date/read=false, isUserClubNews según involucre al userClub, cap 100 (se mantiene)

// Notificación: asunto interno. Solo si involucra directamente al usuario.
notifyUser(category, priority, subject, body, date, relatedId?, actionRequired?): void
  // wrapper de addInboxMessage con priority/actionRequired; push solo si priority != 'INFO'
```

**Ejemplo — traspaso completado de un jugador del usuario:**
1. `publishNews('MERCADO', { headline: "Fulanito ficha por X", isUserClubNews: true })` → aparece en el diario, sección Mercado, con etiqueta "Tu club".
2. `notifyUser('MARKET', 'IMPORTANT', 'Traspaso completado: Fulanito', …, actionRequired: true)` → buzón con prioridad.

**Ejemplo — traspaso entre dos clubes IA:** solo `publishNews('MERCADO', …)`. Ya no llega al buzón.

---

## 4. Generadores de noticias por sección

| Sección | Generador | Estado |
|---|---|---|
| `MERCADO` | `generateTransferNews` (existe) → se reencuadra a `section: 'MERCADO'`. Sumar: cláusulas activadas, cesiones/opción de compra, rumores (`checkTransferRequestMotives` ya emite noticia RUMOR → sección MERCADO), deadline day | Reencuadrar + ampliar |
| `CLASIFICACION` | **NUEVO** `generateStandingsNews(date)`: resumen semanal del movimiento en tablas (líder, zona de descenso, ascenso). Mover acá: "Noticias de Liga" de ascenso/descenso de *otros* clubes (hoy van al buzón), sanciones de puntos (hoy al buzón) | Nuevo |
| `DESPIDOS` | **NUEVO** `simulateCoachChanges(date)`: evaluación mensual/semanal de clubes IA (repetición por resultados/expectativa del objetivo → probabilidad de cesar al DT), nombramiento de reemplazante desde `world.staff` (HEAD_COACH desempleados o asistentes promovidos) + `generateFiringNews`. Si el cesado es del **club del usuario** → además notificación `CRITICAL` y el juego debe ofrecer elegir DT (reusar flujo de `replaceHeadCoach`) | Nuevo |
| `RESULTADOS` | `generateMatchNews` (existe) → `section: 'RESULTADOS'`. Destacar (featured): goleadas (≥4 goles de diferencia), sorpresas (equipo de mucho menor reputación gana), partidos de grandes clubes | Reencuadrar + destacar |
| `LESIONES` | `generateInjuryNews` (existe) → `section: 'LESIONES'`. Solo lesiones relevantes: jugador importante (CA/reputación alta), del club del usuario, o de larga duración (≥30 días) | Reencuadrar + filtrar |
| `INTERNACIONAL` | `generateEconomicNews` (existe pero escribe al buzón) → pasa a `publishNews('INTERNACIONAL', …)`: "Ranking Mundial de Ligas", movimientos de reputación. Sumar: clasificaciones continentales, copas | Mover + ampliar |
| `TU_CLUB` | Sección virtual: `isUserClubNews` ya etiqueta cada noticia. Portada "Tu club" = filtro | Etiqueta (ya existe) |

**Punto de integración (ciclo diario en `App.tsx` ~línea 401):**
- Diario: `world.generateGeneralNews` se elimina/reemplaza; `processAIActivity` ya corre diario.
- Semanal (día de la semana fijo, p. ej. lunes): `generateStandingsNews` + `simulateCoachChanges`.
- Fin de temporada (`lifecycleManager`): ascensos/descensos → noticia `CLASIFICACION` (+ notificación si es el club del usuario); ranking de ligas → `INTERNACIONAL`.

---

## 5. Reasignación de mensajes existentes (inbox → diario o prioridad)

| Mensaje actual (buzón) | Hoy | Pasa a |
|---|---|---|
| "Ranking Mundial de Ligas" | `STATEMENTS` | Noticia `INTERNACIONAL` |
| "Traspaso: X fichó a Y" (clubes IA) | `MARKET` | Noticia `MERCADO` |
| "Noticias de Liga" ascenso/descenso (otro club) | `COMPETITION` | Noticia `CLASIFICACION` |
| Sanción sub-21 (otro club) | `COMPETITION` | Noticia `CLASIFICACION` |
| "La reputación de la liga…" (generateEconomicNews) | `STATEMENTS` | Noticia `INTERNACIONAL` |
| Ascenso/descenso del club del usuario | `COMPETITION` | **Notificación** `COMPETITION/CRITICAL` + noticia `CLASIFICACION` (doble) |
| Traspaso/cesión del club del usuario | `MARKET` | **Notificación** `MARKET/IMPORTANT` + noticia `MERCADO` (doble) |
| Lesión de jugador del usuario | `SQUAD` | **Notificación** `SQUAD/IMPORTANT` + noticia `LESIONES` (doble) |
| "¡DIRECTIVA HARTA!", sanciones propias, descenso propio | `SQUAD/COMPETITION` | **Notificación** `CRITICAL`, `actionRequired` si aplica |
| Cláusula activada sobre jugador tuyo, comisión de agente | `MARKET/FINANCE` | **Notificación** `IMPORTANT` + noticia `MERCADO` |
| Ofertas de trabajo de otros clubes | `STATEMENTS` | **Notificación** `IMPORTANT` (o `CRITICAL`), `actionRequired: true` |
| Consejos del staff, scouting, cosecha de cantera | `SQUAD/SCOUTING` | **Notificación** `INFO` (sin push) |

---

## 6. UI

### 6.1 `InboxView` → "Notificaciones" (buzón)
- Chips de prioridad: `INFO` (gris), `IMPORTANT` (ámbar), `CRITICAL` (rojo) con icono (p. ej. `Info`, `AlertTriangle`, `AlertOctagon`).
- Filtros: Todos / No leídas / Por prioridad / Requiere acción. Orden: prioridad desc → fecha desc.
- El detalle muestra el chip de prioridad y un botón de acción si `actionRequired` (ya existe el patrón de "Acción Requerida").
- Sidebar: renombrar "Buzón" → "Notificaciones" (icono `Bell`). Badge existente de no leídas se mantiene; opcional badge rojo si hay `CRITICAL` sin leer.

### 6.2 `MediaView` → "Diario" (prensa)
- Pestañas de sección: Portada / Tu Club / Mercado / Clasificación / Despidos / Resultados / Lesiones / Internacional.
- Portada: noticias `featured` arriba + las más recientes; la pestaña Tu Club filtra `isUserClubNews`.
- Cada nota muestra etiqueta de sección + tipo (Titular/Reportaje/Rumor/Crítica/Elogio) + marca "Tu club".
- Mantener vista de detalle existente (headline, subheadline, body, fecha, club).

### 6.3 Home (`App.tsx`)
- La tarjeta "Últimas Noticias" pasa de `world.inbox` a `world.mediaNews` (hoy muestra el buzón; debe mostrar el diario).

---

## 7. Guardado y compatibilidad (`services/saveLoadService.ts`)

- `InboxMessage.priority` y `MediaNews.section` son campos **opcionales en lectura**:
  - Al cargar: `priority ?? 'INFO'`; `section` derivado del `category` viejo (`TRANSFER→MERCADO`, `MATCH→RESULTADOS`, `INJURY→LESIONES`, `BOARD→TU_CLUB`/`CLASIFICACION`, `GENERAL→INTERNACIONAL`).
  - Esto evita romper partidas guardadas antes de la feature.
- Caps actuales se mantienen: inbox 800, mediaNews 100.

---

## 8. Pasos de implementación (orden sugerido)

1. **Tipos** (`types.ts`): `NewsSection`, `NotificationPriority`, `MediaNews.section/featured`, `InboxMessage.priority/actionRequired`.
2. **Migración** (`saveLoadService.ts`): defaults al cargar saves viejos.
3. **WorldManager**: `publishNews` + `notifyUser`; reencuadrar `generateMatchNews/generateTransferNews/generateInjuryNews/generateEconomicNews` a secciones; mover "Noticias de Liga"/sanciones de terceros a noticias; prioridades en los `addInboxMessage` existentes según tabla §5.
4. **Nuevos generadores**: `generateStandingsNews` + `simulateCoachChanges`/`generateFiringNews`.
5. **`notifications.ts`**: push por prioridad (solo IMPORTANT/CRITICAL).
6. **UI**: InboxView (prioridades/filtros), MediaView (secciones/portada), Sidebar (nombres/iconos), Home (noticias del diario).
7. **Validación**: `npx tsc --noEmit`, `npm run build`, y test manual con avance simulado de ~30 días revisando buzón + diario.

## 9. Criterios de aceptación

- [ ] El buzón solo contiene asuntos que involucran al usuario; nada de otros clubes salvo que le afecte.
- [ ] El diario tiene las 7 secciones funcionando (Despidos y Clasificación con contenido real del mundo).
- [ ] Push del navegador solo para `IMPORTANT`/`CRITICAL` (no spam por scouting/consejos).
- [ ] Un traspaso/lesión del usuario aparece en buzón (IMPORTANT) **y** en el diario (etiquetado "Tu club").
- [ ] Saves viejos cargan sin errores (campos nuevos con default).
- [ ] `tsc --noEmit` y `npm run build` en verde.

## 10. Archivos afectados

- `types.ts` (tipos nuevos)
- `services/worldManager.ts` (helpers + generadores + prioridades)
- `services/notifications.ts` (push por nivel)
- `services/lifecycleManager.ts` (fin de temporada → noticias/notificaciones)
- `services/saveLoadService.ts` (migración)
- `components/InboxView.tsx`, `components/MediaView.tsx`, `components/Sidebar.tsx`, `App.tsx` (UI)
- Nuevo: generadores de Despidos y Clasificación (dentro de `worldManager.ts` o `services/newsService.ts` si se prefiere modularizar)
