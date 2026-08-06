# 🎭 Pilar D — Sistema de Diálogos con Personajes y Asistente Táctico

> **Documento de estado del juego + plan de integración.**
> Incorpora la spec de UI/UX de diálogos con personajes del staff y la traduce a un plan accionable sobre el código real del proyecto.
>
> **Fecha:** 6 agosto 2026 · Basado en lectura del código (`services/dialogueSystem.ts`, `services/engine.ts`, `components/StaffView.tsx`, `components/TacticsView.tsx`, `components/PreMatchView.tsx`, `types.ts`, `App.tsx`).
> **Estado:** 🟢 **FASE 1 IMPLEMENTADA** (Ayudante) · 🟢 **FASE 2 IMPLEMENTADA** (Preparador Físico) · 🟢 **FASE 3 IMPLEMENTADA** (Carpeta de Refuerzos).

---

## 0. Resumen ejecutivo

| Cuestión | Respuesta |
|---|---|
| ¿Qué se construye? | 3 diálogos con personajes del staff: **Ayudante de Campo** (consejo táctico + anuncio del XI), **Preparador Físico** (plan de carga), **Director Deportivo** (carpeta de refuerzos). |
| ¿Qué ya existe y se reutiliza? | `DialogueSystem` (pools de texto + resolvers con efectos), staff con roles reales (`ASSISTANT_MANAGER`, `FITNESS_COACH`), datos del motor (`fitness`, `formRatings`, `TacticSettings`, `transferBudget`, `selectBestXI`), design system `FMUI`. |
| ¿Qué hay que crear? | Capa de servicios de recomendación (motor), componentes de diálogo (`CharacterDialog`, `OptionCard`, `LineupPitch`, etc.), un store de diálogo, y **un rol nuevo de staff: `SPORTING_DIRECTOR`**. |
| Puntos de entrada al flujo | Tácticas y Previa → Ayudante · Entrenamiento y Cuerpo Técnico → Preparador Físico · Mercado y Fichajes → Carpeta de Refuerzos · más disparos proactivos por Buzón. |
| Prioridad | 1) Ayudante · 2) Preparador Físico · 3) Carpeta de Refuerzos (tal y como pide la spec). Scouting rival = epic separado, fuera del MVP. |

**Principio rector (de la spec):** los diálogos NO son ventanas de chat. Son **interfaces de decisión**: muestran contexto, presentan opciones con consecuencias, explican la recomendación y permiten acción inmediata. Los textos salen de **pools predefinidos** (nada de IA) y la **lógica de recomendación vive en la capa de servicios** (el "backend" de este proyecto client-side).

---

## 1. Estado actual del juego (contexto real del código)

### 1.1 Sistema de diálogos existente — `services/dialogueSystem.ts`

Ya existe `DialogueSystem` (clase estática) con el patrón que la spec pide:

- **Pools de texto por tono:** `getTopicOptions(type)` → `Record<DialogueTone, string>` (MILD / MODERATE / AGGRESSIVE) para 18 `DialogueType`.
- **Resolvers con efectos reales** (moral, tensión, relaciones, inbox):
  - `resolveCoachPlayerInteraction(player, type, tone, date)`
  - `resolveCoachStaffInteraction(staff, type, tone, date)`
  - `resolvePressStatement(topic, tone, date)` · `resolveManagerContact(target, tone, date)`
  - `resolveBoardInteraction(clubId, topic, tone, date)` · `resolveInitiatedMotive(...)`
- Cada resolver: muta estado (`world.*`), registra `InteractionLogEntry` (canal `COACH_PLAYER | COACH_STAFF | COACH_PRESS | COACH_MANAGER | COACH_BOARD`) y devuelve `DialogueResult { text, moraleChange, reactionType }`.
- **Dónde se consume hoy:** `PeopleHub` (interacciones con jugadores/staff/directiva/prensa/red de DTs) y `PlayerModal` (charlas + motivos personales).

**Hueco:** el sistema actual es *proactivo* (el usuario elige a quién hablar). Lo que aporta el Pilar D son diálogos *reactivos al estado del juego* (el ayudante viene a ti antes del partido, el PF te alerta de la carga, el director deportivo te trae la carpeta) con **tarjetas de opción → acción inmediata** (aplicar táctica, aplicar plan, enviar ofertas).

### 1.2 Personajes disponibles (staff) — `types.ts` + `StaffView.tsx`

