# Notas de despliegue

Qué hay que saber antes de subir LinuxLab a un servidor. Todas las cifras están
medidas sobre el repo, no estimadas.

---

## 1. No instales ni compiles en el servidor

Es lo que está costando ahora mismo. Lo que pesa **no es la aplicación, es el
proceso de compilarla**:

| | Tamaño |
|---|---|
| `node_modules` | **908 MB** |
| `.next` de desarrollo | **1,7 GB** |
| `.next/standalone` (lo que corre en producción) | **60 MB** |
| `.next/static` | 4,2 MB |
| `public/` | 2,0 MB |

El `next.config.mjs` tiene `output: "standalone"`, así que Next empaqueta solo
las dependencias que el servidor toca de verdad. **En producción se sirven unos
66 MB, no 908.** El Dockerfile del frontend ya está hecho así: la etapa
`builder` instala y compila, y la etapa `runner` se queda únicamente con
`standalone`, `static` y `public`.

El problema es *dónde* corre la etapa `builder`. Si haces `docker compose build`
en el servidor, ahí se ejecutan el `npm ci` de 908 MB y el `next build`, que con
1 GB de RAM se va a quedar sin memoria.

**Qué hacer:** compilar en una máquina de desarrollo o en CI y llevar la imagen
ya construida.

```bash
# En tu máquina
docker compose build frontend backend
docker save linuxlab-frontend linuxlab-backend | gzip > imagenes.tar.gz
scp imagenes.tar.gz servidor:

# En el servidor
gunzip -c imagenes.tar.gz | docker load
docker compose up -d
```

Si prefieres compilar en el servidor de todos modos, hay que darle swap antes
(2 GB) o el build muere a mitad. Pero es más lento y hay que rehacerlo en cada
despliegue.

---

## 2. La URL del backend se congela al compilar

Este es el que rompe la aplicación entera y no da ningún error claro.

En `frontend/.env.local` está hoy:

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

Todo lo que empieza por `NEXT_PUBLIC_` **Next lo incrusta en el JavaScript
durante el build**. No se lee al arrancar. Y el `Dockerfile` copia `.env.local`
dentro de la etapa `builder`, así que ese valor es el que queda cocido en el
bundle que descarga cada navegador.

El `environment:` del `docker-compose.yml` no lo arregla: eso llega en tiempo de
arranque, cuando el valor ya está dentro del JavaScript.

Consecuencia si se despliega tal cual: **el navegador de cada estudiante pide la
API a su propio `localhost:3000`**. No funciona ni el login, ni las actividades,
ni la terminal — el WebSocket sale de ese mismo valor
(`frontend/components/shared/terminal-emulator.tsx`).

**Qué hacer:** poner la URL pública real en `frontend/.env.local` **antes** de
compilar. Ojo: `.env.local` está en `.gitignore`, así que no viaja con el repo y
hay que crearlo a mano en la máquina donde se compile.

---

## 3. Sin HTTPS no hay sesión

La cookie de sesión sale así (`backend/src/routes/auth.js`):

```js
secure: process.env.NODE_ENV === "production"
```

Con `NODE_ENV=production` la cookie es `secure`, y **ningún navegador guarda una
cookie `secure` recibida por `http://`**. El login responde 200, parece que
entra, y la siguiente petición ya va sin sesión. Es un fallo silencioso y cuesta
horas de depurar si no lo sabes.

**Qué hacer:** servir por HTTPS. No es opcional.

---

## 4. La suma de memoria pasa del presupuesto

Límites declarados hoy en `docker-compose.yml`:

| Servicio | Límite |
|---|---|
| `entorno` | 512 MB |
| `backend` | 256 MB |
| `postgres` | 256 MB |
| `frontend` | 128 MB |
| **Total** | **1152 MB** |

El servidor da 1 GB (1024 MB), así que nos pasamos.

Pero la base de datos es **Neon, remota** — `backend/.env` apunta a un host
`*.neon.tech`. El `postgres` del compose no lo usa nadie. Quitándolo del
despliegue quedamos en **896 MB**, con ~128 MB de margen para el host y Docker.

---

## 5. La solución que arregla 2, 3 y el CORS a la vez

Un proxy inverso con TLS delante de todo (Caddy o nginx), y **dejar de publicar
el puerto del backend**:

```
https://dominio/          → frontend:3000
https://dominio/api/*     → backend:3000
https://dominio/terminal  → backend:3000   (WebSocket)
```

Y al compilar:

```
NEXT_PUBLIC_BACKEND_URL=https://dominio
```

Con eso:

- La URL deja de ser `localhost` → **arregla el punto 2**.
- Todo va por HTTPS → **arregla el punto 3**.
- Frontend y backend quedan en el **mismo origen**, así que el CORS deja de
  intervenir.

Ese último punto importa por seguridad. Hoy el backend tiene
(`backend/src/index.js`):

```js
cors({ origin: true, credentials: true })
```

`origin: true` refleja **cualquier** origen que pida, y `credentials: true`
permite mandar cookies. Con el puerto 3000 publicado a internet, eso significa
que cualquier página web podría hacer peticiones autenticadas contra la sesión
de un estudiante que tenga LinuxLab abierto. Al quedar todo en el mismo origen
el problema desaparece; aun así conviene restringir `origin` al dominio.

---

## Checklist antes de desplegar

- [ ] Compilar las imágenes **fuera** del servidor y transferirlas
- [ ] `NEXT_PUBLIC_BACKEND_URL` con el dominio público, **antes** del build
- [ ] `.env.local` creado a mano en la máquina de build (está en `.gitignore`)
- [ ] Proxy inverso con certificado TLS
- [ ] Dejar de publicar el puerto 3000 del backend
- [ ] Quitar el servicio `postgres` del compose de producción (la BD es Neon)
- [ ] Restringir `cors({ origin })` al dominio
- [ ] Comprobar que el contenedor `entorno` arranca con cgroups y cuotas
      (el `entrypoint.sh` lo dice en su log; si el host no lo permite, cae al
      plan B de `nice` + `ulimit` y sigue funcionando)
