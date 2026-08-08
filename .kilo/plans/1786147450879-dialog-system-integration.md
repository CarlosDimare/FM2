# Plan — Integración del Sistema General de Diálogos

## Estado actual del códigobase

El repo ya tiene **prototipados los 3 diálogos de staff** (Ayudante, Preparador Físico, Director Deportivo) con:
- `dialogueStore.ts` — state machine para `ASSISTANT | FITNESS | TRANSFERS`
- `DialogueHost.tsx` — mount global único en `App.tsx:1918`
- `CharacterDialog.tsx` — modal centrado con avatar header + body scroll + footer
- `SpeechBubble.tsx` — avatar + burbuja con colita (duplica avatar: **viola spec §3**)
- `OptionCard.tsx` — borde dorado para recomendada (ya alinea con spec §3)
- `dialogueSystem.ts` — motor de resolución con `DialogueResult { text, moraleChange, reactionType }`
- `staffAdviceService.ts` — lógica de fórmulas para tácticas, fitness, transfers
- Triggers actuales: **botones explícitos** en vistas (TacticsView, TrainingView, MarketView, etc.), NO avatares persistentes ni triggers condicionales

## Brechas contra la especificación

| Req spec | Estado | Brecha |
|---|---|---|
| Avatar persistente en esquina | ❌ | No existe; solo header del modal |
| Trigger condicional | ❌ | Solo botones manuales |
| Ubicación contextual | ⚠️ | Los botones están en la vista correcta, pero sin avatar permanente |
| Secuencia: sheet desde abajo | ❌ | `CharacterDialog` es modal centrado (`z-[950]`) |
| Reveal progresivo (150-200ms) | ❌ | Opciones renderizan todas juntas |
| Quick-reply opcional | ❌ | No implementado |
| Cierre con frase | ❌ | `cerrar()` hace desaparecer el modal |
| Flag memoria liviano | ❌ | No existe `siguio_consejo_ultima_vez` |
| Diálogos jugadores (bidir) | ❌ | Solo existe flujo coach→player en `PlayerModal` |
| Personalidad afecta tono | ⚠️ | `DialogueSystem` usa tono fijo (MILD/MODERATE/AGGRESSIVE), NO personalidad del jugador |
| Un solo avatar por interacción | ❌ | `SpeechBubble` repite avatar dentro del body |

## Plan de implementación

### Fase 1 — Refactor del dialog base (común a todos)

**Objetivo:** Preparar el componente base para el nuevo patrón de sheet + reveal progresivo + cierre con frase.

**Tareas:**

1. **Cambiar `CharacterDialog` de modal centrado a bottom sheet**
   - Modificar `components/dialogs/CharacterDialog.tsx`: cambiar `fixed inset-0 flex items-center justify-center` por `fixed inset-x-0 bottom-0 top-auto max-h-[92vh] rounded-t-xl`
   - Backdrop: mantener `bg-black/70 backdrop-blur-sm`
   - Animación: `animate-slide-up` (ya existe en el proyecto) en lugar de `animate-zoom-in`
   - Drag handle visual en el header (barra gris chica arriba)
   - Z-index: mantener `z-[950]`

2. **Eliminar avatar duplicado de `SpeechBubble`**
   - `components/dialogs/SpeechBubble.tsx`: quitar el bloque de `iniciales` + avatar del body; dejar solo la burbuja con colita
   - El avatar ahora vive SOLO en el header de `CharacterDialog`

3. **Agregar cierre con frase a `dialogueStore`**
   - `stores/dialogueStore.ts`: agregar campo `fraseCierre: string | null` y acción `setFraseCierre`
   - Estado nuevo: `cerrando` (entre `resultado` y `cerrado`)
   - Flujo: `resultado → mostrar fraseCierre 1.5s → cerrar`

4. **Implementar reveal progresivo de opciones**
   - Nuevo componente `components/dialogs/ProgressiveOptions.tsx`
   - Props: `opciones`, `delayMs = 180`, `onAllRevealed`
   - Cada opción aparece con `animate-fade-up` + `style={{ animationDelay: `${index * delayMs}ms` }}`
   - Se usa desde `AssistantAdviceDialog`, `FitnessCoachDialog`, `TransferFolderDialog`