| Rol (`StaffRole`) | Etiqueta UI | ¿Tiene personaje de diálogo? |
|---|---|---|
| `HEAD_COACH` | Director Técnico | Es el usuario (el propio DT). |
| `ASSISTANT_MANAGER` | Segundo Entrenador | ✅ **Ayudante de Campo** (Paso 1 y 2). Ya existe delegación de prensa/charlas y el `DELEGATE_MATCH`. |
| `FITNESS_COACH` | Preparador Físico | ✅ **Preparador Físico** (plan de carga). Ya existe delegación de entrenamiento. |
| `PHYSIO` | Fisioterapeuta | Oportunidad futura (parte médico), no en MVP. |
| `RESERVE_MANAGER` / `YOUTH_MANAGER` / `SCOUT` | — | Sin diálogo propio en este pilar (SCOUT alimenta la carpeta con informes). |
| **`SPORTING_DIRECTOR`** | Director Deportivo | ✅ **ROL CREADO (Fase 3)** — Carpeta de Refuerzos. 1 por club en `generateStaffForClub`, atributos con peso en `judgingAbility`/`judgingPotential`/`manManagement`. |

El staff ya tiene los atributos que la spec necesita para justificar recomendaciones: `attributes.tacticalKnowledge`, `attributes.manManagement`, `attributes.motivation`, `tacticalStyle` (CONTROL/ATTACK/DEFENSE/COUNTER/BALANCED), `preferredFormation`, `pressIntensity`, `possessionVsCounter`, `reputation`, `morale`.

### 1.3 Datos del motor disponibles (para calcular recomendaciones)

| Dato | Fuente (código) | Uso en diálogos |
|---|---|---|
| `Player.fitness` (0-100) | `types.ts` | Previa ya muestra media de condición; PF lo usa para carga/riesgo. |
| `Player.formRatings[]` | `types.ts` | Racha de forma → justificación del XI y del consejo táctico ("[Delantero] en racha"). |
| `Player.morale`, `personality`, `injuryProneness`, `injury?` | `types.ts` | Justificación de ausencias del XI. |
| `Player.tacticalFamiliarity` (0-100) | `types.ts` | Razón de banquillo ("baja afinidad táctica"). |
| `Player.stats.internal/visible` | `types.ts` | "Mejor definición", "Gran forma física" en tooltips. |
| `Player.value`, `salary` | `types.ts` | Viabilidad en la carpeta de refuerzos. |
| `TacticSettings` (mentalidad, cierre, pase, tempo, ancho, línea defensiva…) | `types.ts` | Presets de los 3 arquetipos (Conservador/Equilibrado/Arriesgado). |
| `Tactic` guardado por el usuario | `types.ts` | El diálogo debe partir del esquema actual del usuario. |
| `world.selectBestEleven(clubId, squad, tacticId?)` (autopick del once) + `MatchSimulator.selectBestXI` (privado, solo sim AI) | `worldManager.ts` L1365 · `engine.ts` L1486 | Once "ideal" base del Paso 2. |
| `slotFit(p, slot)` / `lineFit(p, line)` | `TacticsView.tsx` L93 | Índice de aptitud por puesto (ya existe y ya marca "Recomendado"). |
| `TacticalReport { title, summary, keyStrength, keyWeakness, suggestion }` | `types.ts` | **Ya existe** — el informe del asistente en `MatchView` ("Solicitar informe del asistente"). Reutilizable para el Paso 1. |
| `totalIntensity` de `trainingSchedule` | `lifecycleManager.ts` L25 | Carga de entrenamiento → "Carga media" del PF. |
| `Club.finances.transferBudget` / `wageBudget` | `types.ts` | Presupuesto de la carpeta. |
| `Club.primaryColor/secondaryColor` | `types.ts` | Color del equipo para botones/avatar del personaje (spec §1.3). |
| `world.getStaffByClub(clubId)` | `worldManager.ts` | Localizar ASSISTANT_MANAGER / FITNESS_COACH / SPORTING_DIRECTOR del club. |
| `ScoutingReport[]` | `types.ts` | Fuente de candidatos (jugadores ya informados). |
| `TransferOffer` + `world.isTransferDeadlineDay(date)` | `worldManager.ts` L2190 | Enviar ofertas por lote; disparo estacional. |
| `world.addInboxMessage(...)`, `recordInteraction`, `adjustRelationship` | `worldManager.ts` | Efectos y notificaciones (mismo patrón que `DialogueSystem`). |

### 1.4 Design system UI — `components/FMUI.tsx`

Los componentes de la spec se **adaptan al sistema "FM Industrial Steel"** en lugar de los estilos genéricos del documento:

