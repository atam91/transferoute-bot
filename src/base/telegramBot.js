const fs = require('fs');

const axios = require('axios').default;


function TelegramBot (options = {}) {
    const {
        TELEGRAM_BOT_TOKEN,
        OFFSET_FILE_PATH = './data/offset',
        CHECK_UPDATES_INTERVAL = 1000,            /// todo setCheckUpdates
    } = options;

    if (!TELEGRAM_BOT_TOKEN) throw new Error('Need TELEGRAM_BOT_TOKEN');


    ////////////////////////////// Offset //////////////////////////////////////////////////////////////////////////////
    let currentOffset = 0;
    try {
        currentOffset = fs.readFileSync(OFFSET_FILE_PATH) || 0
    } catch (err) {
        if (err.code === 'ENOENT') {
            fs.writeFileSync(OFFSET_FILE_PATH, '0');
        }
    }

    const updateCurrentOffset = async (value) => {
        currentOffset = value;
        await fs.promises.writeFile(OFFSET_FILE_PATH, value.toString());
    };

    /////////////////////////// SendMessage ////////////////////////////////////////////////////////////////////////////

    const TG_MESSAGE_LIMIT = 4096;

    async function sendMessage(chatId, text, options = {}) {
        const _sendMessage = text =>
            axios.post(
                `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
                {
                    chat_id: chatId,
                    parse_mode: 'Markdown',
                    text,
                    reply_markup: options.keyboard
                        ? {
                            resize_keyboard: true,
                            one_time_keyboard: true,
                            keyboard: options.keyboard,
                        }
                        : { remove_keyboard: true },
                }
            )
                .catch(function (error) {
                    console.log('sendMessage AXIOS ERROR:' + error);
                    console.log('RESPONSE DATA:', error.response.data);
                });

        if (text.length > TG_MESSAGE_LIMIT) {
            const chunks = [ '' ];
            text.split('\n').forEach(line => {
                const lastChunk = chunks[chunks.length - 1];
                if ((lastChunk + '\n' + line).length < TG_MESSAGE_LIMIT) {
                    chunks[chunks.length - 1] = lastChunk + '\n' + line;
                } else {
                    chunks.push(line);
                }
            });

            for (chunk of chunks) {
                await _sendMessage(chunk);
            }
        } else {
            await _sendMessage(text);
        }
    }

    /////////////////////////////////////// CheckUpdates ///////////////////////////////////////////////////////////////
    function listen(handler = () => {}) {
        axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${currentOffset}`)
            .then(async response => {
                const updates = response.data.result;

                console.log('updates', updates)

                await Promise.all(updates.map(async update => {
                    await handler(update);

                    await updateCurrentOffset(update.update_id + 1);
                }));
            })
            .catch(function (error) {
                console.log('tgCheckUpdates ERROR:' + error);
                error.response && console.log('RESPONSE DATA:', error.response.data);
            })
            .finally(() => {
                setTimeout(tgCheckUpdates, CHECK_UPDATES_INTERVAL);
            });
    }


    return {
        sendMessage,
        listen,
    };
}





const getChatIdFromUpdate = update => update.message.chat.id;

const getTextFromUpdate = update => update.message && update.message.text;


module.exports = {
    TelegramBot,
    helpers: {
        getChatIdFromUpdate,
        getTextFromUpdate,
    },
};
