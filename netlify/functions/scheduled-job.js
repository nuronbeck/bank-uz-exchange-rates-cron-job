const { schedule } = require('@netlify/functions');
const axios = require('axios');

// Everyday from Mon-Fri at 10:00
// 0 10 * * 1-5

// Every minute
// * * * * *

const getAreaTime = () => {
  const date = new Date();
  const dateFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.PUBLISH_TIMEZONE || "Europe/London",
      hour12: false,
      hour: 'numeric', minute: 'numeric'
  });

  return dateFormat.format(date);
}

exports.handler = schedule('* * * * *', async (event) => {
  console.log(`Scheduled job is triggered`);

  const AREA_TIME = getAreaTime();
  const PUBLISH_HOOK_URL = process.env.PUBLISH_HOOK_URL;
  const PUBLISH_TIME = process.env.PUBLISH_TIME;

  // Check every minute that matches 10:00
  if(AREA_TIME === PUBLISH_TIME){
    console.log(`Scheduled job running at (${AREA_TIME} / AREA_TIME)...`);

    try {
      await axios.post(PUBLISH_HOOK_URL);
    } catch (error) {
      console.log("Error triggering hook => ", error?.message)
    }
  }

  return {
    statusCode: 200,
    body: 'Ok'
  }
})