| Spec genérica | Adaptación al proyecto |
|---|---|
| `border-radius: 16px/12px`, modales redondeados | `rounded-sm` (estética FM existente). |
| Fondo oscuro `rgba(0,0,0,0.85)` | Overlays existentes: `bg-slate-900/60 backdrop-blur-sm` (StaffView, modales). |
| `font-size: 16px` mínimo | Escala del juego `text-[9px]…text-2xl`; títulos grandes + cuerpo legible. Se mantiene el principio de legibilidad pero con la densidad FM. |
| Avatar 80px con foto | **No hay fotos de staff** → círculo con iniciales + borde con `primaryColor` del club (patrón ya usado en Previa con `shortName`). |
| Tarjetas `#f5f5f5`, botón primario color equipo | `FMBox`/`FMButton` + verde militar `#3a4a3a` (acción principal) + `primaryColor` del club en acentos. |
| ⭐ Recomendado dorado `#FFD700` | Se mantiene **oro `#FFD700`** (ya es la convención del juego para medallas/premios). |
| Animaciones 300ms | Convención existente `animate-zoom-in` + keyframes propios (ver §6). |

**Regla clave:** los diálogos reutilizan `FMBox`, `FMButton`, `FMModal`, `FMTable`, `FMEmptyState` y `ScreenBackground`; NO se crea un sistema de estilos paralelo.

---

## 2. Arquitectura propuesta

```
components/dialogs/                 ← nueva carpeta (capa de presentación)
  ├── CharacterDialog.tsx           ← base: header personaje + bubble + opciones + footer
  ├── SpeechBubble.tsx              ← burbuja con "colita", alineación, avatar/iniciales
  ├── OptionCard.tsx                ← tarjeta de opción (icono, título, efectos, recomendada, seleccionada)
  ├── LineupPitch.tsx               ← cancha 2D SVG + círculos + tooltip + banquillo
  ├── FitnessPanel.tsx              ← barras carga/riesgo + jugadores en rojo
  ├── TransferFolderTable.tsx       ← tabla candidatos + semáforo + resumen
  └── flows/
      ├── AssistantAdviceDialog.tsx    ← Ayudante (paso 1 → paso 2)
      ├── FitnessCoachDialog.tsx       ← Preparador Físico
      └── TransferFolderDialog.tsx     ← Director Deportivo

services/
  └── staffAdviceService.ts         ← nueva capa de lógica ("backend"): recomendaciones, XI, carpeta

stores/
  └── dialogueStore.ts              ← estado de la máquina de diálogo (Zustand)

types.ts                            ← + StaffRole.SPORTING_DIRECTOR, + DialogueType.*, + interfaces de datos
```

### 2.1 Máquina de estados del diálogo (spec §6 → store)

```typescript
type EstadoDialogo =
  | 'cerrado'       // No visible
  | 'abriendo'      // Animación de entrada
  | 'paso1'         // Primer paso del flujo
  | 'paso2'         // Segundo paso (solo Ayudante)
  | 'confirmando'   // Loading al aplicar
  | 'resultado'     // Feedback tras aplicar (texto de reacción del personaje)
  | 'cerrando';     // Animación de salida

interface DialogueStore {
  dialog: 'ASSISTANT' | 'FITNESS' | 'TRANSFERS' | null;
  estado: EstadoDialogo;
  paso: number;
  seleccion: string | null;
  data: AssistantData | FitnessData | TransferFolderData | null;  // datos ya calculados
  resultado: DialogueResult | null;
  // acciones
  open(tipo, data); nextPaso(); seleccionar(id); confirmar(); cerrar();
}
```

**Decisión:** el store **solo recibe datos ya calculados** (`data`) desde `staffAdviceService`. El componente no calcula nada (spec §13.2).

---

## 3. Diálogo 1 — Ayudante de Campo (flujo de 2 pasos)

### 3.1 Paso 1: Consejo Táctico

**Personaje:** `staff.role === 'ASSISTANT_MANAGER'` del club. Si no existe, se cae a un texto genérico del segundo entrenador (o al DT) — nunca romper.

**Contenido (spec §2.1):** burbuja con consejo → 3 tarjetas de arquetipo → justificación → `[Confirmar táctica] [Volver]`.

| Arquetipo | Icono | Preset de `TacticSettings` |
|---|---|---|
| 🛡️ CONSERVADOR | 🛡️/🔒 | `mentalidad` bajo, `defensiveLine` bajo, `closingDown` bajo, `timeWasting` alto, `marking` ZONAL, `counterAttack` true, `width` estrecho |
| ⚖️ EQUILIBRADO | ⚖️/🎯 | Valores medios (parte del esquema actual del usuario) |
| ⚡ ARRIESGADO | ⚡/🔥 | `mentalidad` alto, `defensiveLine` alto, `closingDown` alto, `timeWasting` bajo, `marking` MAN, `width` amplio, `counterAttack` false |

**Lógica (servicio nuevo — `staffAdviceService.ts`):**

