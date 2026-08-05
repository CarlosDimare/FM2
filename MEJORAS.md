# FM — Estado del Proyecto

## ✅ Los 3 Pilares Completados

### 🟢 Pilar A: Mundo Vivo (Reputación Dinámica de Ligas)
- `dynamicReputation` en `Competition`: 0-100, fluctúa cada temporada según calidad de clubes (50%), CA promedio (30%), performance continental (20%)
- `marketMultiplier`: 0.5-2.0. Liga ELITE (80+)=×2.0, LOCAL (<20)=×0.5. Afecta `recalculatePlayerValue()`
- Talent migration: 8% diario — jóvenes U23 con PA>150 en ligas bajas reciben ofertas de ligas ≥10 pts más de reputación
- Noticias económicas al final de temporada: top 3 ligas + mayores cambios en inbox
- UI: vista `LEAGUE_RANKING` en sidebar (📊) — tabla de las 41 ligas ordenadas por reputación, tier, prize pool
- `getLeagueTier()`: ELITE / PRESTIGE / DEVELOPING / EMERGING / LOCAL
- `getBaseLeagueRep()`: reputaciones base por liga (Premier 92, La Liga 90, Serie A 85, etc.)

### 🟡 Pilar B: Legado (Salón de la Fama + Récords Históricos)
- `HallOfFameEntry`: top 50 DTs por win-rate y títulos, inducidos al ≥60%. Evaluación al final de cada temporada
- `HallOfFameView`: UI con medallas 🥇🥈🥉, PJ, G, %, títulos, clubes
- `Player.careerStats`: `totalApps`, `totalGoals`, `totalAssists`, `totalCleanSheets`, `clubsPlayedFor` — acumulativos de por vida
- `ClubRecords.allTimeTopScorer` + `allTimeMostApps`: máximos goleadores y jugadores con más partidos en la historia del club
- Visible en PlayerModal (pestaña Historial → "Carrera") y ClubReport (Récords Históricos)

### 🏆 Libro de Temporadas (Historial entre temporadas)
- `SeasonRecord` por temporada completada: año, DT, club del usuario, campeones por competición (con goleador y asistente), tablas finales top 6 de todas las ligas
- `SeasonHistoryView`: vista consultable con selector de años, tarjetas de campeones y tablas finales
- Acceso desde Sidebar (📗 "Libro de Temporadas") y BottomNav "Más" (móvil)
- Persistido en saves (con migración segura para partidas viejas) · límite de 40 temporadas

### ⚽ Zonas de Tabla Dinámicas por Liga
- Las zonas de la tabla ya no están hardcodeadas para Argentina: se calculan según confederación y tier de cada competición
- CONMEBOL: 5 Libertadores + 5 Sudamericana · UEFA: 4 UCL + 2 UEL · AFC/CONCACAF/CAF: cupos continentales propios
- Descenso proporcional al tamaño de la liga (~12%), ascenso para 2ª división

### 🎯 IA de Partido Mejorada
- `autoSubstitute` con conciencia de marcador: persiguiendo → prioriza atacantes (refresco ofensivo tras el 60'); protegiendo ventaja → prioriza defensa/mediocentros (cierre tras el 75')
- Hasta 2 cambios por ventana cuando hay cambio táctico + natural
- Mensajes de sustitución contextuales ("por ir a buscar el partido" / "para asegurar la ventaja")
- Ajustes tácticos dinámicos por resultado y rival (ya existentes, consolidados)

### 🎭 Pilar C: Personalidades y Drama
- **7 personalidades de jugador** (`PlayerPersonality`): LEADER, MERCENARY, LOYAL, VOLATILE, PROFESSIONAL, LAZY, AMBITIOUS
- Asignación según atributos: leadership, loyalty, agresividad, decision, vision
- **Conflictos de vestuario**: detección diaria de pares conflictivos (LEADER vs VOLATILE, etc.), tensión acumulativa, mediación del capitán (leadership ≥15), filtración a prensa si tensión ≥80
- **Pedidos de traspaso narrativos**: 3% diario, motivos contextuales por personalidad (AMBITIOUS quiere Champions, MERCENARY más dinero, LOYAL familia, VOLATILE odia al DT...)
- Nuevo diálogo `CONVINCE_TO_STAY`: intentar convencer al jugador de que retire su pedido
- **10+ eventos narrativos**: juvenil pide dorsal, pelea por penal, veterano mentor (+1 CA), lesión en entrenamiento, romance mediático, conflicto con directiva, fiesta nocturna filtrada, apuesta entre jugadores, prensa amplifica fricción
- **Personalidad afecta rendimiento en partido**: VOLATILE depende de moral (0.88-1.12×), LAZY rinde -7% (extra -5% los lunes), PROFESSIONAL +4% consistente, LEADER +3% + aura al equipo (+2 moral a compañeros), MERCENARY +5% en partidos grandes, AMBITIOUS +2%
- `PlayerModal` actualizado con etiqueta de personalidad + descripción completa

