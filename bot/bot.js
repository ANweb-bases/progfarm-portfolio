// ProgFarm — бот-визитка. Без зависимостей: нужен Node 18+. Запуск: node bot.js
const fs = require('fs');
const path = require('path');

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const TOKEN = env.BOT_TOKEN, ADMIN = env.ADMIN_ID;
if (!TOKEN) throw new Error('BOT_TOKEN не задан в .env');
const API = `https://api.telegram.org/bot${TOKEN}/`;
const TG = 'https://t.me/rivvva_la_viddda', MAIL = 'tolyan.berd2008@gmail.com';

const S = [
  { id: 1, c: 'Сайты', t: 'Лендинг', p: 4500, d: '3–5 дней', a: 'Одностраничный продающий сайт: дизайн, адаптив, форма заявки, базовое SEO.' },
  { id: 2, c: 'Сайты', t: 'Сайт-визитка', p: 7000, d: '5–8 дней', a: 'До 5 страниц, уникальный дизайн и анимации, карта, соцсети, помощь с доменом.' },
  { id: 3, c: 'Сайты', t: 'Сайт с уникальным функционалом', p: 12000, d: '7–14 дней', a: 'Калькуляторы, кабинеты, фильтры, записи — по вашему ТЗ.' },
  { id: 4, c: 'Сайты', t: 'Интернет-магазин', p: 15000, d: '10–14 дней', a: 'Каталог, корзина, оформление заказа, уведомления, база товаров.' },
  { id: 5, c: 'Боты', t: 'Бот для продаж (каркас)', p: 3000, d: '2–4 дня', a: 'Пустой бот: меню, разделы, кнопки, заготовка под оплату, инструкция.' },
  { id: 6, c: 'Боты', t: 'Бот по вашему ТЗ', p: 8000, d: '5–10 дней', a: 'Сценарии, база пользователей и заказов, админ-команды, рассылка, деплой.' },
  { id: 7, c: 'Вёрстка и правки', t: 'Вёрстка по макету', p: 2500, d: '1–4 дня', a: 'Figma/PSD/картинка → аккуратный адаптивный HTML/CSS/JS.' },
  { id: 8, c: 'Вёрстка и правки', t: 'Доработка сайта', p: 1500, d: '1–3 дня', a: 'Новые блоки, формы, страницы, изменение дизайна и логики.' },
  { id: 9, c: 'Вёрстка и правки', t: 'Починка сайта', p: 2000, d: '1–2 дня', a: 'Диагностика и исправление багов, «съехавшей» вёрстки, ошибок форм.' },
  { id: 10, c: 'Базы данных', t: 'Создание базы данных', p: 6000, d: '3–7 дней', a: 'Проектирование схемы, создание БД (SQLite/PostgreSQL/MySQL), документация.' },
  { id: 11, c: 'Базы данных', t: 'Работа с БД', p: 3500, d: '1–5 дней', a: 'Импорт, SQL-запросы, оптимизация, отчёты, бэкапы и миграции.' },
];
const cats = [...new Set(S.map(s => s.c))];
const rub = n => n.toLocaleString('ru-RU') + ' ₽';