```typescript
interface TacticAdviceOption {
  id: 'CONSERVATIVE' | 'BALANCED' | 'RISKY';
  icono: string; titulo: string; descripcion: string;
  efectos: string[];                    // bullets ("Cierra filas", "Protege la ventaja")
  preset: Partial<TacticSettings>;      // diff sobre el esquema actual
}

interface TacticAdvice {
  textoPrincipal: string;               // del pool, según fuerza relativa de rival
  opciones: TacticAdviceOption[];
  recomendacion: string;                // id del arquetipo
  justificacion: string;                // por qué ese arquetipo
}
```

**Heurística de recomendación (propuesta, calibrable en `config`):**
- **Rival con ataque fuerte** (`rival.players` promedio `currentAbility` alto en posiciones ofensivas) → CONSERVADOR si el propio ataque es débil; si el propio ataque es fuerte y el rival defiende mal → ARRIESGADO.
- **Local vs visitante**, estado de forma (media `formRatings`) y `tacticalFamiliarity` media del plantel → ajustan el peso.
- **Calidad percibida según `attributes.tacticalKnowledge` del ayudante:** con bajo conocimiento táctico, la justificación es más genérica y la recomendación puede ser EQUILIBRADO por defecto (el staff "no se moja").

**Acción al confirmar:** `applyTacticPreset(clubId, archetype)` → muta el `Tactic.settings` activo del club (y opcionalmente `individualSettings` por línea) y pasa al Paso 2. El cambio es **persistente en el save** como cualquier edición de Tácticas.

### 3.2 Paso 2: Anuncio del XI

**Contenido (spec §2.2):** burbuja "Este es nuestro 11…" → **cancha 2D** con el once → **banquillo** con razones → `[¡Al partido!] [Volver]`.

**Lógica (servicio):**

```typescript
interface LineupPlayer {
  playerId: string; slot: number;      // tacticalPosition (misma geometría que TacticsView)
  razones: string[];                   // "⚡ Gran forma", "🎯 Mejor definición", "Suspensión"
}
interface LineupAdvice {
  textoPaso2: string;
  xi: LineupPlayer[];
  banquillo: { playerId: string; razon: string }[];
  resumen: string;                     // subtitulo opcional de la burbuja
}
```

- **Base:** el XI **actual** del usuario (no sobrescribir sin permiso). Si hay huecos o lesionados, rellenar con el ranking `world.selectBestEleven` / `slotFit` ya existente.
- **Razones por jugador** (para tooltip): `formRatings` reciente → "en racha"; `fitness` alto → "gran forma física"; atributo destacado por posición (`disparo` alto en `ST` → "mejor definición"); `tacticalFamiliarity` < 50 → "baja afinidad táctica".
- **Banquillo con razón:** lesionado/sancionado → "Lesión / Suspensión"; fuera por `tacticalFamiliarity` baja → "Baja afinidad táctica"; suplente natural → "Banquillo por rotación".

**Acción al confirmar:** `applyLineup(clubId, xi)` → setea `isStarter` + `tacticalPosition` (mismas funciones que usa `TacticsView.handlePick`). En flujo desde Previa, `[¡Al partido!]` equivale a pulsar `Comenzar partido`.

### 3.3 UI — `LineupPitch.tsx` (cancha 2D)

- SVG con césped (gradiente verde oscuro, igual que Tácticas/Partido) + líneas.
- Jugadores como círculos 40-64px con `primaryColor` del club, número/dorsal, borde blanco.
- `SLOT_CONFIG` / `BASE_COORDS` ya existen en `engine.ts` (L205: `BASE_COORDS[p.tacticalPosition]`) → **reutilizar la misma geometría** para que el once dibujado coincida con el de Tácticas.
- Tooltip al hover (desktop) / tap (móvil): nombre, posición (`POSITION_FULL_NAMES`), razones.
- Responsive: desktop completo; móvil simplificado (iniciales, sin tooltip flotante → panel fijo).

---

## 4. Diálogo 2 — Preparador Físico (plan de carga)

### 4.1 Contenido (spec §3)

**Personaje:** `staff.role === 'FITNESS_COACH'`. Si no existe → texto genérico del `PHYSIO` o del ayudante.

- Burbuja: "Con la final de copa en 3 días, te sugiero bajar la carga para no perder a [J1] y [J2]".
- **Panel de estado del plantel:** barras "Carga media" y "Riesgo lesión" + lista de jugadores en rojo con su %.
- **3 tarjetas:** 🚀 RENDIMIENTO (+atributos, +riesgo) · ⚖️ EQUILIBRIO (sin cambios) · 🧘 RECUPERACIÓN (-atributos, -riesgo) — una marcada ⭐ RECOMENDADO.
- `[Aplicar plan] [Cancelar]`.

### 4.2 Lógica (servicio)

