// Каркас Telegram-бота для продаж. Без зависимостей, Node 18+.
// Запуск: BOT_TOKEN=... node bot-template.js
// Что менять: объект `screens` (тексты и кнопки) и `CATALOG` (ваши товары).
const API = `https://api.telegram.org/bot${process.env.BOT_TOKEN}/`;
const call = (m, b) => fetch(API + m, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.json());

const CATALOG = { cat1: ['Букеты', [['Пионы · 25 шт', 3200], ['Розы кустовые', 2400]]], cat2: ['Комнатные', [['Монстера', 1900], ['Фикус', 1400]]] };
const carts = new Map(); // chat_id -> [[название, цена], ...]

const kb = rows => ({ inline_keyboard: rows.map(r => r.map(([text, callback_data]) => ({ text, callback_data }))) });
const screens = {
  menu: () => ['🌿 <b>Добро пожаловать!</b>\nЧто хотите сделать?', kb([[['🛍 Каталог', 'catalog'], ['🛒 Корзина', 'cart']], [['📞 Контакты', 'contacts']]])],
  catalog: () => ['Выберите раздел:', kb([[...Object.entries(CATALOG).map(([id, c]) => [c[0], 'cat:' + id])], [['⬅ Меню', 'menu']]])],
  contacts: () => ['📞 +7 900 000-00-00\n✈ @manager', kb([[['⬅ Меню', 'menu']]])],
  pay: () => ['💳 Оплата скоро подключится. Заказ сохранён, менеджер свяжется с вами.', kb([[['⬅ Меню', 'menu']]])],
};
function cartScreen(chat) {
  const c = carts.get(chat) || [];
  if (!c.length) return ['Корзина пуста.', kb([[['🛍 В каталог', 'catalog']]])];
  return [`🛒 <b>Корзина</b>\n${c.map(x => `• ${x[0]} — ${x[1]} ₽`).join('\n')}\n\nИтого: ${c.reduce((a, x) => a + x[1], 0)} ₽`, kb([[['💳 Оплатить', 'pay'], ['⬅ Меню', 'menu']]])];
}
function route(chat, data) {
  if (data.startsWith('cat:')) { const c = CATALOG[data.slice(4)]; return [`<b>${c[0]}</b>`, kb([...c[1].map(([n, p]) => [[`${n} · ${p} ₽`, `add:${data.slice(4)}:${c[1].findIndex(x => x[0] === n)}`]]), [['⬅ Каталог', 'catalog']]])]; }
  if (data.startsWith('add:')) { const [, id, i] = data.split(':'); const it = CATALOG[id][1][+i]; carts.set(chat, [...(carts.get(chat) || []), it]); return cartScreen(chat); }
  return data === 'cart' ? cartScreen(chat) : (screens[data] || screens.menu)();
}

(async () => {
  let offset = 0;
  for (;;) {
    const { result = [] } = await call('getUpdates', { offset, timeout: 30 });
    for (const u of result) {
      offset = u.update_id + 1;
      if (u.message) { const [text, kbd] = screens.menu(); await call('sendMessage', { chat_id: u.message.chat.id, text, parse_mode: 'HTML', reply_markup: kbd }); }
      if (u.callback_query) {
        const q = u.callback_query, [text, kbd] = route(q.message.chat.id, q.data);
        await call('answerCallbackQuery', { callback_query_id: q.id });
        await call('editMessageText', { chat_id: q.message.chat.id, message_id: q.message.message_id, text, parse_mode: 'HTML', reply_markup: kbd });
      }
    }
  }
})();
