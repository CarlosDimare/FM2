# Arquitectura Final de Navegación — Fútbol Manager Mobile

## Principio rector

Tres capas por **profundidad de navegación real** (qué toca el pulgar, en qué orden), y dentro de cada pantalla, una **identidad visual propia** (icono + fondo temático + color) que le da personalidad sin romper la jerarquía. Cada pantalla tiene un único hogar canónico — no hay duplicados repartidos en varios padres.

---

## CAPA 1 — Núcleo (Bottom Nav fijo, mobile)

5 slots fijos + "Más". Nada de Capa 1 es una acción final: todo es puerta de entrada.

| Slot | Pantalla | Icono | Fondo temático | Color base |
|------|----------|-------|-----------------|------------|
| 1 | **Inicio** | 🏠 Casa / balón pequeño en la esquina | Estadio visto desde el palco, luz de atardecer, borroso de fondo | Ámbar cálido `#D97706` |
| 2 | **Plantel** | 👕 Camiseta numerada | Textura de césped recién cortado, líneas blancas de cancha | Verde césped `#16A34A` |
| 3 | **Táctica** | 📋 Pizarra táctica con flechas | Pizarra táctica real (fondo verde oscuro tipo vestuario) | Verde pizarra `#065F46` |
| 4 | **Partido** | ⚽ Balón de fútbol | Estadio de noche, focos encendidos, grada iluminada | Rojo estadio `#B91C1C` |
| 5 | **Más** | ⋯ Tres puntos | Neutro (no lleva fondo ilustrado, es un contenedor) | Gris `#6B7280` |

**Nota sobre Selección:** no ocupa slot fijo. Si el modo de carrera activo incluye selección nacional, aparece como primer ítem destacado dentro de "Más" (con badge 🚩); si el modo es solo-club, no aparece en absoluto. Mercado y Competiciones tampoco ocupan slot fijo — van dentro de "Más" como los ítems de mayor jerarquía ahí (ver Capa 2).

### Estructura visual — Inicio (HOME)

Es la única pantalla de Capa 1 con contenido propio (dashboard), el resto son gateways puros.

```
┌──────────────────────────────────────┐
│  🌅 fondo: estadio al atardecer,      │
│     borroso, con overlay oscuro 40%   │
│                                        │
│  📅 Dom 16 Ago 2008                   │
│  ⏰ Próximo partido: 2 días            │
│     ⚽ River Plate — vs               │
│                                        │
│  🔴 3 alertas sin leer                │
│  💰 Oferta por delantero — €25M       │
│  🏥 Lesión leve — mediocampista       │
│  📰 "Directiva pide resultados"       │
│                                        │
│  [⏭ Avanzar día]  [▶ Ver partido]     │
└──────────────────────────────────────┘
```
Tipografía: título en negrita condensada (estilo cartel deportivo), cuerpo en sans-serif neutra para legibilidad de datos.

---

## CAPA 2 — Departamentos (dentro de "Más" + submenús de cada tab fijo)

Cada departamento tiene icono, fondo y color propio. Se accede tocando "Más" (sheet deslizable) o tocando un tab fijo de Capa 1 que despliega sus propios hijos (ej. Plantel → Primer equipo/Reserva/Sub-20).

### Hijos directos de los tabs fijos

| Padre (Capa 1) | Sub-pantalla | Icono | Fondo | Color |
|---|---|---|---|---|
| Plantel | Primer equipo | 👕 | Vestuario, camisetas colgadas | Verde `#16A34A` |
| Plantel | Reserva | 👕 (gris) | Vestuario más pequeño, luz fría | Verde apagado `#4D7C0F` |
| Plantel | Sub-20 | 🌱 Brote | Campo de entrenamiento juvenil | Verde lima `#65A30D` |
| Táctica | Formación (Senior/Reserva/Sub-20) | 📋 | Pizarra con fichas magnéticas | Verde pizarra `#065F46` |
| Partido | Pre-partido | 🧢 Gorra de entrenador | Túnel de vestuarios, jugadores saliendo | Rojo apagado `#991B1B` |
| Partido | Conferencia de prensa (pre/post) | 🎤 Micrófono | Sala de prensa, fondo con logos de patrocinadores, flashes de cámara | Azul noche `#1E3A8A` |
| Partido | Partido en vivo | ⚽ | Campo desde cámara de TV, luces de estadio | Rojo estadio `#B91C1C` |

### Departamentos dentro de "Más"

| Departamento | Pantallas que agrupa | Icono | Fondo | Color |
|---|---|---|---|---|
| **Mercado** 💰 | Mercado, Buscador, Negociaciones, Lista de clubes | 💰 Billete/moneda | Oficina de fichajes, contratos sobre un escritorio | Dorado `#CA8A04` |
| **Competiciones** 🏆 | Hub de torneo, Ranking de ligas, Tabla, Informe de club | 🏆 Copa | Trofeo iluminado sobre pedestal, confeti sutil de fondo | Púrpura `#7C3AED` |
| **Selección** 🚩 *(condicional)* | Plantel/Táctica/Calendario/Estadísticas de selección | 🚩 Bandera abstracta | Estadio internacional, bandera ondeando desenfocada | Teal `#0D9488` |
| **Scouting** 🔍 | Informes, Lista de seguimiento | 🔍 Binoculares | Grada vacía de un estadio de cantera, luz de mañana | Cian `#0891B2` |
| **Prensa** 📰 | Buzón, Medios, Crónicas | 📰 Periódico | Textura de papel de diario, tipografía de titular | Gris cálido `#78716C` |
| **Gestión** 📊 | Economía, Staff, Entrenamiento, Directiva | 📊 Carpeta/gráfico | Oficina de directiva, sala de juntas | Slate `#334155` |
| **Perfil** 👤 | Perfil del manager, Ranking, Salón de la fama | 🏅 Medalla | Pared de trofeos y fotos enmarcadas | Bronce `#92400E` |

