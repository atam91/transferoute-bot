const { TELEGRAM_BOT_TOKEN } = require('./config');
const { TelegramBot, helpers: tgHelpers } = require('./base/telegramBot');
const stationsService = require('./services/stations');

if (!TELEGRAM_BOT_TOKEN) throw new Error('Needs TELEGRAM_BOT_TOKEN');


console.log('Transferoute_bot initializing...');

(async () => {
    const telegramBot = TelegramBot({ TELEGRAM_BOT_TOKEN, });

    telegramBot.initialize(async (update) => {
        try {
            if (tgHelpers.getTextFromUpdate(update)) {
                await telegramBot.sendMessage(
                    tgHelpers.getChatIdFromUpdate(update),
                    stationsService.search( tgHelpers.getTextFromUpdate(update) ),
                );
            }
        } catch (err) {
            console.log('tgBotHandler error', err)
        }

    });
    console.log('Transferoute_bot listenning');

    ////////////////////////////////////////////////////////////////////////////

    await stationsService.initialize();

})();  // todo catch?
