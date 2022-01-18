const fs = require('fs');

const axios = require('axios').default;

const { TELEGRAM_BOT_TOKEN } = require('./config');  /// TODO check values are setted

console.log('Transferoute_bot starting...');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////// Simple telegram echo bot impl ///////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let currentOffset = 0;
try {
    currentOffset = fs.readFileSync('./data/offset') || 0
} catch (err) {
    if (err.code === 'ENOENT') {
        fs.writeFileSync('./data/offset', '0');
    }
}

const updateCurrentOffset = async (value) => {
    currentOffset = value;
    await fs.promises.writeFile('./data/offset', value.toString());
};
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////

const TG_MESSAGE_LIMIT = 4096;

async function tgSendMessage(chatId, text, options = {}) {
    const sendMessage = text =>
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
            await sendMessage(chunk);
        }
    } else {
        await sendMessage(text);
    }
}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
const CHECK_UPDATES_INTERVAL = 1000;

function tgCheckUpdates() {
    axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${currentOffset}`)
        .then(async response => {
            const updates = response.data.result;

            console.log('updates', updates)

            await Promise.all(updates.map(async update => {
                if (update.message && update.message.text) {
                    await tgSendMessage(update.message.chat.id, update.message.text);
                }

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
tgCheckUpdates();
console.log('Transferoute_bot tgCheckUpdates polling');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
/** const { getAllStations } = require('./dataProviders/stations');

(async () => {
    console.time('getAllStations');
    const stations = await getAllStations();
    console.timeEnd('getAllStations');

    console.log('STATIONS starts here', Object.keys(stations));
})(); **/
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////