5. **Agregar quick-reply a `CharacterDialog`**
   - Nueva prop `quickReplies?: { texto: string; onClick: () => void }[]`
   - Renderiza como pills chicas arriba del body, con `animate-fade-up`
   - Usar en AssistantAdviceDialog para "¿Por qué no la Arriesgada?"

6. **Agregar flag de memoria a Staff**
   - `types.ts` línea ~564: agregar `siguioConsejoUltimaVez?: boolean` a `Staff`
   - Servicio: `worldManager.ts` → método `setStaffMemory(staffId, flag)` y `getStaffMemory(staffId)`
   - Persistir en save/load junto al resto de `worldState`

### Fase 2 — Avatares persistentes + triggers condicionales (staff)

**Objetivo:** Que el Ayudante, PF y Director Deportivo tengan presencia permanente en sus pantallas.

**Tareas:**

7. **Crear componente `components/dialogs/DialogueAvatar.tsx`**
   - Props: `iniciales`, `clubColor`, `cargo`, `badge?: boolean`, `onClick`, `position`
   - Avatar circular chico (36-40px), fixed en esquina
   - Badge pulsante (punto rojo/amarillo con `animate-pulse`) cuando `badge = true`
   - Posiciones predefinidas: `bottom-right` (Tácticas), `bottom-left` (Entreno), `top-right` (Mercado)
   - Z-index: `z-[100]` (debajo de modales, arriba de contenido)

8. **Integrar avatares en vistas**
   - `TacticsView.tsx`: renderizar `<DialogueAvatar position="bottom-right" ...>` cuando `currentView === 'SENIOR_TACTICS'` y trigger de ayudante se cumple
   - `TrainingView.tsx`: mismo para Preparador Físico en `position="bottom-left"`
   - `MarketView.tsx`: mismo para Director Deportivo en `position="top-right"`
   - `StaffView.tsx`: mostrar avatar si el staff seleccionado tiene diálogo activo

9. **Implementar triggers condicionales**
   - Nuevo servicio `services/dialogueTriggers.ts`
   - Funciones puras que reciben `world`, `currentDate`, `userClubId` y retornan `boolean`
   - Triggers:
     - Ayudante: `nextFixture` existe y `daysUntil <= 3` O `opponentChanged`
     - PF: `currentView === 'TRAINING'` y `avgFitness < 75` O `pretemporada` (mes 7-8)
     - Director: `currentView === 'MARKET'` y `transferWindowActive`
   - Cachear resultado por fecha para no recalcular en cada render

10. **Gestionar badge de avatar**
    - El badge se muestra cuando el trigger se cumple Y el jugador NO abrió el diálogo en esa sesión de vista
    - Usar ref en cada vista: `const [avisoMostrado, setAvisoMostrado] = useState(false)`
    - Al abrir diálogo → `setAvisoMostrado(true)` → ocultar badge hasta cambiar de vista

### Fase 3 — Extender diálogos de staff con memoria + cierre

**Objetivo:** Aplicar las mejoras de Fase 1 a los 3 diálogos existentes.

**Tareas:**

11. **Actualizar `AssistantAdviceDialog`**
    - Agregar quick-reply: "¿Por qué no la Arriesgada?" → revela `advice.justificacion` en un `SpeechBubble` adicional
    - Usar `ProgressiveOptions` en lugar de `OptionCard` directo
    - Agregar `fraseCierre` al confirmar: `setFraseCierre("Dale, vamos con Equilibrado. Nos vemos en la cancha.")`
    - Memoria: `siguioConsejoUltimaVez = true` al confirmar; en la próxima apertura, cambiar `textoPrincipal` del pool para referenciar: "La última vez fuiste con Arriesgado y salió bien, ¿repetimos?"

12. **Actualizar `FitnessCoachDialog`**
    - Mismo patrón: reveal progresivo + cierre con frase + memoria

13. **Actualizar `TransferFolderDialog`**
    - Mismo patrón; cierre: "Ofertas enviadas. Ahora toca esperar."

### Fase 4 — Sistema de diálogos con jugadores

**Objetivo:** Implementar la sección 4 de la especificación (diálogos bidir con personalidad).