```typescript
interface FitnessReport {
  textoPrincipal: string;
  cargaMedia: number;                  // 0-100, derivada de totalIntensity del plan semanal
  riesgoLesion: number;                // 0-100, f(media fitness, carga, injuryProneness)
  jugadoresRiesgo: { playerId: string; carga: number }[];   // ordenados desc
  opciones: FitnessPlanOption[];       // RENDIMIENTO / EQUILIBRIO / RECUPERACION
  recomendacion: string;
  justificacion: string;
}
```

- **Carga media:** de `Club.trainingWeeklyPlan` + `trainingSchedule` de cada jugador (mismo cálculo que `lifecycleManager` L25: `totalIntensity` → 0-100).
- **Riesgo de lesión:** reutilizar heurística existente (`lifecycleManager` L34-35: `fitness < 60 && totalIntensity > 50 → riesgo`; más `injuryProneness`).
- **Efectos de cada opción** (spec §3): RENDIMIENTO = `+10%` atributos de desarrollo, `+20%` riesgo; RECUPERACIÓN = `-5%` desarrollo, `-30%` riesgo; EQUILIBRIO = sin cambios. Se materializan ajustando `trainingWeeklyPlan`/`trainingSchedule` (intensidad por categoría) para la próxima semana, con efecto inmediato de `fitness` y de crecimiento (usar los multiplicadores de `lifecycleManager`).

### 4.3 UI — `FitnessPanel.tsx`

- Barras 8px con umbrales de color verde <60 / amarillo 60-80 / rojo >80 (spec §3).
- Lista de jugadores en rojo con badge de %.
- **Ojo:** el juego hoy no tiene un campo `carga` por jugador; se **deriva** de `fitness` + intensidad de su `trainingSchedule` + `injuryProneness`. Si más adelante se quiere una carga real, se añade `Player.load` al motor — queda anotado como mejora futura.

---

## 5. Diálogo 3 — Carpeta de Refuerzos (Fichajes)

### 5.1 Contenido (spec §4)

**Personaje:** nuevo rol `SPORTING_DIRECTOR` (ver §5.4).

- Header: "📋 Carpeta de Refuerzos — Mercado de Verano" + presupuesto restante + coste de seleccionados (dinámico).
- **Tabla de candidatos:** jugador / posición / valor / selector + **semáforo de viabilidad** 🟢 Asequible · 🟡 Negociable (requiere venta) · 🔴 Inviable, con tooltip de la razón.
- **Informe del director deportivo:** texto del pool + resumen (Aprobados / En duda / Rechazados).
- `[Enviar ofertas] [Descartar todo]` — botón deshabilitado si coste > presupuesto.

### 5.2 Lógica (servicio)

```typescript
interface TransferCandidate {
  playerId: string; value: number; position: Position;
  viabilidad: 'VIABLE' | 'NEGOTIABLE' | 'INVIABLE';
  razon: string;                        // "Dentro de presupuesto" / "Requiere vender antes" / "Fuera de presupuesto"
}
interface TransferFolder {
  textoInforme: string;
  presupuesto: number;                  // transferBudget
  candidatos: TransferCandidate[];
  resumen: { aprobados: number; enDuda: number; rechazados: number };
}
```

- **Candidatos:** jugadores con `ScoutingReport` del club + objetivos por posición débil (reutilizar heurística de la IA de compras de `worldManager` L1984: "compra en posiciones débiles"). No es el mercado entero: la carpeta es **curada por el director deportivo**.
- **Viabilidad:** `value <= transferBudget` → 🟢 · `value <= transferBudget + valorEstimadoDeVentas` (suma de jugadores marcados como transferibles) → 🟡 · resto → 🔴. La razón concreta sale del pool.
- **Informe del pool:** 3-5 plantillas con huecos `[Jugador]`, `[Posición]`, según cuántos haya en cada franja (misma técnica de interpolación que `getTopicOptions`).

### 5.3 Acción — envío por lote

`sendOffers(clubId, playerIds)` crea un `TransferOffer` por candidato (tipo PURCHASE, importe ≈ `value`), con **validación acumulada** contra `transferBudget` antes de enviar (el propio modal `TransferOfferModal` ya valida individualmente; aquí se valida el lote). Resultado: mensajes al buzón (`MARKET`) + reacciones del director deportivo en `resultado`.

### 5.4 ⚠️ Rol nuevo: `SPORTING_DIRECTOR`

| Dónde tocar | Cambio |
|---|---|
| `types.ts` | `StaffRole` += `'SPORTING_DIRECTOR'` |
| `worldManager.ts` | Generar 1 director deportivo por club en `generateStaffForClub` (L616) (atributos con peso en `judgingAbility`/`judgingPotential`/`manManagement`, `salary` acorde) |
| `StaffView.tsx` | Etiquetas `getRoleLabel`/`getRoleShort` + permisos de delegación (puede sugerir `scoutingDelegatedTo`) |
| `staffAdviceService` | Las recomendaciones de la carpeta se ponderan por sus atributos (director con buen `judgingAbility` → carpeta más precisa) |

