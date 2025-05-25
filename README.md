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

## Environments

Antes de ejecutar el bot, crea un archivo llamado `.env` en la raíz del proyecto con el siguiente contenido:

```env
# Token del bot de Telegram, generado con BotFather
BOT_TOKEN=tu_token_de_telegram

# Token de Plex (X-Plex-Token)
PLEX_TOKEN=tu_token_de_plex

# URL base de tu servidor Plex (recomendado: *.plex.direct con certificado HTTPS)
PLEX_URL=https://tu-servidor.plex.direct:32400
```
