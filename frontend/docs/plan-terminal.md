# Plan: Terminal real (laboratorio Linux en el navegador)

Este documento explica cómo se va a construir el terminal de LinuxLab: la pieza
central del laboratorio, donde el estudiante ejecuta comandos Linux de verdad
desde el navegador.

- Un **servidor Linux compartido** con sesiones de usuario aisladas. NO un
  contenedor por estudiante (no cabría en ~1GB de RAM con 30 usuarios).
- Cada estudiante tiene su **cuenta Unix** con `/home` propio, quota de disco y
  límites de recursos (cgroups).
- Acceso por **Xterm.js + WebSocket** hacia el servidor.

Este plan implementa eso, agregando dos cosas: un desarrollo por **fases** (para
ver algo funcionando pronto y endurecer después) y el detalle de que en
desarrollo ese "host compartido" es un contenedor/VM Linux desechable, no la
máquina de trabajo de nadie.

## Glosario

- **PTY (pseudo-terminal):** la pieza del sistema operativo que hace de "terminal
  por software". En medio de una terminal real, siempre hay un PTY: un
  par de extremos conectados. En un extremo, `bash` cree que está hablando con
  una terminal física de verdad (por eso da el prompt, colorea, mueve el cursor,
  responde a Ctrl+C, etc.). En el otro extremo, nuestro programa lee lo que
  `bash` imprime y le escribe lo que el usuario teclea. Sin PTY, `bash` se porta
  raro: no da prompt interactivo, no colorea, no maneja bien las teclas. El PTY es
  lo que deja correr un shell real y "conectarlo" a la web. En Node lo maneja
  la librería `node-pty`.
- **Xterm.js:** la librería que dibuja una terminal dentro del navegador (la parte
  visual: texto, colores, cursor, teclado). Es lo que ve el estudiante.
- **WebSocket:** un canal de comunicación bidireccional y en tiempo real entre el
  navegador y el servidor. Por ahí viajan, en los dos sentidos, las teclas que el
  estudiante escribe y la salida del shell. HTTP normal no sirve porque es
  pregunta/respuesta; el terminal es un flujo continuo.
- **Gateway:** el proceso del backend que recibe el WebSocket, abre el PTY con el
  shell del estudiante, y conecta los dos flujos (navegador <-> shell).
- **cgroups:** mecanismo del kernel Linux para limitar cuántos recursos (CPU,
  RAM, número de procesos) puede usar un usuario o proceso. Es lo que evita que un
  estudiante tumbe el servidor.
- **Quota de disco:** límite de cuánto espacio puede ocupar cada `/home`.

## Cómo funciona (el flujo)

```
Estudiante teclea
      |
      v
Xterm.js (navegador)  <----- WebSocket ----->  Gateway (backend, Node)
                                                     |
                                                     v
                                               PTY (node-pty)
                                                     |
                                                     v
                                    bash corriendo como el usuario Unix
                                    del estudiante, en el host compartido
```

Lo que el estudiante escribe viaja por el WebSocket al gateway, el gateway se lo
pasa al PTY (a `bash`), y la salida de `bash` vuelve por el mismo WebSocket hasta
Xterm.js. Es un flujo de bytes en los dos sentidos, no un "manda comando, recibe
respuesta".

Nota técnica: el `seam` actual del frontend (`lib/data/terminal.ts`, con
`run(command)`) es un mock. El terminal real es streaming puro, así que reemplaza
esa UI por Xterm.js. El mock se queda solo como respaldo cuando el gateway no
está disponible.

## Las fases

Se trabajara por fases hasta ver algo funcionando pronto y dejar la seguridad (que es el
grueso) para cuando el tubo ya funcione.

### Fase 0: Prototipo (local, inseguro a propósito)

**Qué se busca:** probar el tubo Xterm <-> WebSocket <-> PTY de punta a punta.
Un solo shell compartido (`bash` como el usuario actual, en un directorio
scratch), sin login ni límites. El objetivo es teclear en el navegador y ver
`bash` real respondiendo. NO se despliega: es solo para validar que la conexión
funciona. No necesita Docker todavía.

### Fase 1: Autenticación + usuario por estudiante

**Qué se busca:** que cada estudiante entre a SU propia cuenta. El WebSocket
valida el JWT que ya emite el backend, resuelve qué estudiante es, y abre el
shell como su usuario Unix (creándolo la primera vez, con `/home` persistente).
Aquí entra **Docker**: se construye una imagen "lab host" (Linux + Node + backend
+ herramientas de `useradd`/quotas) y todo esto corre dentro de ese contenedor,
que representa el servidor del laboratorio. Así no se crean usuarios en la máquina
de nadie.

### Fase 2: Endurecimiento (seguridad)

**Qué se busca:** que el laboratorio aguante 30 estudiantes sin que uno solo lo
tumbe. Es el 80% del trabajo real. Incluye: límite de procesos (contra fork
bombs), límites de RAM y CPU por cgroups, quota de disco por `/home`, shell
restringido con comandos peligrosos bloqueados (`shutdown`, `reboot`, `su` a
otros, `rm -rf /`), red limitada, y timeout por inactividad. En el modelo de host
compartido esto NO es opcional: el estudiante tiene un shell sobre el host.

### Fase 3: Pulido

**Qué se busca:** que se sienta como una terminal de verdad. Reconexión al perder
la red, ajuste de tamaño (resize), estados de error claros, wireado limpio al
seam del frontend, y el mock como respaldo cuando el gateway no está.

## Seguridad: lo importante

El modelo es "host compartido con usuarios Unix", que es lo más liviano en
recursos, pero implica que los estudiantes tienen un shell sobre el servidor
real. Por eso la Fase 2 (endurecimiento) es obligatoria antes de cualquier uso
real. El prototipo de la Fase 0 es inseguro por diseño y solo corre en local.

## Cómo se versiona

El terminal toca dos repos: `linuxlab` (frontend) y `linux-lab-backend`. Se sube
a `main` en ambos, pero **apagado por defecto**:

- Backend: el gateway solo arranca con un flag de entorno (ej. `ENABLE_TERMINAL`).
- Frontend: sigue usando el mock a menos que se defina la URL del WebSocket
  (`NEXT_PUBLIC_TERMINAL_WS_URL`).

Así `main` queda seguro (el terminal está dormido para quien haga pull o deploy)
mientras el código se acumula fase a fase. Se prende cuando llegue la Fase 2.
