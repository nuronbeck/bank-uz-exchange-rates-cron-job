require('dotenv').config();
const axios = require('axios');
const { Telegraf } = require("telegraf");
const _ = require('lodash');

const {
  PUBLISH_RESOURCE_BASE_URL,
  TELEGRAM_BOT_TOKEN,
} = process.env;

const buildMessage = (payload = []) => {
  let telegramPost = payload.reduce((acc, { name = 'bankname', buy = 0, sell = 0 }) => {
    const postMarkup =
    `<strong>${name}:</strong>\n` +
    `<i>💵 Покупка:</i> ${buy} сум\n` +
    `<i>💸 Продажа:</i> ${sell} сум\n`;

    acc = acc + '\n' + postMarkup;
  
    return acc;
  }, '');

  const bestBuy = _.minBy(payload, (obj) => obj.buy);
  const bestSell = _.maxBy(payload, (obj) => obj.sell);

  if(bestBuy?.name && bestSell?.name){
    telegramPost += 
      `\n\n\n<strong>Лучшие на сегодня</strong>\n\n` +
      `<strong>${bestBuy.name}:</strong>\n` +
      `<i>💵 Покупка:</i> ${bestBuy.buy} сум\n\n` +
      `<strong>${bestSell.name}:</strong>\n` +
      `<i>💸 Продажа:</i> ${bestSell.sell} сум\n`;
  }

  return telegramPost;
}

const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

bot.hears('1', async (ctx) => {
  try {
    const { data = [] } = await axios.get(`${PUBLISH_RESOURCE_BASE_URL}/fetch-rates`);
    const sortedList = data.sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB));
    const message = buildMessage(sortedList);

    return ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.log("Error triggering hook => ", error?.message)
    return;
  }
});

bot.launch();