const call = (m, body) => fetch(API + m, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  .then(r => r.json()).then(j => { if (!j.ok) console.error(m, j.description); return j; }).catch(e => console.error(m, e.message));
const send = (chat_id, text, kb) => call('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: kb && { inline_keyboard: kb } });
const edit = (chat_id, message_id, text, kb) => call('editMessageText', { chat_id, message_id, text, parse_mode: 'HTML', reply_markup: { inline_keyboard: kb || [] } });

const MENU = [
  [{ text: '🛠 Услуги, заказ и оплата', callback_data: 'cats' }],
  [{ text: '💬 Связаться со мной лично', callback_data: 'ask' }],
  [{ text: '📞 Контакты', callback_data: 'contacts' }],
];
const HOME = [[{ text: '⬅ В меню', callback_data: 'menu' }]];
const WELCOME = '<b>ProgFarm</b> — сайты, боты и базы данных на заказ.\n\nЦены от 1 500 ₽. Заказ и оплата — прямо здесь, в боте. Выберите раздел:';

// chat_id -> { kind: 'order'|'ask', service? } — ждём следующее сообщение пользователя
const waiting = new Map();
// id сообщения админа -> chat_id пользователя, чтобы ответ админа ушёл пользователю
const relayFile = path.join(__dirname, 'relay.json');
let relay = {}; try { relay = JSON.parse(fs.readFileSync(relayFile, 'utf8')); } catch {}
const saveRelay = () => fs.writeFileSync(relayFile, JSON.stringify(relay));
const log = o => fs.appendFileSync(path.join(__dirname, 'orders.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n');
const who = u => u.username ? '@' + u.username : u.first_name;
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

function serviceCard(chat, s, mid) {
  const text = `<b>${s.t}</b>\n\n${s.a}\n\n💰 от <b>${rub(s.p)}</b>\n⏱ ${s.d}`;
  const kb = [[{ text: '💳 Заказать и оплатить', callback_data: 'buy:' + s.id }],
    [{ text: '❓ Вопрос по услуге', callback_data: 'ask:' + s.id }],
    [{ text: '⬅ Назад', callback_data: 'cat:' + cats.indexOf(s.c) }]];
  return mid ? edit(chat, mid, text, kb) : send(chat, text, kb);
}

async function onCallback(q) {
  const chat = q.message.chat.id, mid = q.message.message_id, [act, arg] = q.data.split(':');
  call('answerCallbackQuery', { callback_query_id: q.id });
  if (act === 'menu') { waiting.delete(chat); return edit(chat, mid, WELCOME, MENU); }
  if (act === 'cats') return edit(chat, mid, '<b>Категории услуг</b>', [...cats.map((c, i) => [{ text: c, callback_data: 'cat:' + i }]), ...HOME]);
  if (act === 'cat') {
    const list = S.filter(s => s.c === cats[arg]);
    return edit(chat, mid, `<b>${cats[arg]}</b>`, [...list.map(s => [{ text: `${s.t} — от ${rub(s.p)}`, callback_data: 'svc:' + s.id }]), [{ text: '⬅ Назад', callback_data: 'cats' }]]);
  }
  if (act === 'svc') return serviceCard(chat, S.find(x => x.id == arg), mid);
  if (act === 'buy') {
    const s = S.find(x => x.id == arg);
    waiting.set(chat, { kind: 'order', service: s });
    return send(chat, `Вы выбрали: <b>${s.t}</b> (от ${rub(s.p)}).\n\nОпишите задачу одним сообщением: что нужно, сроки, пожелания. После этого заявка получит номер и вы перейдёте к оплате.`);
  }
  if (act === 'ask') {
    waiting.set(chat, { kind: 'ask', service: arg && S.find(x => x.id == arg) });
    return send(chat, '💬 Напишите ваш вопрос одним сообщением — он придёт лично мне, и я отвечу прямо здесь, в боте.');
  }
  if (act === 'contacts') return edit(chat, mid,
    '📞 <b>Контакты</b>\n\n• Заказ, оплата, вопросы — в этом боте.\n• Личный Telegram — <b>только для развёрнутых и индивидуальных вопросов</b>.\n• Почта: <code>' + MAIL + '</code> (нажмите, чтобы скопировать)',
    [[{ text: '💬 Написать через бота', callback_data: 'ask' }], [{ text: '✈ Личный Telegram (развёрнутые вопросы)', url: TG }], ...HOME]);
  if (act === 'pay') return send(chat, '💳 <b>Оплата</b>\n\nПриём платежей в боте подключается. Заявка зафиксирована — как только оплата заработает, пришлю реквизиты и ссылку на оплату сюда. Если срочно — нажмите «Связаться со мной лично».', MENU);
}

async function onMessage(m) {
  const chat = m.chat.id, text = m.text || '', u = m.from;
  if (text === '/myid') console.log('myid request:', chat, who(u));
  if (text === '/myid') return send(chat, `Ваш chat id: <code>${chat}</code>`);

  // ответ админа на пересланное сообщение -> пользователю
  if (ADMIN && String(chat) === String(ADMIN) && m.reply_to_message) {
    const to = relay[m.reply_to_message.message_id];
    if (to && text) { await send(to, '💬 <b>Ответ:</b>\n' + esc(text)); return send(chat, '✅ Отправлено'); }
  }

  if (text.startsWith('/start') || text === '/menu') {
    waiting.delete(chat);
    const p = text.split(' ')[1], s = p && /^svc(\d+)$/.test(p) && S.find(x => x.id == p.slice(3));
    return s ? serviceCard(chat, s) : send(chat, WELCOME, MENU);
  }

  const w = waiting.get(chat);
  if (w && text) {
    waiting.delete(chat);
    const svc = w.service ? w.service.t : null;
    log({ kind: w.kind, chat, user: who(u), service: svc, text });
    const head = (w.kind === 'order' ? '🆕 <b>Новая заявка</b>' : '💬 <b>Вопрос</b>') + `\nОт: ${who(u)} (<code>${chat}</code>)\nУслуга: ${svc || '—'}\n\n${esc(text)}\n\n<i>Ответьте реплаем на это сообщение — ответ уйдёт пользователю.</i>`;
    if (ADMIN) {
      const r = await send(ADMIN, head);
      if (r?.ok) { relay[r.result.message_id] = chat; saveRelay(); }
    }
    if (w.kind === 'order') return send(chat, `✅ Заявка принята${svc ? ': <b>' + svc + '</b>' : ''}. Следующий шаг — оплата.`, [[{ text: '💳 Перейти к оплате', callback_data: 'pay' }], ...HOME]);
    return send(chat, ADMIN ? '✅ Вопрос передан, отвечу прямо здесь в ближайшее время.' : '✅ Вопрос сохранён. Если срочно — личный Telegram (только развёрнутые вопросы): ' + TG, HOME);
  }
  return send(chat, 'Нажмите кнопку в меню 👇', MENU);
}

async function main() {
  const me = await call('getMe', {});
  if (!me?.ok) return console.error('Неверный токен или нет сети');
  console.log(`Бот @${me.result.username} запущен`);
  let offset = 0;
  for (;;) {
    const r = await call('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
    if (!r?.ok) { await new Promise(s => setTimeout(s, 3000)); continue; }
    for (const u of r.result) {
      offset = u.update_id + 1;
      try { await (u.callback_query ? onCallback(u.callback_query) : u.message && onMessage(u.message)); } catch (e) { console.error(e); }
    }
  }
}
main();
