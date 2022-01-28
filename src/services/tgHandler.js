const { helpers: tgh } = require('../base/telegramBot');
const raspStationsService = require('./rasp/stations');
const raspScheduleService = require('./rasp/schedule');
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

const getParameterFromContainingUpdate = update => tgh.getTextFromUpdate(update).split('_')[1];

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const STATE_HANDLERS = {
    search: (telegramBot) => async ({ update, user }) => {
        if (!tgh.getTextFromUpdate(update)) return;

        if (tgh.getTextFromUpdate(update).startsWith('/add')) {
            const stObj = raspStationsService.getByYandexCode(getParameterFromContainingUpdate(update));

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
            const stObj = raspStationsService.getByYandexCode(getParameterFromContainingUpdate(update));

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
            const stObj = raspStationsService.getByYandexCode(getParameterFromContainingUpdate(update));

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
                state: 'filters_geolocation',               /// fixme  seemee SIC!      meaybe more interesting changeCurrentStateAndHandle
            }
        });

        await STATE_HANDLERS.filters_geolocation(telegramBot)({ update, user });
    },

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    route: (telegramBot) => async ({ update, user }) =>  {
        const routes = user.get('routes');
        console.log('routes', routes, routes.length);

        if (tgh.getTextFromUpdate(update).startsWith('/go')) {
            const routeId = getParameterFromContainingUpdate(update);
            const route = routes.find(r => r.id === routeId);

            if (route) {
                const result = [];

                for (let i = 0; i < route.stations.length; i++) {
                    if (i % 2 === 0) {
                        const from = route.stations[i];
                        const to = route.stations[i+1];

                        const data = await raspScheduleService.getSchedule({ from, to });

                        result.push({
                            fromStObj: raspStationsService.getByYandexCode(from),
                            toStObj: raspStationsService.getByYandexCode(to),
                            data,
                        });
                    }
                }

                console.log('RRRR', result);




                await telegramBot.sendMessage(
                    tgh.getChatIdFromUpdate(update),
                    [
                        ...result.map(({ fromStObj, toStObj, data }) => {
                            return [
                                messagesService.stationObjectToShortNameFormatter(fromStObj) + ' *==>>* ' + messagesService.stationObjectToShortNameFormatter(toStObj),
                                data.map(segment => {
                                    const departureTime = segment.departure.split('T')[1].split('+')[0];
                                    const arrivalTime = segment.arrival.split('T')[1].split('+')[0];

                                    return `${departureTime} -> ${arrivalTime}`;
                                }).join(' ; '),
                                '',
                            ].join('\n')
                        }),
                        '',
                        'Вернуться /route /search /filter'
                    ].join('\n')
                );

            } else {
                await telegramBot.sendMessage(
                    tgh.getChatIdFromUpdate(update),
                    '*unknown route*\nreturn: /route /search /filter'
                );
            }
        } else {
            if (routes.length) {
                await telegramBot.sendMessage(
                    tgh.getChatIdFromUpdate(update),
                    [
                        'Выберите из существующих маршрутов::',
                        ...routes.map(r => [ r.name, `/go\\_${r.id}`, `/drop\\_${r.id}` ].join(' ')),
                        '',
                        'Вернуться /search /filter',
                        '*Новый маршрут* /route\\_new'
                    ].join('\n')
                );
            } else {
                await user.update({
                    $set: { state: 'route_new' }
                });

                await STATE_HANDLERS.route_new(telegramBot)({ update, user });
            }
        }
    },

    route_new: (telegramBot) => async ({ update, user }, ...routeStations) =>  {
        const isEvenRouteStations = routeStations.length % 2 === 0;
        let routeStationsAfter = routeStations;

        console.log('routeStations', routeStations);

        if (
            tgh.getTextFromUpdate(update).startsWith('/from') && isEvenRouteStations
            || tgh.getTextFromUpdate(update).startsWith('/to') && !isEvenRouteStations
        ) {
            routeStationsAfter.push( getParameterFromContainingUpdate(update) );

            await user.update({
                $set: { state: genStateLine('route_new', ...routeStationsAfter) }
            });
        } else if (tgh.getTextFromUpdate(update).startsWith('/finish') && routeStations.length && isEvenRouteStations) {
            ///// SAVE /////
            const routes = user.get('routes');
            let name = '';
            for (let i = 0; i < routeStations.length; i++) {
                const stObj = raspStationsService.getByYandexCode(routeStations[i]);      /// TODO BATCH

                if (i === 0) {
                    name = messagesService.stationObjectToShortNameFormatter(stObj) + ' -> ';
                } else if (i % 2 === 0) {
                    name += messagesService.stationObjectToShortNameFormatter(stObj) + ' -> ';
                }
                if (i === routeStations.length - 1) {
                    name += messagesService.stationObjectToShortNameFormatter(stObj);
                }
            }

            const creatingRoute = {
                id: routes.length ? (parseInt(routes[routes.length-1].id) + 1).toString() : '1',
                name,
                stations: routeStations,
            };
            await user.update({
                $push: {
                    routes: creatingRoute,
                }
            });
            ////////////////////////////
            await user.update({                             //// TODO push to timeQuestion  or /go_i
                $set: { state: 'route' }
            });

            await STATE_HANDLERS.route(telegramBot)({ update, user });
            return;
        }

        const isEvenRouteStationsAfter = routeStationsAfter.length % 2 === 0;

        const stations = raspStationsService.getManyByYandexCodes(user.get('favoriteStations'));
        await telegramBot.sendMessage(
            tgh.getChatIdFromUpdate(update),
            [
                'Маршрут::',
                ...routeStationsAfter.map((stCode, index) => {
                    const stObj = raspStationsService.getByYandexCode(stCode);      /// TODO BATCH

                    return [
                        messagesService.stationObjectToShortNameFormatter(stObj),
                        index % 2 === 0 && (index < routeStationsAfter.length - 1 ? '*===>>>*' : '*???*'),

                    ].filter(v => v).join(' ') + (index % 2 !== 0 && index < routeStationsAfter.length - 1 ? '\n...' : '')
                }),
                '',
                routeStationsAfter.length && isEvenRouteStationsAfter ? '/finish' : '',
                '',
                'Ваши сохранённые станции::',
                ...stations.map(stObj =>
                    [
                        messagesService.stationObjectToShortNameFormatter(stObj),
                        (isEvenRouteStationsAfter ? '/from\\_' : '/to\\_') + stObj.station.codes.yandex_code,
                    ]
                        .join(' ')
                ),
                '',
                'Вернуться /route /search /filter',
            ].join('\n')
        );


    },
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