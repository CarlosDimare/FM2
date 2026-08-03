# Pilar C: Personalidades y Drama

## Estado: ✅ COMPLETADO

### C1 - Personalidad de Jugador
- `PlayerPersonality`: LEADER, MERCENARY, LOYAL, VOLATILE, PROFESSIONAL, LAZY, AMBITIOUS
- Asignación basada en atributos: leadership, loyalty, agresividad, decision, vision, consistency
- Visible en PlayerModal → pestaña Personalidad + efectos en morale/motivation
- `PlayerPersonalityLabels` con descripciones en español

### C2 - Conflictos de Vestuario
- `resolveDressingRoomConflicts()`: detecta personalidades opuestas (LEADER vs VOLATILE, MERCENARY vs LOYAL)
- Tensión acumulativa entre jugadores conflictivos
- El capitán puede mediar/resolver según su leadership
- Notificaciones inbox + eventos de prensa cuando hay conflicto grave

### C3 - Pedidos de Traspaso Narrativos
- `checkTransferRequestMotives()`: razones contextuales
  - "Quiero jugar Champions League"
  - "No me llevo bien con el cuerpo técnico"
  - "Mi familia quiere volver a [país]"
  - "Necesito más minutos"
  - "El club no iguala mi ambición"
- Cada personalidad prefiere ciertos motivos
- Inbox + opción de prometer/ignorar

### C4 - Eventos Narrativos Aleatorios
- `generateNarrativeEvents()`: eventos diarios (baja probabilidad)
  - Juvenil pide el dorsal de una estrella
  - Dos cracks discuten quién tira un penal
  - La prensa filtra tensión en el vestuario
  - Veterano mentoriza a juvenil (positivo)
- Consecuencias: morale, teamCohesion, mediaNews
- Integrado en el ciclo diario de advanceTime
