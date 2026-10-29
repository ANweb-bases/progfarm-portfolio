// ProgFarm — бот: каталог услуг, калькулятор, заявки со статусами, диалог с владельцем, отзывы.
// Без зависимостей, нужен Node 18+. Запуск: node bot.js
const fs = require('fs');
const path = require('path');

/* ───────────── настройки ───────────── */
const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').replace(/^﻿/, '').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#')).map(l => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
if (process.env.PF_ADMIN) env.ADMIN_ID = process.env.PF_ADMIN;
const TOKEN = env.BOT_TOKEN, ADMIN = env.ADMIN_ID ? String(env.ADMIN_ID) : '';
if (!TOKEN) throw new Error('BOT_TOKEN не задан в .env');
const API = `https://api.telegram.org/bot${TOKEN}/`;
const TG = 'https://t.me/rivvva_la_viddda', MAIL = 'progfarm604@gmail.com', GH = 'https://github.com/ANweb-bases';
const SITE = 'https://anweb-bases.github.io/progfarm-portfolio/', REL = GH + '/progfarm-portfolio/releases/latest';

/* ───────────── данные ───────────── */
const S = [
  { id: 1, c: 'Сайты', t: 'Лендинг', p: 4500, d: '3–5 дней', a: 'Одностраничный продающий сайт для товара, услуги или акции.', l: ['Дизайн под ваш бренд', 'Адаптив под телефон', 'Форма заявки на почту/в Telegram', 'Базовое SEO и быстрая загрузка'] },
  { id: 2, c: 'Сайты', t: 'Сайт-визитка', p: 7000, d: '5–8 дней', a: 'Сайт компании или специалиста: о себе, услуги, цены, контакты.', l: ['До 5 страниц', 'Уникальный дизайн и анимации', 'Карта, соцсети, кнопки связи', 'Помощь с доменом'] },
  { id: 3, c: 'Сайты', t: 'Сайт с уникальным функционалом', p: 12000, d: '7–14 дней', a: 'Калькуляторы, кабинеты, фильтры, записи — всё, чего нет в конструкторах.', l: ['Разработка по вашему ТЗ', 'Логика на JavaScript', 'Сохранение данных', 'Тесты на разных устройствах'] },
  { id: 4, c: 'Сайты', t: 'Интернет-магазин', p: 15000, d: '10–14 дней', a: 'Каталог, корзина, оформление заказа, уведомления о заказах.', l: ['Каталог с фильтрами и поиском', 'Корзина и заказ', 'Уведомления о заказах', 'База товаров и простая админка'] },
  { id: 5, c: 'Боты', t: 'Бот для продаж (каркас)', p: 3000, d: '2–4 дня', a: 'Бот-основа: меню, разделы, кнопки, обратная связь. Контент добавляете вы.', l: ['Приветствие и меню', 'Разделы с кнопками', 'Заготовка под оплату', 'Инструкция по запуску'] },
  { id: 6, c: 'Боты', t: 'Бот по вашему ТЗ', p: 8000, d: '5–10 дней', a: 'Бот под вашу задачу: заказы, записи, опросы, рассылки, админ-панель.', l: ['Сценарии по ТЗ', 'База пользователей и заказов', 'Админ-команды и рассылка', 'Развёртывание на сервере'] },
  { id: 7, c: 'Вёрстка и правки', t: 'Вёрстка по макету', p: 2500, d: '1–4 дня', a: 'Figma, PSD или картинка → аккуратный адаптивный HTML/CSS/JS.', l: ['Pixel-perfect', 'Адаптив', 'Чистый код', 'Интерактив: меню, слайдеры, окна'] },
  { id: 8, c: 'Вёрстка и правки', t: 'Доработка сайта', p: 1500, d: '1–3 дня', a: 'Новые блоки, формы, страницы, изменение дизайна и логики на готовом сайте.', l: ['Анализ кода', 'Новый функционал', 'Сохранение вашего стиля', 'Отчёт об изменениях'] },
  { id: 9, c: 'Вёрстка и правки', t: 'Починка сайта', p: 2000, d: '1–2 дня', a: 'Не работает форма, «поехала» вёрстка, ошибки в консоли — найду и исправлю.', l: ['Диагностика', 'Исправление багов', 'Проверка в браузерах', 'Советы, как не повторилось'] },
  { id: 10, c: 'Базы данных', t: 'Создание базы данных', p: 6000, d: '3–7 дней', a: 'Продумаю структуру и создам БД под ваш бизнес: клиенты, заказы, товары, склад.', l: ['Схема таблиц и связей', 'SQLite / PostgreSQL / MySQL', 'Тестовые данные', 'Документация'] },
  { id: 11, c: 'Базы данных', t: 'Работа с базами данных', p: 3500, d: '1–5 дней', a: 'Импорт, SQL-запросы, оптимизация, отчёты, бэкапы и миграции.', l: ['Импорт из Excel/CSV', 'SQL-запросы и оптимизация', 'Отчёты и выгрузки', 'Бэкапы и миграции'] },
];
const cats = [...new Set(S.map(s => s.c))];
const CAT_ICON = { 'Сайты': '🌐', 'Боты': '🤖', 'Вёрстка и правки': '🛠', 'Базы данных': '🗄' };
const STAT = { new: ['🆕', 'Новая'], accepted: ['✅', 'Принята'], progress: ['🔨', 'В работе'], invoiced: ['🧾', 'Счёт выставлен'], done: ['🎉', 'Выполнена'], rejected: ['❌', 'Отклонена'] };
const DEADLINES = { u: '🔥 Срочно (до 3 дней)', w: '📅 1–2 недели', f: '🕊 Не горит' };
const BUDGETS = { n: 'Пока не знаю', a: 'до 5 000 ₽', b: '5–10 000 ₽', c: '10–15 000 ₽', d: 'больше 15 000 ₽' };
const FAQ = [
  ['💳 Как оплатить?', 'Оплата подключается прямо в боте. Пока что после согласования задачи я пришлю реквизиты в этом чате. Обычно 50% предоплата, остальное после сдачи.'],
  ['⏱ Как быстро ответите?', 'Обычно в течение дня. Срочные заявки (отметка «🔥 Срочно») смотрю в первую очередь.'],
  ['🔁 Можно что-то поменять после сдачи?', 'Да. Мелкие правки в течение 7 дней бесплатны, дальнейшая доработка — по услуге «Доработка сайта».'],
  ['🌍 Делаете хостинг и домен?', 'Помогу выбрать и настроить. Сами хостинг и домен оплачиваются отдельно, напрямую провайдеру.'],
  ['📦 Что я получу?', 'Готовые файлы и инструкцию. Для сайтов — ещё и помощь с публикацией. Исходники принадлежат вам.'],
  ['🧩 Нужной услуги нет в списке', 'Напишите мне через «💬 Связаться» — оценю индивидуально. Большинство веб-задач решается в рамках перечисленных услуг.'],
];
const PROJECTS = [
  ['🧾 Счёт — генератор счетов', SITE + '02-schet/schet.html'], ['🧰 DevKit — инструменты разработчика', SITE + '03-devkit/devkit.html'],
  ['📈 ПроФинанс — калькуляторы', SITE + '04-profinance/profinance.html'], ['💻 Приложения для Windows (.exe)', REL],
  ['⌥ Все исходники на GitHub', GH + '/progfarm-portfolio'], ['🌐 Сайт ProgFarm', SITE + '01-progfarm/progfarm.html'],
];

/* ───────────── хранилище ───────────── */
const DIR = process.env.PF_DATA || path.join(__dirname, 'data'); fs.mkdirSync(DIR, { recursive: true });
const FILE = path.join(DIR, 'store.json');
let DB = { users: {}, orders: [], relay: {}, seq: 0, banner: null, offset: 0 };
try { DB = { ...DB, ...JSON.parse(fs.readFileSync(FILE, 'utf8')) }; } catch {}
let timer; const save = () => { clearTimeout(timer); timer = setTimeout(() => { try { fs.writeFileSync(FILE + '.tmp', JSON.stringify(DB)); fs.renameSync(FILE + '.tmp', FILE); } catch (e) { console.error('save', e.message); } }, 300); };
process.on('SIGINT', () => { try { fs.writeFileSync(FILE, JSON.stringify(DB)); } catch {} process.exit(0); });

/* ───────────── утилиты ───────────── */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = t => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const when = d => new Date(d).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const who = u => (u.username ? '@' + u.username : u.name || 'без имени');
const LINE = '━━━━━━━━━━━━━━━━━━';
const head = (icon, title, sub) => `${icon} <b>${title}</b>${sub ? '\n<i>' + sub + '</i>' : ''}\n${LINE}\n`;
const btn = (text, data) => ({ text, callback_data: data });
const url = (text, u) => ({ text, url: u });
const isAdmin = id => ADMIN && String(id) === ADMIN;

async function api(method, body, form) {
  for (let i = 0; i < 3; i++) {
    const r = await fetch(API + method, form ? { method: 'POST', body: form } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(x => x.json()).catch(e => ({ ok: false, description: e.message }));
    if (r.ok) return r;
    if (r.error_code === 429) { await sleep(((r.parameters && r.parameters.retry_after) || 1) * 1000 + 200); continue; }
    if (!/not modified|message to edit not found|can't be edited|have no rights|blocked by the user|chat not found/i.test(r.description || '')) console.error(method, r.description);
    return r;
  }
  return { ok: false };
}
const send = (chat, text, kb, extra = {}) => api('sendMessage', { chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: kb ? { inline_keyboard: kb } : undefined, ...extra });
// «экран»: правим сообщение на месте, а если нельзя — присылаем новое
async function screen(chat, mid, text, kb) {
  if (mid) { const r = await api('editMessageText', { chat_id: chat, message_id: mid, text, parse_mode: 'HTML', disable_web_page_preview: true, reply_markup: { inline_keyboard: kb || [] } }); if (r.ok || /not modified/.test(r.description || '')) return r; }
  return send(chat, text, kb);
}
const copy = (to, from, mid, extra = {}) => api('copyMessage', { chat_id: to, from_chat_id: from, message_id: mid, ...extra });
const react = (chat, mid, emoji = '👌') => api('setMessageReaction', { chat_id: chat, message_id: mid, reaction: [{ type: 'emoji', emoji }] });

/* ───────────── пользователи ───────────── */
function touch(from, chat) {
  const id = String(chat), u = DB.users[id] || { id, joined: Date.now(), isNew: true };
  const fresh = !DB.users[id];
  Object.assign(u, { name: [from.first_name, from.last_name].filter(Boolean).join(' '), username: from.username || '', last: Date.now() });
  DB.users[id] = u; save(); return { u, fresh };
}
const ST = new Map();   // состояние пользователя: что ждём от него сейчас
const AST = new Map();  // состояние админа: кому он сейчас пишет

/* ───────────── главное меню ───────────── */
function menuKb(chat) {
  const k = [
    [btn('🛠 Услуги и цены', 'sv'), btn('🧮 Калькулятор', 'ca')],
    [btn('⚡ Оформить заявку', 'o:new'), btn('🧾 Мои заявки', 'my')],
    [btn('📁 Портфолио', 'pf'), btn('❓ Вопросы', 'fq')],
    [btn('💬 Связаться со мной', 'ch')],
    [btn('📞 Контакты', 'ct')],
  ];
  if (isAdmin(chat)) k.push([btn('🔐 Админ-панель', 'ad')]);
  return k;
}
const menuText = u => head('🌱', 'ProgFarm', 'сайты · боты · приложения · базы данных')
  + `${u && u.visits > 1 ? 'С возвращением' : 'Привет'}, <b>${esc((u && (u.name || u.username)) || 'друг')}</b>!\n\nЯ помогу выбрать услугу, <b>посчитать стоимость</b>, оформить заявку и быть на связи с разработчиком — не выходя из Telegram.\n\n💰 Цены от <b>1 500 ₽</b>   ⏱ ответ в течение дня`;
const showMenu = (chat, mid) => screen(chat, mid, menuText(DB.users[chat]), menuKb(chat));
const back = (to = 'm') => [btn('⬅ Назад', to), btn('🏠 Меню', 'm')];

/* ───────────── услуги ───────────── */
const svcCats = (chat, mid) => screen(chat, mid, head('🛠', 'Услуги', '11 направлений, цены от 1 500 ₽') + 'Выберите категорию:', [...cats.map((c, i) => [btn(`${CAT_ICON[c]} ${c}  ·  ${S.filter(s => s.c === c).length}`, 'sc:' + i)]), [btn('🏠 Меню', 'm')]]);
const svcList = (chat, mid, i) => screen(chat, mid, head(CAT_ICON[cats[i]], cats[i]) + 'Нажмите на услугу, чтобы увидеть подробности:',
  [...S.filter(s => s.c === cats[i]).map(s => [btn(`${s.t} — от ${rub(s.p)}`, 'sv:' + s.id)]), back('sv')]);
const svcCard = (chat, mid, s) => screen(chat, mid, head('📌', s.t, s.c) + `${s.a}\n\n${s.l.map(x => '✔ ' + x).join('\n')}\n\n💰 от <b>${rub(s.p)}</b>   ⏱ ${s.d}`,
  [[btn('⚡ Заказать', 'o:s:' + s.id), btn('🧮 Рассчитать', 'c:s:' + s.id)], [btn('💬 Вопрос по услуге', 'ch:s' + s.id)], back('sc:' + cats.indexOf(s.c))]);

/* ───────────── калькулятор ───────────── */
const CX = [['Базовый', 1, 'стандартный дизайн, без сложной логики'], ['Расширенный', 1.35, 'уникальный дизайн, анимации, больше страниц/функций'], ['Сложный', 1.8, 'нестандартная логика, интеграции, личный кабинет']];
function calcPick(chat, mid) { return screen(chat, mid, head('🧮', 'Калькулятор стоимости', 'шаг 1 из 3 · что нужно сделать?') + 'Выберите услугу — оценю стоимость за минуту:', [...cats.map((c, i) => [btn(`${CAT_ICON[c]} ${c}`, 'cc:' + i)]), [btn('🏠 Меню', 'm')]]); }
const calcCat = (chat, mid, i) => screen(chat, mid, head('🧮', 'Калькулятор', 'шаг 1 из 3 · ' + cats[i]), [...S.filter(s => s.c === cats[i]).map(s => [btn(`${s.t} · от ${rub(s.p)}`, 'c:s:' + s.id)]), back('ca')]);
const calcCx = (chat, mid, id) => { const s = S.find(x => x.id == id); return screen(chat, mid, head('🧮', 'Калькулятор', 'шаг 2 из 3 · сложность') + `<b>${s.t}</b>\n\nНасколько сложный проект?\n\n${CX.map((x, i) => `${['🟢', '🟡', '🔴'][i]} <b>${x[0]}</b> — ${x[2]}`).join('\n')}`, [...CX.map((x, i) => [btn(`${['🟢', '🟡', '🔴'][i]} ${x[0]}`, `c:x:${id}:${i}`)]), back('ca')]); };
const calcUr = (chat, mid, id, x) => screen(chat, mid, head('🧮', 'Калькулятор', 'шаг 3 из 3 · сроки') + 'Когда нужен результат?', [[btn('📅 В обычные сроки', `c:r:${id}:${x}:0`)], [btn('🔥 Срочно (+25%)', `c:r:${id}:${x}:1`)], back('c:s:' + id)]);
function calcRes(chat, mid, id, x, u) {
  const s = S.find(q => q.id == id), lo = Math.round(s.p * CX[x][1] * (u ? 1.25 : 1) / 100) * 100, hi = Math.round(lo * 1.25 / 100) * 100;
  return screen(chat, mid, head('🧮', 'Результат', s.t) + `Сложность: <b>${CX[x][0]}</b>${u ? '   🔥 срочно' : ''}\n\n💰 Ориентир: <b>${rub(lo)} – ${rub(hi)}</b>\n⏱ Срок: ${u ? 'ускоренный' : s.d}\n\n<i>Это оценка. Точную цену и срок назову после обсуждения задачи — бесплатно и без обязательств.</i>`,
    [[btn('⚡ Оформить заявку с этим расчётом', `o:c:${id}:${x}:${u}`)], [btn('🔁 Пересчитать', 'ca'), btn('🏠 Меню', 'm')]]);
}

/* ───────────── заявка (мастер) ───────────── */
const stepTxt = (n, t) => head('⚡', 'Новая заявка', `шаг ${n} из 4 · ${t}`);
function askSvc(chat, mid) { return screen(chat, mid, stepTxt(1, 'услуга') + 'Что вам нужно?', [...S.map(s => [btn(`${s.t} · от ${rub(s.p)}`, 'o:s:' + s.id)]), [btn('🧩 Другое / не знаю', 'o:s:0')], [btn('🏠 Меню', 'm')]]); }
function askDesc(chat, st) {
  const n = st.msgs.length, svc = st.svc ? S.find(s => s.id == st.svc).t : 'Другое';
  return screen(chat, st.pm, stepTxt(2, 'описание') + `Услуга: <b>${esc(svc)}</b>\n\n✍ Опишите задачу своими словами: что нужно, для кого, есть ли примеры/макеты.\nМожно прислать <b>несколько сообщений, фото, файлы и голосовые</b>.\n\n${n ? `✅ Получено сообщений: <b>${n}</b>. Добавьте ещё или нажмите «Дальше».` : '<i>Жду ваше сообщение…</i>'}`,
    [...(n ? [[btn('➡ Дальше', 'o:d')]] : []), [btn('❌ Отмена', 'm')]]);
}
const askDeadline = (chat, st) => screen(chat, st.pm, stepTxt(3, 'сроки') + 'Когда нужен результат?', [...Object.entries(DEADLINES).map(([k, v]) => [btn(v, 'o:t:' + k)]), [btn('⬅ Назад', 'o:b:d'), btn('❌ Отмена', 'm')]]);
const askBudget = (chat, st) => screen(chat, st.pm, stepTxt(4, 'бюджет') + 'На какую сумму ориентируетесь?\n<i>Это помогает мне предложить подходящее решение.</i>', [...Object.entries(BUDGETS).map(([k, v]) => [btn(v, 'o:g:' + k)]), [btn('⬅ Назад', 'o:b:t'), btn('❌ Отмена', 'm')]]);
function askSummary(chat, st) {
  const svc = st.svc ? S.find(s => s.id == st.svc).t : 'Другое';
  return screen(chat, st.pm, head('📋', 'Проверьте заявку', 'всё верно?') + `🛠 <b>${esc(svc)}</b>\n⏱ ${DEADLINES[st.deadline]}\n💵 ${BUDGETS[st.budget]}\n📎 Сообщений с описанием: ${st.msgs.length}${st.calc ? '\n🧮 ' + esc(st.calc) : ''}\n\nПосле отправки я сразу увижу заявку, а вы сможете следить за статусом в «🧾 Мои заявки».`,
    [[btn('✅ Отправить заявку', 'o:ok')], [btn('✏ Заполнить заново', 'o:new'), btn('❌ Отмена', 'm')]]);
}
async function createOrder(chat, st) {
  const u = DB.users[chat], o = { id: ++DB.seq, uid: String(chat), svc: st.svc, deadline: st.deadline, budget: st.budget, calc: st.calc || '', texts: st.texts || [], status: 'new', created: Date.now(), hist: [{ s: 'new', at: Date.now() }], rating: null };
  DB.orders.push(o); save();
  if (ADMIN) { const r = await send(ADMIN, orderCard(o), orderKb(o)); if (r.ok) { DB.relay[r.result.message_id] = { uid: o.uid, order: o.id }; o.card = r.result.message_id; }
    for (const m of st.msgs) { const c = await copy(ADMIN, chat, m, { reply_to_message_id: o.card }); if (c.ok) DB.relay[c.result.message_id] = { uid: o.uid, order: o.id }; } save(); }
  return o;
}
const orderCard = o => { const u = DB.users[o.uid] || {}, svc = o.svc ? S.find(s => s.id == o.svc).t : 'Другое', [e, t] = STAT[o.status];
  return `${e} <b>Заявка #${o.id}</b> · ${t}\n${LINE}\n🛠 <b>${esc(svc)}</b>\n👤 ${esc(u.name || '—')} ${u.username ? '@' + u.username : ''} <code>${o.uid}</code>\n⏱ ${DEADLINES[o.deadline]}   💵 ${BUDGETS[o.budget]}\n${o.calc ? '🧮 ' + esc(o.calc) + '\n' : ''}🕒 ${when(o.created)}${o.rating ? '\n⭐ Оценка клиента: ' + o.rating + '/5' : ''}\n\n<i>Ответьте реплаем на любое сообщение по заявке — оно уйдёт клиенту.</i>`; };
const orderKb = o => [[btn('✅ Принять', `a:s:${o.id}:accepted`), btn('🔨 В работу', `a:s:${o.id}:progress`)], [btn('🧾 Счёт', `a:s:${o.id}:invoiced`), btn('🎉 Готово', `a:s:${o.id}:done`), btn('❌ Отклонить', `a:s:${o.id}:rejected`)], [btn('💬 Написать клиенту', `a:w:${o.uid}:${o.id}`)]];
const userNote = { accepted: id => `✅ <b>Заявка #${id} принята.</b>\nСкоро свяжусь, чтобы уточнить детали.`, progress: id => `🔨 <b>Работа над заявкой #${id} началась.</b>\nБуду держать вас в курсе.`,
  invoiced: id => `🧾 <b>По заявке #${id} выставлен счёт.</b>\nОплата в боте скоро подключится — пока реквизиты пришлю лично в этом чате.`, rejected: id => `❌ <b>Заявка #${id} отклонена.</b>\nК сожалению, не смогу взяться. Причину напишу отдельным сообщением.` };

/* ───────────── мои заявки ───────────── */
function myOrders(chat, mid) {
  const list = DB.orders.filter(o => o.uid === String(chat)).slice(-8).reverse();
  if (!list.length) return screen(chat, mid, head('🧾', 'Мои заявки') + 'Пока нет заявок. Оформить первую — одна минута 👇', [[btn('⚡ Оформить заявку', 'o:new')], [btn('🏠 Меню', 'm')]]);
  return screen(chat, mid, head('🧾', 'Мои заявки', 'нажмите, чтобы открыть') + list.map(o => `${STAT[o.status][0]} <b>#${o.id}</b> ${esc(o.svc ? S.find(s => s.id == o.svc).t : 'Другое')} — ${STAT[o.status][1]}`).join('\n'),
    [...list.map(o => [btn(`${STAT[o.status][0]} #${o.id} · ${o.svc ? S.find(s => s.id == o.svc).t : 'Другое'}`, 'mo:' + o.id)]), [btn('🏠 Меню', 'm')]]);
}
function myOrder(chat, mid, id) {
  const o = DB.orders.find(x => x.id == id && x.uid === String(chat)); if (!o) return myOrders(chat, mid);
  const tl = o.hist.map(h => `${STAT[h.s][0]} ${STAT[h.s][1]} — ${when(h.at)}`).join('\n');
  return screen(chat, mid, head(STAT[o.status][0], 'Заявка #' + o.id, STAT[o.status][1]) + `🛠 <b>${esc(o.svc ? S.find(s => s.id == o.svc).t : 'Другое')}</b>\n⏱ ${DEADLINES[o.deadline]}   💵 ${BUDGETS[o.budget]}\n\n<b>История</b>\n${tl}`,
    [[btn('💬 Написать по заявке', 'ch:o' + o.id)], ...(o.status === 'invoiced' ? [[btn('💳 Как оплатить', 'pay')]] : []), ...(o.status === 'done' && !o.rating ? [[btn('⭐ Оценить работу', 'rt:' + o.id)]] : []), back('my')]);
}

/* ───────────── диалог со мной ───────────── */
function startChat(chat, mid, ctx) {
  ST.set(chat, { k: 'chat', ctx: ctx || '', last: 0 });
  const note = ctx ? `\n📌 Тема: <b>${esc(ctx)}</b>` : '';
  return screen(chat, mid, head('💬', 'Связь с разработчиком', 'я отвечаю лично') + `Напишите сообщение — можно с <b>фото, файлами и голосовыми</b>. Я отвечу прямо здесь.${note}\n\n⏱ Обычно отвечаю в течение дня.\n<i>Для развёрнутых и индивидуальных вопросов есть и личный Telegram — в «📞 Контакты».</i>`,
    [[btn('✅ Завершить диалог', 'm')]]);
}
async function userToAdmin(chat, msg, st) {
  const u = DB.users[chat];
  if (!ADMIN) return send(chat, '⚠ Сообщение не доставлено: владелец ещё не подключил получение. Напишите в личный Telegram: ' + TG);
  const fresh = Date.now() - (st.last || 0) > 10 * 60 * 1000; st.last = Date.now();
  if (fresh) { const h = await send(ADMIN, `💬 <b>Сообщение от клиента</b>\n${LINE}\n👤 ${esc(u.name)} ${u.username ? '@' + u.username : ''} <code>${chat}</code>${st.ctx ? '\n📌 ' + esc(st.ctx) : ''}\n\n<i>Ответьте реплаем — уйдёт клиенту.</i>`, [[btn('💬 Ответить', `a:w:${chat}:0`), btn('👤 Профиль', `a:u:${chat}`)]]);
    if (h.ok) DB.relay[h.result.message_id] = { uid: String(chat) }; }
  const c = await copy(ADMIN, chat, msg.message_id); if (c.ok) DB.relay[c.result.message_id] = { uid: String(chat) };
  save(); react(chat, msg.message_id);
  if (fresh) await send(chat, '✅ <b>Принято!</b> Передал разработчику. Ответ придёт сюда же.', [[btn('🏠 Меню', 'm')]]);
}
async function adminToUser(uid, msg, order) {
  const tail = [[btn('✍ Ответить', 'ch'), btn('🏠 Меню', 'm')]];
  const cap = '💬 <b>Ответ разработчика</b>' + (order ? ` · заявка #${order}` : '');
  const r = msg.text ? await send(uid, `${cap}\n${LINE}\n${esc(msg.text)}`, tail)
    : await copy(uid, ADMIN, msg.message_id, { caption: cap + (msg.caption ? '\n\n' + esc(msg.caption) : ''), parse_mode: 'HTML', reply_markup: { inline_keyboard: tail } });
  react(ADMIN, msg.message_id, r.ok ? '👌' : '👎');
  if (!r.ok) send(ADMIN, '⚠ Не доставлено: пользователь, возможно, заблокировал бота.');
}

/* ───────────── прочие экраны ───────────── */
const faqList = (chat, mid) => screen(chat, mid, head('❓', 'Частые вопросы') + 'Выберите вопрос:', [...FAQ.map((f, i) => [btn(f[0], 'fq:' + i)]), [btn('💬 Не нашли ответ?', 'ch'), btn('🏠 Меню', 'm')]]);
const faqItem = (chat, mid, i) => screen(chat, mid, head('❓', FAQ[i][0].replace(/^\S+\s/, '')) + FAQ[i][1], [[btn('💬 Задать свой вопрос', 'ch')], back('fq')]);
const portfolio = (chat, mid) => screen(chat, mid, head('📁', 'Портфолио', 'работает, а не просто выглядит') + 'Рабочие сайты и приложения — откройте, потрогайте, установите. На сайте у каждого проекта есть подробный разбор и анимация работы.', [...PROJECTS.map(([t, u]) => [url(t, u)]), [btn('🏠 Меню', 'm')]]);
const contacts = (chat, mid) => screen(chat, mid, head('📞', 'Контакты') + `🤖 <b>Заказ, оплата, вопросы</b> — прямо здесь, в боте.\n\n✈ <b>Личный Telegram</b> — только для развёрнутых и индивидуальных вопросов.\n✉ Почта: <code>${MAIL}</code>`,
  [[btn('💬 Написать через бота', 'ch')], [url('✈ Личный Telegram', TG)], [url('🌐 Сайт', SITE + '01-progfarm/progfarm.html'), url('⌥ GitHub', GH)], [btn('🏠 Меню', 'm')]]);
const payInfo = (chat, mid) => screen(chat, mid, head('💳', 'Оплата') + 'Приём платежей в боте подключается. Сейчас, когда заявка согласована и выставлен счёт, я пришлю реквизиты прямо в этот чат.\n\nОбычно: <b>50% предоплата</b>, остальное после сдачи.', [[btn('💬 Спросить про оплату', 'ch:pay')], [btn('🏠 Меню', 'm')]]);

/* ───────────── админ-панель ───────────── */
function adminPanel(chat, mid) {
  const o = DB.orders, open = o.filter(x => !['done', 'rejected'].includes(x.status)), n = Object.keys(DB.users).length;
  const by = Object.keys(STAT).map(k => `${STAT[k][0]} ${STAT[k][1]}: <b>${o.filter(x => x.status === k).length}</b>`).join('\n');
  const rated = o.filter(x => x.rating), avg = rated.length ? (rated.reduce((a, x) => a + x.rating, 0) / rated.length).toFixed(1) : '—';
  return screen(chat, mid, head('🔐', 'Админ-панель') + `👥 Пользователей: <b>${n}</b>\n🧾 Заявок всего: <b>${o.length}</b>  ·  открытых: <b>${open.length}</b>\n⭐ Средняя оценка: <b>${avg}</b>\n\n${by}`,
    [[btn(`🧾 Открытые заявки (${open.length})`, 'ad:o')], [btn('📣 Рассылка', 'ad:b')], [btn('🏠 Меню', 'm')]]);
}
const adminOrders = (chat, mid) => { const open = DB.orders.filter(x => !['done', 'rejected'].includes(x.status)).slice(-10).reverse();
  return screen(chat, mid, head('🧾', 'Открытые заявки') + (open.length ? 'Нажмите, чтобы открыть карточку:' : 'Открытых заявок нет 🎉'), [...open.map(o => [btn(`${STAT[o.status][0]} #${o.id} · ${(DB.users[o.uid] || {}).name || o.uid} · ${o.svc ? S.find(s => s.id == o.svc).t : 'Другое'}`, 'ad:c:' + o.id)]), [btn('⬅ Панель', 'ad')]]); };

/* ───────────── роутер ───────────── */
async function onCallback(q) {
  const chat = String(q.message.chat.id), mid = q.message.message_id, d = q.data, p = d.split(':');
  const ok = (text, alert) => api('answerCallbackQuery', { callback_query_id: q.id, text, show_alert: !!alert });
  touch(q.from, chat);
  const st = ST.get(chat);
  if (d === 'm') { ST.delete(chat); ok(); return showMenu(chat, mid); }
  if (d === 'sv') { ok(); return svcCats(chat, mid); }
  if (p[0] === 'sc') { ok(); return svcList(chat, mid, +p[1]); }
  if (p[0] === 'sv') { ok(); return svcCard(chat, mid, S.find(s => s.id == p[1])); }
  if (d === 'ca') { ok(); return calcPick(chat, mid); }
  if (p[0] === 'cc') { ok(); return calcCat(chat, mid, +p[1]); }
  if (p[0] === 'c') { ok(); if (p[1] === 's') return calcCx(chat, mid, p[2]); if (p[1] === 'x') return calcUr(chat, mid, p[2], +p[3]); if (p[1] === 'r') return calcRes(chat, mid, p[2], +p[3], +p[4]); }
  if (d === 'pf') { ok(); return portfolio(chat, mid); }
  if (d === 'fq') { ok(); return faqList(chat, mid); }
  if (p[0] === 'fq') { ok(); return faqItem(chat, mid, +p[1]); }
  if (d === 'ct') { ok(); return contacts(chat, mid); }
  if (d === 'pay') { ok(); return payInfo(chat, mid); }
  if (d === 'my') { ok(); return myOrders(chat, mid); }
  if (p[0] === 'mo') { ok(); return myOrder(chat, mid, p[1]); }
  if (p[0] === 'ch' && st && st.k === 'pend') { ST.set(chat, { k: 'chat', ctx: '', last: 0 }); await userToAdmin(chat, { message_id: st.mid }, ST.get(chat)); ok('Отправлено ✅'); return showMenu(chat, mid); }
  if (p[0] === 'ch') { ok(); const c = p[1] || ''; const ctx = c === 'pay' ? 'Вопрос про оплату' : c[0] === 's' ? 'Услуга: ' + S.find(s => s.id == c.slice(1)).t : c[0] === 'o' ? 'Заявка #' + c.slice(1) : ''; return startChat(chat, mid, ctx); }
  if (p[0] === 'rt') { ok(); return screen(chat, mid, head('⭐', 'Оцените работу', 'заявка #' + p[1]) + 'Как вам результат? Ваша оценка помогает мне становиться лучше.', [[1, 2, 3, 4, 5].map(n => btn('⭐' + n, `r:${p[1]}:${n}`))]); }
  if (p[0] === 'r') { const o = DB.orders.find(x => x.id == p[1] && x.uid === chat); if (!o) return ok(); o.rating = +p[2]; save(); ok('Спасибо! ❤');
    if (ADMIN) send(ADMIN, `⭐ <b>Оценка ${o.rating}/5</b> по заявке #${o.id} от ${esc(DB.users[chat].name)}`);
    return screen(chat, mid, head('🙏', 'Спасибо за оценку!') + `Вы поставили <b>${'⭐'.repeat(o.rating)}</b>.\n\nЕсли хотите — напишите пару слов отзывом, мне это очень важно.`, [[btn('✍ Написать отзыв', 'ch:o' + o.id)], [btn('🏠 Меню', 'm')]]); }

  /* заявка */
  if (d === 'o:new') { ok(); const pend = st && st.k === 'pend'; ST.set(chat, { k: 'o', step: 'svc', msgs: pend ? [st.mid] : [], texts: [], pm: mid, calc: st && st.calc }); return askSvc(chat, mid); }
  if (p[0] === 'o') {
    const s = ST.get(chat);
    if (p[1] === 's' || p[1] === 'c') { ok(); const id = +p[2], calc = p[1] === 'c' ? (() => { const sv = S.find(x => x.id == id), lo = Math.round(sv.p * CX[+p[3]][1] * (+p[4] ? 1.25 : 1) / 100) * 100; return `Расчёт в боте: «${CX[+p[3]][0]}»${+p[4] ? ', срочно' : ''}, ориентир от ${rub(lo)}`; })() : (s && s.calc);
      const n = { k: 'o', step: 'desc', svc: id || 0, msgs: (s && s.k === 'o' && s.msgs) || [], texts: [], pm: mid, calc }; ST.set(chat, n); return askDesc(chat, n); }
    if (!s || s.k !== 'o') { ok('Заявка устарела — начнём заново', true); return showMenu(chat, mid); }
    ok();
    if (p[1] === 'd') { s.step = 'deadline'; return askDeadline(chat, s); }
    if (p[1] === 't') { s.deadline = p[2]; s.step = 'budget'; return askBudget(chat, s); }
    if (p[1] === 'g') { s.budget = p[2]; s.step = 'sum'; return askSummary(chat, s); }
    if (p[1] === 'b') { if (p[2] === 'd') { s.step = 'desc'; return askDesc(chat, s); } s.step = 'deadline'; return askDeadline(chat, s); }
    if (p[1] === 'ok') { const o = await createOrder(chat, s); ST.delete(chat);
      return screen(chat, mid, head('✅', 'Заявка #' + o.id + ' отправлена', 'статус: 🆕 новая') + 'Я уже вижу её. Что дальше:\n\n1️⃣ Посмотрю задачу и свяжусь для уточнения\n2️⃣ Назову точную цену и срок\n3️⃣ Согласуем и приступлю к работе\n\nСтатус заявки обновляется здесь, в боте — я пришлю уведомление.',
        [[btn('🧾 К заявке', 'mo:' + o.id)], [btn('💬 Дописать сообщение', 'ch:o' + o.id)], [btn('🏠 Меню', 'm')]]); }
  }

  /* админ */
  if (isAdmin(chat) && (p[0] === 'ad' || p[0] === 'a')) {
    ok();
    if (d === 'ad') return adminPanel(chat, mid);
    if (d === 'ad:o') return adminOrders(chat, mid);
    if (d === 'ad:b') { AST.set(chat, { k: 'bc' }); return screen(chat, mid, head('📣', 'Рассылка') + 'Пришлите <b>текст</b> одним сообщением — я покажу превью перед отправкой всем пользователям.\n/cancel — отмена.', [[btn('⬅ Панель', 'ad')]]); }
    if (p[0] === 'ad' && p[1] === 'c') { const o = DB.orders.find(x => x.id == p[2]); return o ? send(chat, orderCard(o), orderKb(o)) : null; }
    if (p[0] === 'ad' && p[1] === 'bc') { const a = AST.get(chat); if (!a || !a.text) return; AST.delete(chat); let sent = 0; for (const u of Object.values(DB.users)) { const r = await send(u.id, a.text); if (r.ok) sent++; await sleep(60); } return screen(chat, mid, head('📣', 'Рассылка завершена') + `Доставлено: <b>${sent}</b> из ${Object.keys(DB.users).length}`, [[btn('⬅ Панель', 'ad')]]); }
    if (p[0] === 'a' && p[1] === 's') { const o = DB.orders.find(x => x.id == p[2]); if (!o || !STAT[p[3]]) return; o.status = p[3]; o.hist.push({ s: p[3], at: Date.now() }); save();
      api('editMessageText', { chat_id: chat, message_id: mid, text: orderCard(o), parse_mode: 'HTML', reply_markup: { inline_keyboard: orderKb(o) } });
      if (o.status === 'done') return send(o.uid, `🎉 <b>Заявка #${o.id} выполнена!</b>\nСпасибо, что выбрали ProgFarm. Оцените, пожалуйста, работу:`, [[1, 2, 3, 4, 5].map(n => btn('⭐' + n, `r:${o.id}:${n}`))]);
      return send(o.uid, userNote[o.status](o.id), [[btn('🧾 Открыть заявку', 'mo:' + o.id)], ...(o.status === 'invoiced' ? [[btn('💳 Как оплатить', 'pay')]] : [])]); }
    if (p[0] === 'a' && p[1] === 'w') { AST.set(chat, { k: 'to', uid: p[2], order: +p[3] || 0 }); const u = DB.users[p[2]] || {}; return send(chat, `✍ Пишете клиенту <b>${esc(u.name || p[2])}</b>${+p[3] ? ' (заявка #' + p[3] + ')' : ''}. Всё, что отправите, уйдёт ему — текст, фото, файлы, голосовые.\n/cancel — закончить.`); }
    if (p[0] === 'a' && p[1] === 'u') { const u = DB.users[p[2]]; if (!u) return; const os = DB.orders.filter(o => o.uid === p[2]); return send(chat, `👤 <b>${esc(u.name)}</b> ${u.username ? '@' + u.username : ''}\nid <code>${u.id}</code>\nС нами с ${when(u.joined)} · заявок: ${os.length}${os.length ? '\n' + os.map(o => `${STAT[o.status][0]} #${o.id}`).join('  ') : ''}`); }
  }
  ok();
}

async function onMessage(m) {
  const chat = String(m.chat.id), text = m.text || '';
  if (m.chat.type !== 'private') return;
  const { u, fresh } = touch(m.from, chat);
  const cmd = text.startsWith('/') ? text.split(/[\s@]/)[0].toLowerCase() : '';

  /* админ: ответы клиентам */
  if (isAdmin(chat)) {
    if (cmd === '/cancel') { AST.delete(chat); return send(chat, '✅ Режим сброшен.'); }
    const a = AST.get(chat);
    if (a && a.k === 'bc' && text && !cmd) { a.text = text; return send(chat, `📣 <b>Превью рассылки</b>\n${LINE}\n${text}\n${LINE}\nОтправить всем (${Object.keys(DB.users).length})?`, [[btn('✅ Отправить', 'ad:bc'), btn('❌ Отмена', 'ad')]]); }
    if (m.reply_to_message && DB.relay[m.reply_to_message.message_id] && !cmd) { const r = DB.relay[m.reply_to_message.message_id]; return adminToUser(r.uid, m, r.order); }
    if (a && a.k === 'to' && !cmd && !text.startsWith('🏠')) return adminToUser(a.uid, m, a.order);
    if (cmd === '/admin' || cmd === '/stats') return adminPanel(chat);
    if (cmd === '/orders') return adminOrders(chat);
    if (cmd === '/broadcast') { AST.set(chat, { k: 'bc' }); return send(chat, '📣 Пришлите текст рассылки одним сообщением (/cancel — отмена).'); }
  }

  if (cmd === '/myid') return send(chat, `Ваш chat id: <code>${chat}</code>`);
  if (cmd === '/start') {
    ST.delete(chat); const pl = (text.split(' ')[1] || '');
    if (fresh && ADMIN && !isAdmin(chat)) send(ADMIN, `👤 <b>Новый пользователь</b>: ${esc(u.name)} ${u.username ? '@' + u.username : ''}`, null, { disable_notification: true });
    if (fresh || !u.greeted) { u.greeted = true; save(); await api('sendChatAction', { chat_id: chat, action: 'upload_photo' }); await sendBanner(chat); }
    u.visits = (u.visits || 0) + 1; save();
    if (/^svc\d+$/.test(pl)) return svcCard(chat, null, S.find(s => s.id == pl.slice(3)) || S[0]);
    if (pl === 'order') { ST.set(chat, { k: 'o', step: 'svc', msgs: [], texts: [] }); const r = await askSvc(chat, null); ST.get(chat).pm = r.result && r.result.message_id; return; }
    if (pl === 'calc') return calcPick(chat, null);
    return showMenu(chat, null);
  }
  if (cmd === '/menu' || text === '🏠 Меню') { ST.delete(chat); return showMenu(chat, null); }
  if (cmd === '/order') { ST.set(chat, { k: 'o', step: 'svc', msgs: [], texts: [] }); const r = await askSvc(chat, null); ST.get(chat).pm = r.result && r.result.message_id; return; }
  if (cmd === '/orders') return myOrders(chat, null);
  if (cmd === '/calc') return calcPick(chat, null);
  if (cmd === '/faq') return faqList(chat, null);
  if (cmd === '/contact' || text === '💬 Связаться') return startChat(chat, null, '');
  if (cmd === '/help') return send(chat, head('ℹ', 'Команды') + '/menu — главное меню\n/order — оформить заявку\n/orders — мои заявки\n/calc — калькулятор\n/faq — вопросы\n/contact — связаться со мной\n/cancel — отменить текущее действие', [[btn('🏠 Меню', 'm')]]);
  if (cmd === '/cancel') { ST.delete(chat); return send(chat, '✅ Отменено.', [[btn('🏠 Меню', 'm')]]); }

  const st = ST.get(chat);
  if (st && st.k === 'chat') return userToAdmin(chat, m, st);
  if (st && st.k === 'o' && st.step === 'desc') { st.msgs.push(m.message_id); if (text) st.texts.push(text); react(chat, m.message_id); return askDesc(chat, st); }
  if (cmd) return send(chat, 'Не знаю такой команды. Вот главное меню 👇', menuKb(chat));
  // без контекста: считаем, что человек хочет что-то сказать — предлагаем варианты
  return send(chat, `Получил ✉\nЧто сделать с этим сообщением?`, [[btn('💬 Отправить разработчику', 'ch')], [btn('⚡ Это описание заявки', 'o:new')], [btn('🏠 Меню', 'm')]]).then(r => { ST.set(chat, { k: 'pend', mid: m.message_id }); return r; });
}

/* ───────────── баннер, команды, запуск ───────────── */
const KEYS = { keyboard: [[{ text: '🏠 Меню' }, { text: '💬 Связаться' }]], resize_keyboard: true, is_persistent: true };
async function sendBanner(chat) {
  const cap = '🌱 <b>ProgFarm</b> — сайты, боты, приложения и базы данных на заказ.\n<i>Заказ, оплата и связь — прямо в этом чате.</i>';
  if (DB.banner) { const r = await api('sendPhoto', { chat_id: chat, photo: DB.banner, caption: cap, parse_mode: 'HTML', reply_markup: KEYS }); if (r.ok) return; }
  try { const f = new FormData(); f.append('chat_id', chat); f.append('caption', cap); f.append('parse_mode', 'HTML'); f.append('reply_markup', JSON.stringify(KEYS));
    f.append('photo', new Blob([fs.readFileSync(path.join(__dirname, 'assets', 'banner.png'))], { type: 'image/png' }), 'banner.png');
    const r = await api('sendPhoto', null, f); if (r.ok) { DB.banner = r.result.photo.slice(-1)[0].file_id; save(); } }
  catch { await send(chat, cap, null, { reply_markup: KEYS }); }
}
async function setup() {
  await api('setMyCommands', { commands: [['menu', 'Главное меню'], ['order', 'Оформить заявку'], ['orders', 'Мои заявки'], ['calc', 'Калькулятор стоимости'], ['faq', 'Частые вопросы'], ['contact', 'Связаться с разработчиком'], ['help', 'Помощь']].map(([command, description]) => ({ command, description })) });
  if (ADMIN) await api('setMyCommands', { scope: { type: 'chat', chat_id: +ADMIN }, commands: [['admin', 'Админ-панель'], ['orders', 'Открытые заявки'], ['broadcast', 'Рассылка'], ['cancel', 'Сбросить режим'], ['menu', 'Меню клиента']].map(([command, description]) => ({ command, description })) });
  await api('setMyDescription', { description: 'ProgFarm — сайты, Telegram-боты, приложения и базы данных на заказ. Цены от 1 500 ₽.\n\n🧮 Посчитаю стоимость за минуту\n⚡ Оформите заявку и следите за статусом\n💬 Отвечаю лично, обычно в течение дня' });
  await api('setMyShortDescription', { short_description: 'Сайты, боты и приложения на заказ · от 1 500 ₽ · заявки и связь прямо в чате' });
}

async function main() {
  const me = await api('getMe', {}); if (!me.ok) return console.error('Неверный токен или нет сети');
  console.log(`Бот @${me.result.username} запущен` + (ADMIN ? '' : ' (ADMIN_ID не задан — заявки некуда пересылать)'));
  await setup();
  let offset = DB.offset || 0;
  for (;;) {
    const r = await api('getUpdates', { offset, timeout: 30, allowed_updates: ['message', 'callback_query'] });
    if (!r.ok) { await sleep(3000); continue; }
    for (const u of r.result) {
      offset = u.update_id + 1; DB.offset = offset;
      try { if (u.callback_query) await onCallback(u.callback_query); else if (u.message) await onMessage(u.message); }
      catch (e) { console.error('update', e); }
    }
    save();
  }
}
if (require.main === module) main(); else module.exports = { onMessage, onCallback, ST, AST, DB };
