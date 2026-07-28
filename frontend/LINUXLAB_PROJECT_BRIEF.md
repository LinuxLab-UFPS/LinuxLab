# LinuxLab UFPS — Project Brief

## Overview

LinuxLab UFPS is a virtual Linux laboratory for the Operating Systems course at Universidad Francisco de Paula Santander. It is NOT a virtual course — it is a laboratory platform that provides a real Linux terminal via web browser, structured educational content, interactive simulators, and practical activities with automatic evaluation.

---

## Architecture

Hybrid M2+M3 approach:
- **Application stack** (backend, database, frontend) runs in Docker containers.
- **Student Linux environments** run on a shared Linux server with isolated user sessions — NOT one container per student.
- Each student gets a Linux user account with their own `/home` directory, disk quotas, and resource limits via cgroups.
- Terminal access via Xterm.js + WebSocket connection to the server.

**Server constraints:** ~1GB RAM, ~30 concurrent students. The architecture must be lightweight.

**Recommended stack:** React + shadcn/ui + Tailwind (frontend), Node.js + Fastify (backend), PostgreSQL (database).

---

## Roles

| Role | Description |
|------|-------------|
| **Student** | Accesses assigned content, uses the terminal, completes activities, views progress. |
| **Teacher** | Creates courses by selecting topics and activities, creates custom activities, registers students, tracks progress. |
| **Admin** | Server configuration, user management (defined later). |

---

## Content Model

```
Fixed Temario (created by thesis team)
├── 1. Introducción a Linux
│   ├── Historia
│   ├── Kernel
│   ├── Entorno de ventanas
│   └── Instalación
├── 2. Directorios (tipos: etc/, home, etc)
├── 3. Sistema de Archivos (inodos, etc)
├── 4. Creación de directorios
├── 5. Creación de archivos (touch, vi, pico, nano)
├── 6. Permisos
├── 7. Compresión
├── 8. Búsqueda (patrones, expresiones regulares)
├── 9. Permisos avanzados (chmod, umask)
├── 10. Usuarios (passwd, shadow)
├── 11. Shell scripting
└── 12. Funciones avanzadas (codificación base64, encriptamiento)
```

- The temario is **fixed** — teachers do not create or modify topics.
- Each topic may include: text content, videos, external links, simulators.
- The thesis team produces all content (text, audiovisual material, activities).

---

## Activities

### Bank activities (created by thesis team)
- Associated to specific topics in the temario.
- Auto-evaluated via unit tests (bash scripts that validate command output or filesystem state).
- Provide immediate feedback to the student.

### Teacher activities (created by each teacher)
- Teacher defines: instructions (rich text), score, due date, associated topic.
- Teacher can optionally provide a bash validation script (prints PASS/FAIL).
- If no script, teacher reviews and grades manually.
- Student submits work for review.
- Inspired by OnlineGDB classroom assignments.

---

## Simulators

### Rebuilt in the platform (benefit from real terminal)
- **chmod permissions** — execute real commands, verify with `ls -l`
- **Paths, wildcards and commands** — navigate real filesystem
- **Interactive umask quiz** — execute `umask`, create files, verify results

### Linked as external resources (value is visual)
- **Umask binary operations** — step-by-step binary logic visualization
- **Multiprogramming** — Gantt diagram of process states, CPU utilization
- **Uniprogramming** — sequential process execution timeline

---

## Functional Requirements

### Content
**RF-01:** La plataforma debe contener un temario fijo estructurado por temas con recursos hipermediales asociados (texto, video, enlaces externos).

### Course Management
**RF-02:** El docente debe poder crear un curso seleccionando qué temas del temario habilitar y qué actividades asignar.

**RF-03:** El docente debe poder registrar estudiantes en su curso de forma individual o mediante carga de archivo CSV.

### Activities
**RF-04:** La plataforma debe contar con un banco de actividades prácticas asociadas a los temas del temario.

**RF-05:** Las actividades del banco deben ser autoevaluables mediante pruebas unitarias que validen automáticamente la ejecución de comandos del estudiante y proporcionen retroalimentación inmediata.

**RF-06:** El docente debe poder crear actividades propias definiendo instrucciones en texto, asignando una puntuación, y opcionalmente proporcionando un script de validación en bash.

**RF-07:** El estudiante debe poder enviar su trabajo en las actividades del docente para que este lo revise y califique.

### Tracking
**RF-08:** El docente debe contar con un panel de seguimiento donde visualice el avance y calificaciones de cada estudiante por actividad.

**RF-09:** El estudiante debe poder consultar su progreso y calificaciones dentro del curso.

### User Management
**RF-10:** El sistema debe manejar roles diferenciados de estudiante y docente, donde cada rol accede a funcionalidades distintas: el estudiante accede al contenido, terminal y actividades de su curso; el docente gestiona cursos, actividades, estudiantes y seguimiento.

---

## Non-Functional Requirements (to define in detail)

- Support for 30 concurrent users.
- Individual Linux accounts with persistent `/home`.
- Disk quotas per user.
- Resource isolation via cgroups (CPU, RAM, max processes).
- Restriction of dangerous commands (shutdown, reboot, rm -rf /, fork bombs).
- WebSocket-based terminal access via Xterm.js.
- Application deployed in Docker containers on institutional server.

---

## Design Direction

### Aesthetic
Clean, minimalist, functional. Inspired by Linear and Vercel — not by traditional LMS platforms. Lots of whitespace, card-based layouts, sparse UI. NOT crowded, NOT overloaded.

### Color Palette
- Background: `#0d1117` (near-black)
- Cards/Surfaces: `#161b22`
- Borders: `#21262d`
- Text: white / `#c9d1d9` (secondary)
- Accent: red `#C41E3A` (UFPS institutional color) — used sparingly for active states, buttons, progress indicators
- Terminal: black `#0a0a0a` with green prompt

### Typography
Monospace for terminal and code elements. Clean sans-serif for UI. No decorative fonts.

### Layout Principles
- Left sidebar for navigation (collapsible)
- Card grid for topic browsing
- Split panel (instructions left / terminal right) for activities
- Dense but readable tables for tracking dashboards
- Floating terminal button for quick access

### Key Screens

1. **Student — Course view:** Sidebar with nav (Inicio, Mi Terminal, Contenidos). Main area shows topic cards in a grid. Each card: icon, title, short description. Clean, no progress clutter on this view.

2. **Student — Activity with terminal:** Split panel 40/60. Left: instructions and step list. Right: full terminal emulator. Validate button.

3. **Teacher — Create course:** Single form. Course name, topic checklist with activity counts, student management (individual + CSV), publish button.

4. **Teacher — Create activity:** Split layout. Left: form (name, topic, score, date, instructions editor, evaluation toggle with bash script editor). Right: live terminal for testing.

5. **Teacher — Tracking dashboard:** Metric cards row, filter bar, dense student progress table with status indicators.

6. **Student — My progress:** Overall percentage, per-topic progress bars, recent submissions feed, grades table.