---

## 🔵 Completado (histórico)

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
- Pase inteligente (peso por proximidad, focusPassing, usePlaymaker, targetMan)
- Distribución GK (short/long/clearance), saque de banda (THROW_IN)
- Gol + momentum (cambio moral), tácticas activadas (defensiveLine, timeWasting, longShots)
- Marcación hombre vs zona, target man, pases filtrados, centro, fuera de juego, penales
- Rating mejorado (clean sheet, pass completion, bonus posición), ventaja local (+0.15 rating)
- Quick sim mejorado (forma + tácticas + habilidad), auto-sub por lesión, big match temperament
- Multiplicador de personalidad en `getEffectiveAttribute` y `getQuickAttr`

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
- Carrera modo CLUB / NATIONAL / BOTH

### Scouting
- Vista con CA/PA, fortalezas, debilidades, personalidad
- Buscador por nombre y solicitar informe
- Filtros por posición, edad, CA mínimo
- Lista de seguimiento (bookmark)

### Inteligencia Artificial
- Compra en posiciones débiles (mínimos: 2 GK, 5 DEF, 4 MID, 2 FWD)
- Venta de excedentes
- Ofertas: aceptación/rechazo/contraoferta según valor/precio + reputación
- Renovación automática / liberación
- Cross-league transfers (20% entre ligas DEEP)
- Deadline Day expandido a todas las ligas DEEP

### Plantilla (Squad)
- `formRatings[]` con puntos de color
- Ordenamiento: posición, nombre, edad, tendencia, salario, física, moral, valor
- Iconos de estado: lesión, suspensión, transferible, contrato
- Barra sub-21 (progreso minutos)

### Cantera y Desarrollo
- Hornada anual el 1 de agosto
- Regiones de captación
- Curvas de desarrollo: 6 fases
- Promoción automática y liberación

### Crónicas Automatizadas
- Crónica de partido, mensual, de carrera
- `ChronicleView` con filtros

### Ficha de Entrenador (Manager Profile)
- Actualización tras cada partido y temporada
- `ManagerProfileView` con stats, títulos, relaciones, historial

### Staff / Empleados
- Perfil con biografía, perfil táctico, reputación, palmarés
- Delegación de 6 tareas

### Tácticas
- Fichas en el campo con dorsales estilo FM08
- Modal "ELEGIR 11" responsive

### Directiva (Board)
- BoardView con confianza, saldo, presupuesto
- Mejora de instalaciones
- `evaluateBoardConfidence`

### Prensa y Medios
- `MediaView` con portada de periódico
- Tipos: HEADLINE, FEATURE, RUMOR, CRITICISM, PRAISE
- `PeopleHub`: pestañas PRENSA + RED DE DT

### UI/UX
- Tema oscuro, Onboarding 8 pasos, Responsive, Teclas rápidas
- Auto-save, Notificaciones push, Múltiples slots IndexedDB
- FM Steel-Gray homogeneizado

### Open‑Football‑Database
- 54,645 jugadores reales, 570 clubes, 35+ ligas en 30+ países
- 41 ligas totales (35 DB + 6 manuales)

---

## 📊 Total acumulado

| Métrica | Valor |
|---|---|
| Ligas | 41 (CONMEBOL 7, UEFA 21, CONCACAF 3, AFC 5, CAF 3, OFC 1) |
| Clubes | ~618 |
| Jugadores | ~55,000 |
| Personalidades | 7 tipos con efectos en partido |
| Eventos narrativos | 10+ tipos |
| Competiciones | Ligas + Copas domésticas + Continentales + Mundiales |

---

## ⚠️ Próximos pasos

- Editor de datos (clubes, jugadores, competiciones)
- Reuniones de directiva más profundas (objetivos de temporada editables)
- Gráfico de evolución financiera (hoy es tabla)


---

*Última actualización: 5 agosto 2026*
