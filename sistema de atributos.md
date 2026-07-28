Aquí tienes un archivo `sistemadeatributos.md` listo para entregar a un agente o asistente de IA. Explica el sistema de atributos, etiquetas y lógica de generación de forma clara y accionable.

---

# SISTEMA DE ATRIBUTOS Y ETIQUETAS PARA SIMULADOR DE FÚTBOL

---

## 1. OBJETIVO DEL SISTEMA

Este documento define el sistema de atributos de jugadores para un simulador de fútbol realista. El sistema está diseñado para:

- **Simular fútbol con credibilidad táctica** (no arcade).
- **Generar jugadores únicos y reconocibles** (no clones).
- **Mantener una interfaz limpia para móvil** (solo 5 atributos visibles).
- **Permitir estadísticas variadas y realistas** por posición.

**Principio rector:** _"Primero la posición, luego el atributo"_. Un delantero remata aunque tenga 5 de remate; un central remata poco aunque tenga 15.

---

## 2. ARQUITECTURA DE ATRIBUTOS (TRES CAPAS)

| Capa             | Atributos | Escala   | Visibilidad | Función             |
| ---------------- | --------- | -------- | ----------- | ------------------- |
| **Internos**     | 13        | 1-20     | Oculta      | Motor de simulación |
| **Visibles**     | 5         | 1-20     | Visible     | Interfaz de usuario |
| **Contextuales** | 6         | Variable | Visible     | Estado dinámico     |

---

## 3. ATRIBUTOS INTERNOS (MOTOR) — 13

Estos atributos son los que usa el motor de partido. El usuario **no los ve directamente**, pero el motor los utiliza para calcular todas las acciones.

| #   | Atributo        | Escala | Definición operativa                                                                                           |
| --- | --------------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| 1   | Velocidad       | 1-20   | Ritmo y aceleración en carrera. Afecta a regates, contragolpes y desmarques.                                   |
| 2   | Resistencia     | 1-20   | Capacidad de mantener el nivel físico durante 90'. Afecta al % físico, lesiones y rendimiento en tramo final.  |
| 3   | Fuerza          | 1-20   | Potencia en contacto, juego aéreo y protección de balón. Afecta a duelos, remates de cabeza y entradas.        |
| 4   | Control         | 1-20   | Primer toque, recepción y orientación. Afecta a la recepción de balones difíciles y mantenimiento de posesión. |
| 5   | Pase            | 1-20   | Precisión en pase corto, largo y en profundidad. Afecta a asistencias, pases clave y posesión.                 |
| 6   | Regate          | 1-20   | Capacidad de desborde en 1vs1. Afecta a desequilibrio, faltas a favor y ocasiones generadas.                   |
| 7   | Disparo         | 1-20   | Precisión de tiro a puerta con ambas piernas. Afecta a goles, tiros a puerta y ocasiones falladas.             |
| 8   | Anticipación    | 1-20   | Lectura de jugada e interceptación de pases. Afecta a robos, despejes y posicionamiento defensivo.             |
| 9   | Decisión        | 1-20   | Toma de decisiones bajo presión. Afecta a la elección del mejor pase, tiro o regate en cada situación.         |
| 10  | Posicionamiento | 1-20   | Colocación en el campo (ofensiva y defensiva). Afecta a ocupar espacios, recibir balones y cubrir líneas.      |
| 11  | Visión          | 1-20   | Capacidad de ver y ejecutar pases inesperados. Afecta a pases clave, asistencias y cambios de juego.           |
| 12  | Agresividad     | 1-20   | Intensidad en presión y dureza en entradas. Afecta a faltas, tarjetas, duelos ganados y lesiones.              |
| 13  | Polivalencia    | 1-20   | Capacidad de jugar en varias posiciones sin perder nivel. Afecta a adaptación a cambios y cobertura de bajas.  |

---

## 4. ATRIBUTOS VISIBLES (USUARIO) — 5

Estos son los que ve el usuario en la ficha del jugador. Son **promedios ponderados** de los internos.