**Regla anti-duplicación:** cada pantalla vive en un único departamento. Si otra sección necesita acceso rápido (ej. Home muestra un preview de Mercado), es un **link cruzado** (mismo destino, no una copia del árbol).

### Estructura visual — "Más" (sheet)

```
┌──────────────────────────────────────┐
│  ⋯ MÁS                                │
│  ─────────────────────────────────    │
│  💰 Mercado          🏆 Competiciones │
│  🚩 Selección        🔍 Scouting      │
│  📰 Prensa           📊 Gestión       │
│  🏅 Perfil                            │
└──────────────────────────────────────┘
```
Grid 2 columnas, cada tile con su color de fondo tenue (10% opacidad) + icono grande + texto corto debajo.

---

## CAPA 3 — Detalle (modales y vistas granulares)

Se abren desde Capa 2, nunca desde Capa 1 directamente (salvo notificaciones, ver más abajo). ESC / back siempre vuelve al padre de Capa 2.

| Pantalla | Icono | Fondo | Color |
|---|---|---|---|
| Ficha de jugador | 🧑 Silueta con dorsal | Túnel de vestuario, luz de foco sobre el jugador | Según departamento padre |
| Comparar jugadores | ⚖️ Balanza | Split screen con dos siluetas enfrentadas | Neutro `#374151` |
| Oferta de traspaso | 🤝 Apretón de manos | Escritorio con contrato y bolígrafo | Dorado `#CA8A04` |
| Negociación de contrato | ✍️ Pluma firmando | Oficina de agente, luz de flexo | Dorado apagado `#A16207` |
| Resumen de temporada | 🏆 Copa con confeti | Vestuario celebrando o vacío según resultado | Púrpura `#7C3AED` |
| Configuración | ⚙️ Engranaje | Neutro liso | Gris `#6B7280` |
| Vacaciones | 🏖️ Sombrilla | Neutro liso, tono relajado | Celeste `#38BDF8` |
| Guardar/Cargar | 💾 Disquete/Carpeta | Neutro liso | Gris `#6B7280` |
| Club externo | 🏟️ Escudo genérico | Estadio rival, colores del club visitado | Según club |

---

## Flujo de partido (secuencia lineal, no es "navegación libre")

```
Táctica → Pre-partido 🧢 → Conferencia pre 🎤 → Partido en vivo ⚽ → Conferencia post 🎤 → Crónica 📖
```
Cada paso reemplaza al anterior en pantalla completa (no hay back a mitad de partido salvo pausa). El fondo cambia de escena en cada paso para reforzar que es un viaje, no un menú: túnel → sala de prensa con flashes → campo de noche → sala de prensa con ánimo distinto (ganador/derrotado) → página de diario.

---

## Deep-linking (excepción a la jerarquía)

Notificaciones push y alertas del centro de notificaciones **saltan directo a Capa 3** (ej. tocar "Oferta por tu delantero" abre `TransferOfferModal` directo), sin pasar por Mercado primero. El botón "atrás" desde ahí lleva al departamento correspondiente (Mercado), no a Home — para no perder al usuario.

---

## Sistema visual global (para que todo se sienta una sola app)

- **Regla de icono:** cada botón = 1 icono + texto corto debajo (nunca icono solo en tiles principales; texto solo en breadcrumbs).
- **Regla de fondo:** los fondos temáticos siempre llevan overlay oscuro 30-40% para que el texto/UI encima sea legible — nunca fondo a máxima saturación detrás de texto.
- **Paleta:** cada departamento tiene un color ancla (tabla arriba); Capa 1 usa colores más saturados (acción), Capa 3 usa versiones más apagadas del color del padre (detalle/calma), salvo Partido y Conferencia de prensa que mantienen intensidad por ser momentos de tensión.
- **Tipografía:** títulos de pantalla en fuente condensada/bold (estilo marcador de estadio); cuerpo y datos en sans-serif neutra de alta legibilidad (nunca decorativa en tablas de stats).
- **Consistencia de iconografía:** usar un solo set de iconos (ej. Lucide o Phosphor) en dos pesos — outline para Capa 2, filled para el estado activo/seleccionado — para que el usuario reconozca en qué capa está por el estilo del icono, no solo por el color.

---

## Resumen de implementación

1. Bottom nav fijo (5 slots) + sheet "Más" con los 7 departamentos.
2. Fondos temáticos por pantalla (empezar por Home, Partido, Conferencia de prensa — son los de mayor impacto emocional).
3. Paleta y set de iconos único aplicado a toda la app.
4. Flujo de partido como secuencia de pantalla completa, no como navegación libre.
5. Deep-linking desde notificaciones directo a Capa 3.