const { schedule } = require('@netlify/functions');
const axios = require('axios');
const { Telegraf } = require("telegraf");

const {
  PUBLISH_RESOURCE_BASE_URL,
  PUBLISH_TIMEZONE,
  PUBLISH_TIME,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHANNEL
} = process.env;

// Everyday from Mon-Fri at 10:00 (Uses server timezone)
// 0 10 * * 1-5

// Every minute
// * * * * *

const getAreaTime = () => {
  const date = new Date();
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: PUBLISH_TIMEZONE || "Europe/London",
      hour12: false,
      hour: 'numeric', minute: 'numeric'
  });

  return dateFormat.format(date);
}

const checkResourceHealth = async () => {
  try {
    // Check every 5 minutes
    if(new Date().getMinutes() % 5 === 0){
      await axios.get(`${PUBLISH_RESOURCE_BASE_URL}/health`);
    }
  } catch (error) {
    console.log("Resourse is down! Health error => ", error?.message);
  }
}

const autoPublishChannel = (payload = []) => {
  const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

  const telegramPost = payload.reduce((acc, { name = 'bankname', buy = 0, sell = 0 }) => {
    const postMarkup =
    `<strong>${name}:</strong>\n` +
    `<i>💵 Покупка:</i> ${buy} сум\n` +
    `<i>💸 Продажа:</i> ${sell} сум\n`;

    acc = acc + '\n\n' + postMarkup;
  
    return acc;
  }, '');

  

  return bot.telegram.sendMessage(
    TELEGRAM_CHANNEL, telegramPost, { parse_mode: 'HTML'}
  );
}

exports.handler = schedule('* * * * *', async (event) => {
  console.log(`Scheduled job is triggered`);

  const AREA_TIME = getAreaTime();
  await checkResourceHealth();

  // Check every minute that matches PUBLISH_TIME
  if(AREA_TIME === PUBLISH_TIME){
    console.log(`Scheduled job running at (${AREA_TIME} / AREA_TIME)...`);

    try {
      const { data = [] } = await axios.get(`${PUBLISH_RESOURCE_BASE_URL}/fetch-rates`);
      await autoPublishChannel(data.sort(({ name: nameA }, { name: nameB }) => nameA.localeCompare(nameB)));
    } catch (error) {
      console.log("Error triggering hook => ", error?.message)
    }
  }

  return {
    statusCode: 200,
    body: 'Ok'
  }
})