| #   | Atributo     | Escala | Fórmula de cálculo                                              | Definición para el usuario                             |
| --- | ------------ | ------ | --------------------------------------------------------------- | ------------------------------------------------------ |
| 1   | Físico       | 1-20   | (Velocidad + Resistencia + Fuerza) / 3 + ajuste por peso/altura | Capacidad atlética: ritmo, aguante y potencia.         |
| 2   | Mental       | 1-20   | (Anticipación + Decisión + Posicionamiento + Visión) / 4        | Inteligencia de juego: lectura, elección y colocación. |
| 3   | Técnica      | 1-20   | (Control + Pase + Regate + Disparo) / 4                         | Calidad con el balón: toque, precisión y desborde.     |
| 4   | Agresividad  | 1-20   | Agresividad (directo)                                           | Intensidad defensiva y riesgo de faltas y tarjetas.    |
| 5   | Polivalencia | 1-20   | Polivalencia (directo)                                          | Capacidad de jugar en distintas posiciones.            |

---

## 5. ATRIBUTOS CONTEXTUALES (DINÁMICOS) — 6

Estos atributos cambian durante la partida y la temporada. No son fijos.

| #   | Atributo     | Rango                     | Definición                             | Cómo cambia                                                                                                       |
| --- | ------------ | ------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | Edad         | 16-40                     | Años del jugador.                      | Sube cada temporada.                                                                                              |
| 2   | Altura       | 1.60 - 2.00 m             | Estatura en metros.                    | Fijo (no cambia).                                                                                                 |
| 3   | Peso         | 60 - 95 kg                | Peso en kilogramos.                    | Cambia lentamente con la edad y el entrenamiento (pasivo).                                                        |
| 4   | Forma Física | 70-100%                   | Estado de fatiga o lesión.             | Baja durante el partido y con lesiones; sube entre partidos.                                                      |
| 5   | Moral        | 😤 / 😟 / 😌 / 😄         | Estado anímico del jugador.            | Afecta a todos los atributos internos en ±10%. Sube o baja según resultados, minutos y decisiones del entrenador. |
| 6   | Lesión       | Sí / No (tipo y duración) | Si está lesionado y por cuánto tiempo. | Se genera aleatoriamente o por sobrecarga.                                                                        |

---

## 6. ETIQUETAS GENERADAS

El sistema asigna una **etiqueta de perfil** a cada jugador según la combinación de sus atributos visibles. Esto ayuda al usuario a identificar rápidamente el estilo de un jugador.

### Tabla de etiquetas

| **Combinación de atributos visibles**       | **Etiqueta**           | **Ejemplo real**            |
| ------------------------------------------- | ---------------------- | --------------------------- |
| Físico ≥ 16, Mental ≥ 16, Técnica ≥ 16      | _"Superclase"_         | Messi, Mbappé               |
| Mental ≥ 17, Técnica ≥ 15                   | _"Cerebral"_           | Busquets, Modric            |
| Físico ≥ 16, Agresividad ≥ 16               | _"Tanque"_             | Ramos, Casemiro             |
| Físico ≥ 17, Técnica ≥ 15                   | _"Explosivo"_          | Vinicius, Dembélé           |
| Técnica ≥ 16, Mental ≥ 14                   | _"Técnico"_            | Pedri, Foden                |
| Físico ≥ 14, Mental ≥ 14, Polivalencia ≥ 14 | _"Comodín"_            | Cancelo, Kimmich            |
| Físico ≥ 15, Agresividad ≥ 14               | _"Atleta"_             | Adama Traoré, Davies        |
| Mental ≥ 15, Agresividad ≥ 12               | _"Inteligente"_        | Kroos, Thiago               |
| Edad ≤ 21, todos los atributos ≤ 12         | _"Joven promesa"_      | Canterano                   |
| Edad ≥ 32, Mental ≥ 15                      | _"Veterano"_           | Modric, Lewandowski         |
| Todos los atributos ≤ 10, Edad ≥ 25         | _"Fichaje de relleno"_ | Jugador de fondo de armario |

---

## 7. GENERACIÓN DE JUGADORES

### 7.1 Asignación de posición

Cada jugador tiene una **posición principal**:

