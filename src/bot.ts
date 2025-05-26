import 'dotenv/config';
import { Telegraf, Markup } from 'telegraf';
import {
  getPlexServerStatus,
  getPlexSearch,
  getPlexActiveUsers,
  // checkForNewContent,
} from './plex-api';

import { message } from 'telegraf/filters';

const bot = new Telegraf(process.env.BOT_TOKEN!);

const userSearchState = new Map<number, boolean>();

bot.telegram.setMyCommands([
  { command: 'start', description: '🖖 Inicia el bot' },
  { command: 'search', description: '🔍 Buscar contenido' },
  { command: 'status', description: '🤔 Plex está encendido?' },
  { command: 'users', description: '👨‍👩‍👧‍👦 Usuarios conectados' },
  { command: 'schedules', description: '📆 Horarios' },
  // { command: 'test', description: 'test' },
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
          '📚 Repositorio',
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
  await ctx.reply(
    `El horario de funcionamiento es de ${process.env.PLEX_ON_TIME} a ${process.env.PLEX_OFF_TIME}`
  );
});

// bot.command('test', async (ctx) => {
//   checkForNewContent();
// });

bot.command('users', async (ctx) => {
  const result = await getPlexActiveUsers();

  if (!result.success) {
    return ctx.reply(result.log!);
  }

  if (!result.success) {
    return ctx.reply(result.log!);
  }

  const message = result.users
    ?.map(
      (u) =>
        `👤 <b>${u.user}</b>\n - Viendo: ${u.title} (${u.type})\n - Plataforma: ${u.platform}\n - Estado: ${u.state}`
    )
    .join('\n\n');

  await ctx.replyWithHTML(`<b>${result.log}</b>\n\n${message}`);
});

bot.command('search', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;

  userSearchState.set(userId, true);

  await ctx.reply('🔎 Escribe el nombre del contenido que deseas buscar:');
});

bot.on(message('text'), async (ctx) => {
  const userId = ctx.from?.id;

  if (!userId || !userSearchState.get(userId)) return;

  userSearchState.delete(userId);

  if ('text' in ctx.message && ctx.message.text) {
    const query = ctx.message.text;
    const search = await getPlexSearch(query);

    if (!search.success || !search.content || search.content.length === 0) {
      return ctx.reply(`🙅 No tengo nada parecido a <b>${query}</b>`, {
        parse_mode: 'HTML',
      });
    }

    ctx.reply('He encontrado lo siguiente:');

    for (const item of search.content) {
      const caption =
        `🎬 <b>${item.title}</b>\n(${item.year})\n⭐ Rating: ${item.rating}`.trim();

      await ctx.replyWithPhoto(
        { source: item.poster! },
        { caption, parse_mode: 'HTML' }
      );
    }
  } else {
    ctx.reply('😢 No puedo entenderte.');
  }
});

bot.launch();
console.log('🤖 Bot en marcha...');
