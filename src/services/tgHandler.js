const { helpers: tgh } = require('../base/telegramBot');
const raspStationsService = require('./rasp/stations');
const rxdb = require('../rxdb');

raspStationsService.initialize() /// fixme? not pretty
    .then(() => { console.log('raspStationsService initialized'); })
    .catch(err => { console.log('Error during raspStationsService initialization', err); });

rxdb.initialize() /// fixme? not pretty
    .then(() => { console.log('rxdb initialized'); })
    .catch(err => { console.log('Error during rxdb initialization', err); });

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const userStations = (user) => user.get('favoriteStations')
    .map(raspStationsService.getByYandexCode);

const userStationsMessage = (user) => {
    const stations = userStations(user);

    return [
        'Your Stations::'
    ].concat(
        stations.map(stObj =>
            [
                stationObjectToFullNameFormatter(stObj),
                '/drop\\_' + stObj.station.codes.yandex_code,
                '/where\\_' + stObj.station.codes.yandex_code,
            ]
                .join(' ')
        )
    ).join('\n');
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handler = (telegramBot) => async (update) => {
    const db = rxdb.getDb();

    const user = await db.users.findOne({
        selector: {
            userId: tgh.getChatIdFromUpdate(update)
        }
    }).exec();
    console.log('user', user);
    if (!user) {
        await db.users.insert({
            id: tgh.getChatIdFromUpdate(update).toString(),
            userId: tgh.getChatIdFromUpdate(update),
        })
    } else {
        console.log('id', user.get('id'));
        console.log('uId', user.get('userId'));
        console.log('favoriteStations', user.get('favoriteStations'));
    }

    // console.log('UPDATE', JSON.stringify(update, null, 4));
    if (!tgh.getTextFromUpdate(update)) return;

    if (tgh.getTextFromUpdate(update).startsWith('/add')) {
        const stObj = raspStationsService.getByYandexCode(getYandexCodeFromContainingUpdate(update));

        if (stObj) {
            await user.update({
                $push: {
                    favoriteStations: stObj.station.codes.yandex_code,
                }
            });

            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                stationObjectToFullNameFormatter(stObj) + '\n' + userStationsMessage(user)
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Could not find any station to add' + '\n' + userStationsMessage(user)
            );
        }
    } else if (tgh.getTextFromUpdate(update).startsWith('/drop')) {
        const stObj = raspStationsService.getByYandexCode(getYandexCodeFromContainingUpdate(update));

        if (stObj) {
            await user.update({
                $set: {
                    favoriteStations: user.get('favoriteStations').filter(code => code !== stObj.station.codes.yandex_code),
                }
            });

            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                userStationsMessage(user)
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Could not find any station to drop' + '\n' + userStationsMessage(user)
        );
        }
    } else if (tgh.getTextFromUpdate(update).startsWith('/where')) {
        const stObj = raspStationsService.getByYandexCode(getYandexCodeFromContainingUpdate(update));

        if (stObj && stObj.station.latitude && stObj.station.longitude) {
            await telegramBot.sendLocation(
                tgh.getChatIdFromUpdate(update),
                {
                    latitude: stObj.station.latitude,
                    longitude: stObj.station.longitude,
                }
            );
        } else if (!stObj.station.latitude || !stObj.station.longitude) {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '🤷🏼‍♂️ Destination unknown'
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
                '🤷🏼‍♂️ Could not find any station' + '\n' + userStationsMessage(user)
            );
        }
    }
};


module.exports = {
    handler,
};