| Posición    | Abreviatura |
| ----------- | ----------- |
| Portero     | POR         |
| Central     | DEF         |
| Lateral     | LAT         |
| Pivote      | PIV         |
| Mediocentro | MC          |
| Extremo     | EXT         |
| Delantero   | DEL         |

### 7.2 Generación de atributos internos (1-20)

**Método:** Distribución normal con media según posición, con un margen de variación de ±3 puntos para generar unicidad.

**Rangos por posición:**

| Atributo        | POR   | DEF   | LAT   | PIV   | MC    | EXT   | DEL   |
| --------------- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Velocidad       | 10-14 | 12-16 | 14-18 | 12-16 | 12-16 | 16-20 | 14-18 |
| Resistencia     | 12-16 | 14-18 | 14-18 | 14-18 | 14-18 | 14-18 | 14-18 |
| Fuerza          | 14-18 | 16-20 | 12-16 | 14-18 | 12-16 | 10-14 | 14-18 |
| Control         | 12-16 | 10-14 | 12-16 | 14-18 | 14-18 | 16-20 | 14-18 |
| Pase            | 10-14 | 12-16 | 14-18 | 14-18 | 16-20 | 12-16 | 12-16 |
| Regate          | 6-10  | 8-12  | 12-16 | 8-12  | 12-16 | 16-20 | 14-18 |
| Disparo         | 6-10  | 8-12  | 8-12  | 10-14 | 12-16 | 14-18 | 16-20 |
| Anticipación    | 14-18 | 16-20 | 14-18 | 14-18 | 12-16 | 10-14 | 10-14 |
| Decisión        | 12-16 | 14-18 | 12-16 | 14-18 | 16-20 | 12-16 | 14-18 |
| Posicionamiento | 14-18 | 16-20 | 14-18 | 14-18 | 14-18 | 14-18 | 16-20 |
| Visión          | 8-12  | 10-14 | 12-16 | 12-16 | 16-20 | 12-16 | 12-16 |
| Agresividad     | 8-12  | 14-18 | 12-16 | 14-18 | 10-14 | 8-12  | 10-14 |
| Polivalencia    | 4-8   | 6-10  | 10-14 | 8-12  | 10-14 | 10-14 | 6-10  |

### 7.3 Asignación de altura y peso

| Posición    | Altura (m)  | Peso (kg) |
| ----------- | ----------- | --------- |
| Portero     | 1.85 - 1.98 | 80 - 90   |
| Central     | 1.82 - 1.95 | 78 - 88   |
| Lateral     | 1.70 - 1.83 | 70 - 80   |
| Pivote      | 1.78 - 1.88 | 75 - 85   |
| Mediocentro | 1.75 - 1.85 | 70 - 80   |
| Extremo     | 1.68 - 1.80 | 65 - 75   |
| Delantero   | 1.75 - 1.90 | 72 - 85   |

### 7.4 Asignación de edad y forma inicial

- **Edad:** 16-40 (distribución uniforme, con más frecuencia entre 22-28).
- **Forma Física inicial:** 95-100%.
- **Moral inicial:** 😌 (Tranquilo).
- **Lesión:** Ninguna.

---

## 8. PROGRESIÓN Y DECLIVE POR EDAD

| Edad  | Físico      | Técnica    | Mental             | Agresividad | Polivalencia   |
| ----- | ----------- | ---------- | ------------------ | ----------- | -------------- |
| 16-20 | Sube rápido | Sube       | Sube               | Varía       | Sube (aprende) |
| 21-27 | Máximo      | Sube       | Sube               | Estable     | Estable        |
| 28-30 | Estable     | Máximo     | Máximo             | Estable     | Estable        |
| 31-33 | Baja lento  | Estable    | Máximo             | Baja        | Estable        |
| 34-36 | Baja        | Baja lento | Alto (experiencia) | Baja        | Baja           |
| 37-40 | Baja rápido | Baja       | Alto (sabiduría)   | Baja        | Baja           |

---

## 9. RELACIÓN CON EL MOTOR DE PARTIDO