**Tareas:**

14. **Extender `dialogueStore.ts` para jugadores**
    - Nuevo `DialogKind`: `PLAYER_DIALOG`
    - Payload: `playerId`, `initiatedBy: 'PLAYER' | 'MANAGER'`, `context: string`
    - Estados: `cerrado → abriendo → bubble → opciones → resultado → cerrando → cerrado`
    - Las 3 opciones del manager: `EMPATICO | FIRME | DISTANTE`
    - Efectos en `relacion_jugador` (-1 a +1)

15. **Crear `PlayerDialog.tsx`**
    - Usa `CharacterDialog` como base (ya es genérico)
    - Header: avatar del jugador (foto si existe, si no initials + club color)
    - Bubble de apertura personalizada por `player.personality` + situación real
    - 3 opciones de respuesta con efecto distinto según personalidad
    - Micro-feedback visual al elegir: icono moral ↑/↓ animado

16. **Implementar lógica de personalidad en `DialogueSystem`**
    - Nuevo método: `resolvePlayerInitiatedDialog(player, motive, tone)`
    - Motives: `MINUTES_DISCONTENT`, `CONTRACT_EXPIRING`, `TRANSFER_RUMOR`, `DRESSING_ROOM_CONFLICT`
    - Misma situación + diferente personalidad → texto y efecto distintos:
      - `VOLATILE` → tono urgente, badge parpadeante, ignorar baja moral rápido
      - `LEADER` → tono calmo, puede ofrecer mediar
      - `LAZY` → rara vez inicia; si lo hace, es por contrato
    - Usar pools de texto existentes en `dialogueSystem.ts` + agregar variantes por personalidad

17. **Agregar badge de diálogo en `SquadView` y `PlayerModal`**
    - `SquadView.tsx`: badge rojo chico sobre el retrato del jugador cuando tiene diálogo pendiente
    - `PlayerModal.tsx`: pestaña INTERACTION ya existe; integrar el nuevo flujo bidir allí
    - `InboxView.tsx`: entrada resumen "Delantero quiere hablar contigo" cuando jugador inicia

18. **Implementar triggers de jugador → manager**
    - Servicio: `services/playerDialogueTriggers.ts`
    - Condiciones:
      - `minutesLastNMatches < threshold` y `personality !== 'LAZY'`
      - `contractExpiry < 6 meses` y `personality !== 'LOYAL'`
      - `transferRequestReason` existe
      - `playerTensions[capitanId] > 60`
    - Al cumplirse: agregar a `player.pendingDialogue` y mostrar badge + inbox

19. **Implementar triggers de manager → jugador**
    - `charlaPrePartido`: `currentView === 'PRE_MATCH'` → "motivación/rol"
    - `felicitacionHito`: `player.careerStats.totalGoals === 100` o `MVP` post-partido
    - `llamadoAtencion`: post-tarjeta roja o `formRatings` último < 4
    - `renovacionContrato`: `contractExpiry < 12 meses`

### Fase 5 — Integración final y limpieza

**Tareas:**

20. **Actualizar `DialogueHost.tsx`**
    - Renderizar avatares persistentes debajo del dialog activo
    - O manejar avatares desde vistas individuales (ver decisión abajo)

21. **Actualizar `App.tsx`**
    - Asegurar que `DialogueHost` reciba `onStartMatch` para assistant
    - Verificar que avatares persistentes no se superpongan en móvil

22. **Persistencia**
    - Agregar `staffMemory`, `playerRelationships`, `pendingPlayerDialogues` a `worldState` en save/load
    - Migración: si faltan campos en saves viejos, inicializar como `{}`

23. **Limpieza**
    - Eliminar código muerto de diálogos legacy si existe
    - Unificar nombres: `siguioConsejoUltimaVez` → `staffMemory[staffId].lastAdviceFollowed`
    - Verificar que no queden avatares duplicados en ningún componente

## Decisiones de diseño pendientes

