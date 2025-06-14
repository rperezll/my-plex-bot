import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import {
  getPlexServerStatus,
  getPlexActiveUsers,
  getPlexSearch,
} from './tautulli-api';

import { message } from 'telegraf/filters';
import { getEnvs } from './env-config';

// Validación de variables de entorno
getEnvs();

const bot = new Telegraf(getEnvs().BOT_TOKEN);

const userSearchState = new Map<number, boolean>();

bot.telegram.setMyCommands([
  { command: 'start', description: '🖖 Inicia el bot' },
  { command: 'search', description: '🔍 Buscar contenido' },
  { command: 'status', description: '🤔 Plex está encendido?' },
  { command: 'users', description: '👨‍👩‍👧‍👦 Usuarios conectados' },
  { command: 'schedules', description: '📆 Horarios' },
]);

bot.start((ctx) => {
  ctx.reply(
    `<b>👋 ¡Bienvenido a My Plex Bot!</b>\n\n` +
      `Este bot te permite consultar y gestionar información de tu servidor Plex directamente desde Telegram.\n\n` +
      `Usa los comandos disponibles o los botones para empezar.`,
    {
      parse_mode: 'HTML',
      ...Markup.inlineKeyboard([
        Markup.button.url(
          '📚 Documentación',
          'https://github.com/rperezll/my-plex-bot'
        ),
        Markup.button.url(
          '🐛 Reportar',
          'https://github.com/rperezll/my-plex-bot/issues'
        ),
      ]),
    }
  );
});

bot.command('status', async (ctx) => {
  const status = await getPlexServerStatus();

  if (!status.success) {
    return await ctx.reply(`❌ ${status.log!}`);
  }

  return await ctx.reply(`✅ ${status.log!}`);
});

bot.command('schedules', async (ctx) => {
  await ctx.replyWithHTML(
    `🕑 El horario de funcionamiento es de <b>${getEnvs().PLEX_ON_TIME}</b> a <b>${getEnvs().PLEX_OFF_TIME}</b>.`
  );
});

bot.command('users', async (ctx) => {
  const result = await getPlexActiveUsers();

  if (!result.success) {
    return ctx.reply(result.log!);
  }

  const users = result.users ?? [];

  if (users.length === 0) {
    return ctx.replyWithHTML(`<b>No hay usuarios activos en este momento.</b>`);
  }

  const usersHTML = users
    .map((user) => {
      return (
        `<b>${user.username}</b>\n` +
        `${user.content ? ` <i>Contenido:</i> ${user.content}\n` : ''}` +
        `${user.product ? ` <i>Dispositivo:</i> ${user.product}\n` : ''}`
      );
    })
    .join('\n');

  await ctx.replyWithHTML(
    `<b>📺 Usuarios activos en este momento:</b>\n\n${usersHTML}`
  );
});

bot.command('search', async (ctx) => {
  const status = await getPlexServerStatus();

  if (!status.success) {
    await ctx.reply(status.log!);
  }

  const userId = ctx.from?.id;
  if (!userId) return;

  userSearchState.set(userId, true);

  await ctx.reply('🔎 Escribe el nombre del contenido que deseas buscar:');
});

// Evento para capturar las respuestas del usuario al comando 'search'
bot.on(message('text'), async (ctx) => {
  const userId = ctx.from?.id;

  if (!userId || !userSearchState.get(userId)) return;

  userSearchState.delete(userId);

  if ('text' in ctx.message && ctx.message.text) {
    const query = ctx.message.text;
    const search = await getPlexSearch(query);

    if (!search.success || !search.content || search.content.length === 0) {
      return ctx.reply(`🙅 No tengo nada parecido a <b>${query}</b>.`, {
        parse_mode: 'HTML',
      });
    }

    let caption = '<b>He encontrado lo siguiente:</b>';
    for (const item of search.content) {
      caption += `\n\n🎬 <b>${item.title}</b>\n📅 Año: ${item.year}\n⭐ Rating: ${item.rating}\n📺 Tipo: ${item.type}`;
    }
    await ctx.replyWithHTML(caption);
  } else {
    ctx.reply('😢 No puedo entenderte.');
  }
});

bot.launch();
console.log('🤖 Bot en marcha...');
