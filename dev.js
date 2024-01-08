require('dotenv').config();
const axios = require('axios');
const { Telegraf } = require("telegraf");
const { toNumber, minBy, maxBy } = require('lodash');

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

  const bestBuy = minBy(payload, ({ buy }) => toNumber(buy.replace(/ /g,'')));
  const bestSell = maxBy(payload, ({ sell }) => toNumber(sell.replace(/ /g,'')));

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
    const filteredActiveValues = data.filter(({ buy, sell }) => {
      return toNumber(buy.replace(/ /g,'')) > 10000 && toNumber(sell.replace(/ /g,'')) > 10000;
    });

    const sortedList = filteredActiveValues.sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB));
    const message = buildMessage(sortedList);

    return ctx.reply(message, { parse_mode: 'HTML' })
  } catch (error) {
    console.log("Error triggering hook => ", error?.message)
    return;
  }
});

bot.launch();
console.log('Bot started');