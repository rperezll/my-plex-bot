# my-plex-bot

Bot de Telegram para controlar tu servidor de **Plex**, hecho en **TypeScript** usando [**Telegraf**](https://github.com/telegraf/telegraf).

---

## Scripts disponibles

- `npm run dev` — Ejecuta el bot en modo desarrollo con recarga automática.
- `npm run build` — Compila el bot para producción.
- `npm start` — Ejecuta el bot compilado (postbuild).
- `npm run format` — Formatea el código con Prettier.
- `npm run lint` — Ejecuta ESLint para revisar el código.

---

## Docker

El proyecto incluye un `docker-compose.yml` que construye y ejecuta la app en producción.  
Solo necesitas tener un archivo `.env` en la raíz con la configuración.

```bash
docker compose up -d
```

---
