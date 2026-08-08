# FM2 — Football Manager 2D

Juego de gestión deportiva 2D inspirado en Football Manager. Desarrollo actual: **65-70% completo**.

## Estado actual

- Setup de carrera (club/liga/selección/manager existente) funcional
- Motor de partido 2D en canvas con simulación realista
- Sistema de diálogos de staff (Ayudante de Campo, Preparador Físico, Director Deportivo) con bottom sheet + reveal progresivo + memoria
- Diálogos bidireccionales con jugadores (jugador→manager y manager→jugador) con personalidad y relación
- Mercado de fichajes, scouting, economía, cuerpo técnico, entrenamiento, tácticas
- Sistema de guardado/carga con migraciones automáticas
- PWA configurada, deploy automático en GitHub Pages

## Stack

- React + TypeScript + Vite
- Zustand para estado global
- Tailwind CSS para estilos
- Lucide React para iconos
- Vite PWA Plugin

## Ejecución local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push a `main` dispara deploy automático en GitHub Pages (workflow `.github/workflows/deploy.yml`).

## Documentación

- `ESTADO_PANTALLAS.md` — inventario de pantallas y estado real
- `MEJORAS.md` — backlog de mejoras priorizadas
- `.kilo/plans/` — planes de implementación detallados