**Alternativa (si no se quiere añadir rol):** atribuir la carpeta al `SCOUT` jefe. **Decisión pendiente → ver §9.**

---

## 6. Integración al flujo de juego (mapa de puntos de entrada)

```
TÁCTICAS ──botón "🎩 Consejo del ayudante"──▶ AssistantDialog (paso1 → paso2)
   │                                             │ confirmar → aplica preset + XI
   ▼                                             ▼
PREVIA ──botón junto a "Informe del Cuerpo Técnico"──▶ AssistantDialog (paso1 → paso2)
   │                                             │ "¡Al partido!" → onStart()
   ▼
PARTIDO ── (ya existe: informe del asistente en directo — se deja como está)

ENTRENAMIENTO ──botón "🧘 Plan del preparador"──▶ FitnessCoachDialog ──aplicar plan→ vuelve a Training
CUERPO TÉCNICO ──ficha del PF → botón──▶ FitnessCoachDialog

MERCADO ──botón "📋 Carpeta de refuerzos"──▶ TransferFolderDialog ──enviar ofertas→ NegotiationsView
FICHAJES (NEGOTIATIONS) ──botón──▶ TransferFolderDialog
```

### 6.1 Disparos proactivos (Buzón)

Siguiendo el patrón de `DialogueSystem` (mensaje con `relatedId` + acción), el juego **avisa antes de que pidas el diálogo**:

| Condición | Quién escribe | Mensaje → acción |
|---|---|---|
| Antes de un partido, media de `fitness` del XI < 70 | Preparador Físico | "Alerta de carga" → botón abre `FitnessCoachDialog` |
| Antes de un partido, rival significativamente superior/inferior | Ayudante | "He analizado al rival" → botón abre `AssistantAdviceDialog` (1 vez por fixture) |
| Día de cierre de mercado (`isTransferDeadlineDay` / semana previa) | Director Deportivo | "Carpeta de refuerzos lista" → botón abre `TransferFolderDialog` |

**Config:** `notifications.ts` ya permite activar/desactivar tipos — añadir 3 categorías nuevas ahí.

### 6.2 Estado de flujo (App.tsx / uiStore)

Los diálogos son **overlays globales** (como los modales existentes) activados desde cualquier vista vía `useDialogueStore().open(...)`; **no son nuevas vistas del `switch` de App.tsx**. Se renderizan al final del árbol (junto a los modales de partido/traspaso). Esto evita tocar el router de vistas.

---

## 7. Pools de texto y efectos (extensión de `DialogueSystem`)

Los textos de personaje se añaden **en el mismo estilo que `getTopicOptions`**, agrupados por contexto:

```typescript
// staffAdviceService.ts (o DialogueSystem.getCharacterPhrases)
const PHRASES = {
  assistant: {
    preMatch: [ 'Jefe, he analizado al rival. {justificacion}', 'Tengo el informe de scouting listo…' ],
    xiReady: [ 'Este es nuestro 11. He puesto a {jugador} porque está en su mejor momento.' ],
    resultado: [ 'Táctica aplicada. Buena decisión, Jefe.', 'Entendido. Ajusto el plan.' ],
  },
  fitnessCoach: { alerta: […], plan: […], resultado: […] },
  sportingDirector: { informe: […], aprobado: […], rechazado: […], resultado: […] },
};
```

- **Sin IA**: pool predefinido + interpolación de variables `{jugador}`, `{posicion}`, `{justificacion}`.
- Los **efectos** se registran con `world.recordInteraction` + `adjustRelationship` (nuevos canales: `COACH_ASSISTANT` opcional, o reutilizar `COACH_STAFF`) y `addInboxMessage`, igual que los resolvers actuales.
- Nuevos `DialogueType` para el log: `TACTICAL_ADVICE`, `FITNESS_PLAN`, `TRANSFER_FOLDER`.

---

## 8. Fases de implementación (orden de la spec §13.4)

### Fase 1 — Ayudante de Campo ✅ IMPLEMENTADA (6 ago 2026)

