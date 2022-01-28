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

const DELIMITER = '::';
const genStateLine = function() {
    return [].join.call(arguments, DELIMITER);
};
const parseStateLine = function(line) {
    return line.split(DELIMITER);
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const getYandexCodeFromContainingUpdate = update => tgh.getTextFromUpdate(update).split('_')[1];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const STATE_HANDLERS = {
    search: (telegramBot) => async ({ update, user }) => {
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
            const stationObjects = raspStationsService.search( tgh.getTextFromUpdate(update), user.get('filters') );
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
    },

    filters: (telegramBot) => async ({ update, user }) => {
        const text = tgh.getTextFromUpdate(update);
        if (text.startsWith('вкл') || text.startsWith('выкл')) {
            const transport = text.split(' ').reverse()[0];

            if (text.startsWith('вкл')) {
                await user.update({
                    $set: {
                        'filters.denyTransportType': user.get('filters').denyTransportType.filter(t => t !== transport)
                    }
                });
            } else {
                await user.update({
                    $push: {
                        'filters.denyTransportType': transport
                    }
                });
            }
        }

        await telegramBot.sendMessage(
            tgh.getChatIdFromUpdate(update),
            messagesService.filtersMode({ user })
        );
    },

    filters_geolocation: (telegramBot) => async ({ update, user }) => {
        const geoFilter = user.get('filters').geolocation;

        if (geoFilter && geoFilter.latitude && geoFilter.longitude) {
            ///////////////////////////////////////////////////////////////////////
            if (geoFilter.radius) {
                await telegramBot.sendMessage(
                    tgh.getChatIdFromUpdate(update),
                    {
                        text: [
                            `Установлен геофильтр в ${geoFilter.radius}км`,
                            'Сбросить фильтр /drop\\_filters\\_geolocation',
                            '',
                            'Вернуться /filters /search'
                        ].join('\n'),
                        replyToMessageId: geoFilter.messageId,
                    },
                );
            } else {
                try {
                    const radius = parseInt(tgh.getTextFromUpdate(update));
                    console.log('GET_RADIUS', radius)

                    if (radius) {
                        await user.update({
                            $set: {
                                'filters.geolocation.radius': radius
                            }
                        });

                        await telegramBot.sendMessage(                                                          /// fixme double
                            tgh.getChatIdFromUpdate(update),
                            {
                                text: [
                                    `Установлен геофильтр в ${geoFilter.radius}км`,
                                    'Сбросить фильтр /drop\\_filters\\_geolocation',
                                    '',
                                    'Вернуться /filters /search'
                                ].join('\n'),
                                replyToMessageId: geoFilter.messageId,
                            },
                        );
                    } else {
                        await telegramBot.sendMessage(
                            tgh.getChatIdFromUpdate(update),
                            {
                                text: `What? Enter thee radius of your territory in kilometers!`,
                                replyToMessageId: geoFilter.messageId,
                            },
                        );
                    }

                } catch (error) {
                    await telegramBot.sendMessage(
                        tgh.getChatIdFromUpdate(update),
                        `Something wrong... ` + error
                    );
                }

            }
            ///////////////////////////////////////////////////////////////////////
        } else if (update.message.location) {
            await user.update({
                $set: {
                    'filters.geolocation': {
                        'latitude': update.message.location.latitude,
                        'longitude': update.message.location.longitude,
                        'messageId': update.message.message_id,
                    }
                }
            });

            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                {
                    text: 'Пришлите радиус в километрах от указанной точки\nВернуться /filters /search',
                    replyToMessageId: update.message.message_id,
                }
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                'Геофильтр не установлен, чтобы установить пришлите местоположение\nВернуться /filters /search'
            );
        }
    },

    drop_filters_geolocation: (telegramBot) => async ({ update, user }) =>  {
        await user.update({
            $set: {
                'filters.geolocation': undefined,
                state: 'filters_geolocation',               /// fixme  seemee SIC!
            }
        });

        await STATE_HANDLERS.filters_geolocation(telegramBot)({ update, user });
    }
};

const handler = (telegramBot) => async (update) => {
    const db = rxdb.getDb();

    console.log('UPDATE', JSON.stringify(update, null, 4));

    const user = await db.users.findOne({
        selector: {
            userId: tgh.getChatIdFromUpdate(update)
        }
    }).exec();
    if (!user) {
        await db.users.insert({
            id: tgh.getChatIdFromUpdate(update).toString(),
            userId: tgh.getChatIdFromUpdate(update),
            state: 'search',
        })
    }

    if (!user.get('state')) {                                               //// todo drop later
        await user.update({
            $set: {
                'state': 'search',
            }
        });
    }

    if (update.message.entities && update.message.entities[0].type === 'bot_command') {
        const botCmdEntity = update.message.entities[0];
        const cmd = update.message.text.substr(botCmdEntity.offset + 1, botCmdEntity.length);

        console.log('CMD', cmd);

        if (STATE_HANDLERS[cmd]) {
            await user.update({
                $set: {
                    'state': cmd,
                }
            });
        }
    }

    const userStateLine = user.get('state');
    console.log('userStateLine', userStateLine);

    const [ state, ...userStateArgs ] = parseStateLine(userStateLine);

    const handler = STATE_HANDLERS[state];
    if (handler) {
        await handler(telegramBot)({ user, update }, ...userStateArgs);
    } else {
        await telegramBot.sendMessage(
            tgh.getChatIdFromUpdate(update),
            '⚠️ some state error ⚠️'
        );
    }
};


module.exports = {
    handler,
};