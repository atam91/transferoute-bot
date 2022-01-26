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

const stationObjectToFullNameFormatter = ({ country, region, settlement, station }) =>
    [
        TRANSPORT_TYPE_EMOJI_MAP[station.transport_type] || station.transport_type,
        `*${station.title}*`,
        '(' + [ region.title, settlement.title ].filter(v => v).map(v => `__${v}__`).join(' / ') + ')',
    ]
        .join(' ');

const getYandexCodeFromContainingUpdate = update => tgh.getTextFromUpdate(update).split('_')[1];

const handler = (telegramBot) => async (update) => {
    // console.log('UPDATE', JSON.stringify(update, null, 4));
    if (!tgh.getTextFromUpdate(update)) return;

    if (tgh.getTextFromUpdate(update).startsWith('/add')) {
        const stObj = raspStationsService.getByYandexCode(getYandexCodeFromContainingUpdate(update));

        if (stObj) {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                stationObjectToFullNameFormatter(stObj)
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Could not find any station'
            );
        }
    } else if (tgh.getTextFromUpdate(update).startsWith('/where')) {
        const stObj = raspStationsService.getByYandexCode(getYandexCodeFromContainingUpdate(update));

        if (stObj) {
            await telegramBot.sendLocation(
                tgh.getChatIdFromUpdate(update),
                {
                    latitude: stObj.station.latitude,
                    longitude: stObj.station.longitude,
                }
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Could not find any station'
            );
        }
    } else {
        const stationObjects = raspStationsService.search( tgh.getTextFromUpdate(update) );
        ///console.log('search result', stationObjects);

        if (stationObjects.length) {
            const message = stationObjects
                .map(stObj =>
                    [
                        stationObjectToFullNameFormatter(stObj),
                        '/add\\_' + stObj.station.codes.yandex_code,
                        '/where\\_' + stObj.station.codes.yandex_code,
                    ]
                    .join(' ')
                )
                .join('\n');

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