**Archivos creados:**
- `services/staffAdviceService.ts` — `generateTacticAdvice` (heurística: fuerzas por línea + forma/física del plantel), `applyTacticPreset` (presets de arquetipo + `notifyTactics`), `generateLineupAdvice` (XI con razones por jugador + banquillo con razones + relleno de huecos con `slotFit`), `applyLineup` (+ `notifyPlayers`), `getAssistantStaff`.
- `stores/dialogueStore.ts` — máquina de estados Zustand (`dialog`/`estado`/`paso`/`seleccion`/`resultado`/`data`).
- `components/dialogs/` — `CharacterDialog` (base con avatar/footer + tecla Esc), `SpeechBubble` (burbuja con colita), `OptionCard` (recomendada ⭐ dorada / seleccionada con borde del color del equipo), `LineupPitch` (cancha 2D + tooltip con razones + banquillo), `AssistantAdviceDialog` (flujo 2 pasos), `DialogueHost` (host global).

**Integración:** botón "🎩 Consejo del Ayudante" en `PreMatchView` (source `PRE_MATCH`, pasa rival) y `TacticsView` (source `TACTICS`, pasa `tacticId` del esquema seleccionado); `DialogueHost` en `App.tsx` con `onStartMatch` → `setView('MATCH')`; `DialogueType` += `TACTICAL_ADVICE`/`FITNESS_PLAN`/`TRANSFER_FOLDER`; efectos con `recordInteraction` + `addInboxMessage`.

**Validación:** `tsc --noEmit --skipLibCheck` sin errores · `vite build` OK.

**Pendiente menor:** disparo proactivo pre-partido (1×/fixture) desde el buzón — iteración posterior.

### Fase 2 — Preparador Físico ✅ IMPLEMENTADA (6 ago 2026)

**Archivos:**
- `services/staffAdviceService.ts` — `generateFitnessReport` (carga media normalizada 0-100 desde `trainingSchedule`/`totalIntensity`, riesgo de lesión con heurística de `lifecycleManager` + `injuryProneness`, jugadores en riesgo, 3 planes con metadatos, recomendación ⭐), `applyFitnessPlan` (ajusta `trainingSchedule` por factor 1.3/0.7 + efecto inmediato de fitness ±, `notifyPlayers`), `playerLoad`/`playerRisk`, `getFitnessCoach`.
- `components/dialogs/FitnessPanel.tsx` — barras Carga media / Riesgo de lesión con umbrales verde <60 / amarillo 60-80 / rojo >80 + lista de jugadores en riesgo con badge %.
- `components/dialogs/FitnessCoachDialog.tsx` — flujo decisión → resultado (3 planes con `OptionCard`, estado `resultado` del store, `recordInteraction` + `addInboxMessage` con tipo `FITNESS_PLAN`).

**Integración:** `DialogueHost` (caso `FITNESS`); botón "Plan del Preparador" en `TrainingView` (header, suscrito a `useWorldStore` para refrescar en vivo) y "Plan de carga" en la ficha del `FITNESS_COACH` en `StaffView`; `DialoguePayload.source` += `TRAINING | STAFF`.

**Validación:** `tsc --noEmit --skipLibCheck` sin errores · `vite build` OK.

**Pendiente menor:** alerta proactiva de carga antes de partidos (iteración posterior, junto al disparo del ayudante).

### Fase 3 — Carpeta de Refuerzos ✅ IMPLEMENTADA (6 ago 2026)

**Rol nuevo `SPORTING_DIRECTOR`:** `types.ts` (StaffRole) · `worldManager.generateStaffForClub` (atributos con peso en `judgingAbility`/`judgingPotential`/`manManagement`, coaching bajo; también contribuye a la calidad de informes de scouting) · etiquetas `DD`/`Director Deportivo` y delegación de scouting en `StaffView`.

**Lógica:** `compileTransferFolder(club, director)` — candidatos curados (ScoutingReports del club + posición débil con la heurística de la IA), semáforo 🟢🟡🔴 (`value <= presupuesto` · `<= presupuesto + ventas estimadas` · resto), ponderado por `judgingAbility` del director; `sendOffers` (lote con **validación acumulada** contra `transferBudget`, monto = valor de mercado, vía `world.makeTransferOffer`).

**UI:** `TransferFolderTable` (semáforo con razón al hover + checkboxes) + `TransferFolderDialog` (presupuesto dinámico, informe del director con resumen Aprobados/En duda/Rechazados, botón deshabilitado si coste > presupuesto, estado `resultado` con `recordInteraction` + `addInboxMessage` tipo `TRANSFER_FOLDER`).

**Integración:** `DialogueHost` (caso `TRANSFERS`); botones "Carpeta de refuerzos" en `MARKET` y `NEGOTIATIONS`; `DialoguePayload.source` += `MARKET | NEGOTIATIONS`.

**Validación:** `tsc --noEmit --skipLibCheck` sin errores · `vite build` OK.

**Pendiente menor:** disparo proactivo por `isTransferDeadlineDay` / semana previa (iteración posterior).

