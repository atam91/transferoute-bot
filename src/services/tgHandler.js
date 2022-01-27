const { helpers: tgh } = require('../base/telegramBot');
const raspStationsService = require('./rasp/stations');
const rxdb = require('../rxdb');
const messagesService = require('./messages');

raspStationsService.initialize() /// fixme? not pretty
    .then(() => { console.log('raspStationsService initialized'); })
    .catch(err => { console.log('Error during raspStationsService initialization', err); });

rxdb.initialize() /// fixme? not pretty
    .then(() => { console.log('rxdb initialized'); })
    .catch(err => { console.log('Error during rxdb initialization', err); });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getYandexCodeFromContainingUpdate = update => tgh.getTextFromUpdate(update).split('_')[1];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const handler = (telegramBot) => async (update) => {
    const db = rxdb.getDb();

    const user = await db.users.findOne({
        selector: {
            userId: tgh.getChatIdFromUpdate(update)
        }
    }).exec();
    ///console.log('USER', user);
    if (!user) {
        await db.users.insert({
            id: tgh.getChatIdFromUpdate(update).toString(),
            userId: tgh.getChatIdFromUpdate(update),
        })
    } else {
        /* console.log('id', user.get('id'));
        console.log('uId', user.get('userId'));
        console.log('favoriteStations', user.get('favoriteStations'));
        const filters = user.get('filters');
        console.log('filters', filters);
        console.log('filters.denyTransportType', filters.denyTransportType);
        console.log('filters.geolocation', filters.geolocation); */
    }

    /*await user.update({
        $push: {
            'filters.denyTransportType': 'jkl',
        }
    });*/

    /*await user.update({
        $set: {
            'filters.denyTransportType': undefined,
        }
    });*/

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
                messagesService.stationAdded({ stObj, user })
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                messagesService.stationNotFoundDueManipulation({ user })
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
                messagesService.stationDropped({ stObj, user })
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                messagesService.stationNotFoundDueManipulation({ user })
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
                messagesService.unknownGeolocation()
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                messagesService.unknownStation()
            );
        }
    } else {
        const stationObjects = raspStationsService.search( tgh.getTextFromUpdate(update) );
        ///console.log('search result', stationObjects);

        if (stationObjects.length) {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                messagesService.foundStations({ stationObjects, user })
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                messagesService.stationNotFoundAndUserStations({ user })
            );
        }
    }
};


module.exports = {
    handler,
};