| # | Decisión | Recomendación |
|---|---|---|
| D1 | ¿Avatares persistentes se renderizan en cada vista o en overlay global? | **En cada vista**: es más simple, evita overlays complejos, y la especificación dice "vive físicamente en la pantalla". Cada vista (`TacticsView`, `TrainingView`, `MarketView`) renderiza su propio `<DialogueAvatar>` condicionalmente. |
| D2 | ¿`CharacterDialog` debe ser solo bottom sheet o mantener compatibilidad con modal centrado? | **Solo bottom sheet**: la especificación es explícita ("sheet se desliza desde abajo"). Los diálogos actuales son modales grandes; el cambio a bottom sheet mejora la UX en móvil y alinea con el patrón. |
| D3 | ¿Nuevo store para jugadores o extender `dialogueStore`? | **Extender `dialogueStore`**: agragar `PLAYER_DIALOG` a `DialogKind`. El state machine actual es suficientemente genérico. |
| D4 | ¿Dónde se inicializa el texto de apertura del diálogo de jugador? | **En `dialogueSystem.ts`**: método nuevo `resolvePlayerInitiatedDialog` que arma el bubble inicial combinando `motive` + `personality` + contexto real (minutos, contrato, etc.). |
| D5 | ¿Los quick-replies son hardcodeados por diálogo o configurables? | **Hardcodeados por tipo de diálogo**: cada staff dialog define sus propios quick-replies (ej. Assistant: "¿Por qué no la Arriesgada?", PF: "¿Qué jugadores están en riesgo?"). |

## Riesgos

1. **Cambio de CharacterDialog a bottom sheet rompe otros modales que lo usan**: Verificar que solo lo usen los 3 dialogs de staff + PlayerDialog nuevo. Si hay otros usos, crear `BottomSheetDialog` nuevo y dejar `CharacterDialog` como fallback.
2. **Reveal progresivo con animationDelay puede ser frágil en SSR/hidratación**: Usar `useLayoutEffect` + state local para controlar la aparición, no solo CSS delay.
3. **Triggers en vistas pueden causar renders repetitivos**: Cachear resultados de `dialogueTriggers` con `useMemo` por `currentDate + currentView`.
4. **Personalidad del jugador no existe en todos los jugadores generados**: Verificar `playerGenerator.ts`; si `personality` es opcional, asignar default `'PROFESSIONAL'` en el trigger.

## Validación

1. **Visual**: Abrir cada diálogo de staff y verificar que:
   - El sheet entra desde abajo con animación
   - Las opciones aparecen una por una con ~180ms delay
   - El avatar solo aparece en el header (no en burbujas)
   - Al confirmar, aparece frase de cierre y luego el sheet se cierra
2. **Trigger**: Cambiar de táctica/entreno/mercado y verificar que el avatar aparece con badge; avanzar fecha y verificar que desaparece si la condición ya no se cumple.
3. **Memoria**: Confirmar consejo de ayudante, cerrar, volver a abrir → debe mencionar la decisión anterior.
4. **Jugadores**: Forzar un `transferRequestReason` en un jugador `VOLATILE` y en uno `LEADER`; abrir diálogo desde inbox; verificar que el tono y efectos son distintos.
5. **Persistencia**: Guardar partida, recargar, verificar que `staffMemory` y `relacion_jugador` se mantienen.
6. **Mobile**: Verificar en viewport 390px que avatares persistentes no tapan botones y que el bottom sheet se ve completo.

## Orden de ejecución sugerido

1. Fase 1, tarea 1 (CharacterDialog → bottom sheet) — **bloquea** Fase 1 tareas 2-5 y Fase 3
2. Fase 1, tarea 2 (SpeechBubble sin avatar) — rápido, ~5 min
3. Fase 1, tarea 3 (cierre con frase en store) — rápido
4. Fase 1, tarea 4 (ProgressiveOptions) — ~20 min
5. Fase 1, tarea 5 (quick-reply) — ~15 min
6. Fase 1, tarea 6 (flag memoria en Staff) — ~10 min
7. Fase 2, tareas 7-10 (avatares + triggers) — ~1-2h
8. Fase 3, tareas 11-13 (mejorar dialogs existentes) — ~1h
9. Fase 4, tareas 14-19 (jugadores) — ~2-3h
10. Fase 5, tareas 20-23 (integración + limpieza) — ~1h

**Total estimado:** ~6-8h de implementación enfocada.
