const { TELEGRAM_BOT_TOKEN } = require('./config');
const { TelegramBot } = require('./base/telegramBot');
const { emergencyHandler: tgHandler } = require('./services/tgHandler');

if (!TELEGRAM_BOT_TOKEN) throw new Error('Needs TELEGRAM_BOT_TOKEN');


console.log('Transferoute_bot initializing...');

(async () => {
    const telegramBot = TelegramBot({ TELEGRAM_BOT_TOKEN, });

    telegramBot.initialize(async (update) => {
        try {
            await tgHandler(telegramBot)(update);
        } catch (err) {
            console.log('tgBotHandler error', err);
            throw err;  // fixme?? NOT!!!
        }
    });
    console.log('Transferoute_bot listenning');
})();  // todo catch?