### 9.1 Asignación de acciones por posición

El motor asigna acciones según la posición del jugador **primero**, y luego modula con su atributo.

**Ejemplo para remates:**

| Posición    | Probabilidad base |
| ----------- | ----------------- |
| Delantero   | 45%               |
| Extremo     | 25%               |
| Mediocentro | 15%               |
| Central     | 5%                |
| Pivote      | 5%                |
| Lateral     | 2%                |
| Portero     | 0%                |

**Modulación con atributo Disparo:**  
`ProbabilidadFinal = ProbabilidadBase * (Disparo / 10)`

### 9.2 Fórmula de duelo (ocasión de gol)

```
Probabilidad de gol = (PoderOfensivoAtacante / (PoderDefensivoDefensor + 1)) * FactorTáctica * FactorLocalía * FactorMoral * Azar (0.8-1.2)
```

### 9.3 Eventos especiales

| Evento           | Probabilidad | Factores que influyen                        |
| ---------------- | ------------ | -------------------------------------------- |
| Lesión           | 5-10%        | Agresividad alta, físico bajo, edad avanzada |
| Tarjeta amarilla | 10-15%       | Agresividad alta, arbitraje estricto         |
| Tarjeta roja     | 2-5%         | Agresividad muy alta, partido tenso          |

---

## 10. RESUMEN DE IMPLEMENTACIÓN

| **Módulo**                   | **Responsabilidad**                                                             |
| ---------------------------- | ------------------------------------------------------------------------------- |
| **Generación de jugadores**  | Crear jugadores con atributos internos, visibles y contextuales según posición. |
| **Cálculo de visibles**      | Extraer los 5 atributos visibles a partir de los 13 internos.                   |
| **Asignación de etiquetas**  | Generar etiqueta de perfil según combinación de visibles.                       |
| **Progresión por edad**      | Actualizar atributos internos al final de cada temporada según edad.            |
| **Motor de partido**         | Usar atributos internos y posición para simular acciones y duelos.              |
| **Registro de estadísticas** | Guardar todas las acciones de cada jugador en cada partido.                     |

---

## 11. EJEMPLO DE FICHA COMPLETA

```
FICHA DE JUGADOR - Juan Carlos Pérez
─────────────────────────────────────
Edad:       24 años
Altura:     1.82 m
Peso:       76 kg (✅ Adecuado)
Posición:   Mediocentro
Rol:        Creación
Etiqueta:   "Cerebral"

ATRIBUTOS VISIBLES (1-20)
─────────────────────────────────────
⚡ Físico:      14
🧠 Mental:      17
🦵 Técnica:     13
💥 Agresividad:  8
🔀 Polivalencia:13

ATRIBUTOS INTERNOS (1-20)
─────────────────────────────────────
Velocidad:       12
Resistencia:     14
Fuerza:          10
Control:         16
Pase:            18
Regate:          11
Disparo:          9
Anticipación:    17
Decisión:        19
Posicionamiento: 16
Visión:          18
Agresividad:      8
Polivalencia:    13

ESTADO ACTUAL
─────────────────────────────────────
Forma Física:   92%
Moral:          😌 Tranquilo
Lesión:         Ninguna
Disponible:     ✅ Sí

ESTADÍSTICAS DE TEMPORADA
─────────────────────────────────────
Partidos:   18
Goles:      3
Asistencias:4
Minutos:    1.420
Valoración: 7.1
```

---

## 12. NOTAS PARA EL AGENTE

1. **Escala única:** todos los atributos numéricos están en escala 1-20. No hay valores como 21 o 22.
2. **Posición ante todo:** el motor de partido asigna acciones según posición, no según atributo. El atributo solo modula la probabilidad.
3. **Variabilidad realista:** los jugadores deben tener perfiles diferenciados. No todos pueden ser "Superclase".
4. **Contexto dinámico:** la forma física, la moral y las lesiones deben cambiar durante la partida y la temporada.
5. **Estadísticas completas:** el motor debe registrar todas las acciones de cada jugador (tiros, pases, entradas, etc.) para alimentar las crónicas.

---

**Fin del documento.**
