const { helpers: tgh } = require('../base/telegramBot');
const raspStationsService = require('./rasp/stations');

raspStationsService.initialize() /// fixme? not pretty
    .then(() => { console.log('raspStationsService initialized'); })
    .catch(err => { console.log('Error during raspStationsService initialization', err); });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const TRANSPORT_TYPE_EMOJI_MAP = {
    plane: '✈',
    train: '🚅',
    suburban: '🚇',
    bus: '🚌',
    water: '🚤',
    helicopter: '🚁',
};

const handler = (telegramBot) => async (update) => {
    if (tgh.getTextFromUpdate(update)) {
        const objs = raspStationsService.search( tgh.getTextFromUpdate(update) );
        ///console.log('search result', objs);

        if (objs.length) {
            const message = objs
                .map(
                    ({ country, region, settlement, station }) => [
                        TRANSPORT_TYPE_EMOJI_MAP[station.transport_type] || station.transport_type,
                        `*${station.title}*`,
                        '(' + [ region.title, settlement.title ].filter(v => v).map(v => `__${v}__`).join(' / ') + ')',
                    ]
                    .join(' ')
                )
                .join('\n');

            /// return station.transport_type + ' ' + station.title + ' (*' + settlement.title +'*)'

            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                message
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Could not find any station'
            );
        }
    }
};


module.exports = {
    handler,
};