### Fase 4 — QA, pulido y disparos proactivos (pendiente)
- Accesibilidad (ARIA, teclado: Esc/Tab/Enter/flechas — spec §9), responsive (3 columnas → 2 → 1 — spec §8), animaciones (spec §7), memoización (`React.memo` en `OptionCard`/`LineupPitch`).
- **Disparos proactivos por buzón (§6.1):** alerta de carga del PF (fitness < 70), análisis del rival del ayudante (1×/fixture) y carpeta del DD en `isDeadlineWeek` — requiere nueva categoría de notificación en `notifications.ts` y enlace `relatedId` → `useDialogueStore.open(...)`.

---

## 8bis. 📍 Dónde estamos parados (6 ago 2026)

**Implementado y validado** (`tsc --noEmit --skipLibCheck` + `vite build` OK):

| Fase | Qué | Archivos clave | Puntos de entrada |
|---|---|---|---|
| 1 · Ayudante | Consejo táctico (3 arquetipos ⭐) + anuncio del XI (cancha 2D + banquillo con razones) | `staffAdviceService` (táctica/XI) · `AssistantAdviceDialog` · `LineupPitch` | Tácticas · Previa |
| 2 · Preparador Físico | Carga/riesgo + 3 planes de carga con efectos reales | `generateFitnessReport`/`applyFitnessPlan` · `FitnessCoachDialog` · `FitnessPanel` | Entrenamiento · ficha del PF |
| 3 · Carpeta de Refuerzos | Semáforo 🟢🟡🔴 + informe del DD + envío por lote con validación | `compileTransferFolder`/`sendOffers` · `TransferFolderDialog` · `TransferFolderTable` · rol `SPORTING_DIRECTOR` | Mercado · Centro de Fichajes |

**Base compartida:** `stores/dialogueStore.ts` (máquina de estados) · `components/dialogs/CharacterDialog|SpeechBubble|OptionCard` (UI base) · `components/dialogs/DialogueHost` (host global en `App.tsx`). Efectos registrados con `recordInteraction` + `addInboxMessage` (`TACTICAL_ADVICE`/`FITNESS_PLAN`/`TRANSFER_FOLDER`).

**Pendiente:**
1. Disparos proactivos por buzón (Fase 4, §6.1).
2. Botón de carpeta en la ficha del `SPORTING_DIRECTOR` en `StaffView` (opcional; hoy se abre desde Mercado/Fichajes).
3. QA en navegador de los 3 flujos + accesibilidad/responsive/memoización.

---

## 9. Decisiones tomadas y abiertas

**Resueltas durante la implementación:**

1. ✅ **Rol de Director Deportivo:** se creó `SPORTING_DIRECTOR` (opción recomendada).
2. ✅ **Alcance de la carpeta:** carpeta curada = jugadores con `ScoutingReport` + relleno por posición débil (heurística de la IA).
3. ✅ **Aplicación del preset táctico:** modifica el esquema guardado del usuario (persistente), coherente con cómo el motor lee la táctica. El XI parte del once actual y no sobrescribe sin permiso.

**Abiertas (iteraciones futuras):**

4. **Autopick del XI:** el Paso 2 parte del once **actual** del usuario y solo sugiere; ¿se permite un "Elegir por mí" (llamar a `handleAutoPick`)? Se propone sí, como botón terciario.
5. **Frecuencia del disparo proactivo del ayudante:** 1× por fixture (propuesto) vs. configurable.

---

## 10. Pruebas y QA (adaptado de la spec §12)

| Tipo | Casos |
|---|---|
| Unitarias | `staffAdviceService`: heurística de recomendación con rivales débiles/fuertes; viabilidad 🟢🟡🔴; validación de lote (coste > presupuesto bloquea envío). |
| Componentes | `CharacterDialog`/`OptionCard`/`LineupPitch` renderizan sin errores; estados seleccionada/recomendada; tooltips. |
| Integración | Ayudante paso1→paso2→aplicar (verifica `Tactic.settings` y `tacticalPosition` mutados y persistidos); PF aplica plan (fitness/crecimiento afectados); carpeta envía ofertas que aparecen en `NEGOTIATIONS`. |
| Flujo real | `npm run build` (tsc) + recorrido manual en navegador de las 3 rutas de entrada (botón, buzón, deadline day). |
| Usabilidad | Opciones distinguibles, justificación legible, flujo intuitivo, sin lag (memoización). |

---

## 11. Lo que NO entra en este pilar

- **Scouting rival** (spec §13.5): epic separado.
- Diálogo del `PHYSIO` con parte médico completo (futuro).
- IA para generar textos (spec §13.1: siempre pools predefinidos).
- Editor de datos / otras features pendientes de `MEJORAS.md` (fuera de alcance).

---

*Documento de planificación. Los nombres de API se verificaron contra el código el 6 ago 2026; pueden desactualizarse tras refactors.*
