require('dotenv').config();

const { TELEGRAM_BOT_TOKEN, } = process.env;

console.log('TG_TOKEN', TELEGRAM_BOT_TOKEN);


module.exports = {
    TELEGRAM_BOT_TOKEN,
};