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


const getFullTimeFromIso = iso => iso.split('T')[1].split('+')[0];
const stripTimeSeconds = time => time.replace(/\:00$/, '');

const getTimeFromIso = iso => stripTimeSeconds( getFullTimeFromIso(iso) );

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
             const needle = tgh.getTextFromUpdate(update);
                if (needle.length < 3) {
                await telegramBot.sendMessage(
                    tgh.getChatIdFromUpdate(update),
                   '3 symbols minimum pls'
                );
                        return;
                }
            const stationObjects = raspStationsService.search(needle,  user.get('filters') );
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
        if (text.startsWith('??????') || text.startsWith('????????')) {
            const transport = text.split(' ').reverse()[0];

            if (text.startsWith('??????')) {
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
                            `???????????????????? ?????????????????? ?? ${geoFilter.radius}????`,
                            '???????????????? ???????????? /drop\\_filters\\_geolocation',
                            '',
                            '?????????????????? /filters /search'
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
                                    `???????????????????? ?????????????????? ?? ${geoFilter.radius}????`,
                                    '???????????????? ???????????? /drop\\_filters\\_geolocation',
                                    '',
                                    '?????????????????? /filters /search'
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
                    text: '???????????????? ???????????? ?? ???????????????????? ???? ?????????????????? ??????????\n?????????????????? /filters /search',
                    replyToMessageId: update.message.message_id,
                }
            );
        } else {
            await telegramBot.sendMessage(
                tgh.getChatIdFromUpdate(update),
                '?????????????????? ???? ????????????????????, ?????????? ???????????????????? ???????????????? ????????????????????????????\n?????????????????? /filters /search'
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
        const routes = user.get('routes') || [];
        console.log('routes', routes, routes.length);

        const text = tgh.getTextFromUpdate(update);
        if (text.startsWith('/go_') || text.startsWith('/goback_')) {
            const routeId = getParameterFromContainingUpdate(update);
            const route = routes.find(r => r.id === routeId);

            if (route) {
                const result = [];
                let stations = JSON.parse( JSON.stringify(route.stations) );
                if (text.startsWith('/goback_')) {
                    stations = stations.reverse();
                }

                try {
                    for (let i = 0; i < stations.length; i++) {
                        if (i % 2 === 0) {
                            const from = stations[i];
                            const to = stations[i+1];

                            const data = await raspScheduleService.getSchedule({ from, to });

                            result.push({
                                fromStObj: raspStationsService.getByYandexCode(from),
                                toStObj: raspStationsService.getByYandexCode(to),
                                data,
                            });
                        }
                    }

                    await telegramBot.sendMessage(
                        tgh.getChatIdFromUpdate(update),
                        [
                            ...result.map(({ fromStObj, toStObj, data }) => {
                                return [
                                    messagesService.stationObjectToShortNameFormatter(fromStObj) + ' *==>>* ' + messagesService.stationObjectToShortNameFormatter(toStObj),
                                    data.map(segment => {
                                        const departureTime = getTimeFromIso(segment.departure);
                                        const arrivalTime = getTimeFromIso(segment.arrival);

                                        return `${departureTime} -> ${arrivalTime}`;
                                    }).join(' ; '),
                                    '',
                                ].join('\n')
                            }),
                            '',
                            '?????????????????? /route /search /filter'
                        ].join('\n')
                    );
                } catch (error) {
                    console.log('error_response_status', error.response.status);
                    console.log('error_responsex_data', error.response.data);

                    if (error.response.status) {
                        const responseData = error.response.data;

                        await telegramBot.sendMessage(
                            tgh.getChatIdFromUpdate(update),
                            [
                                `Error ${error.response.status}`,
                                responseData?.error?.text ? `: ${responseData.error.text}` : '',    //// fixme maybe put it into API client
                            ].filter(v => v).join('')
                        );
                    } else {
                        console.log('Unknown Error', error);   //// fixme
                        throw error;
                    }
                }
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
                        '???????????????? ???? ???????????????????????? ??????????????????::',
                        ...routes.map(r => [ r.name, `/go\\_${r.id}`, `/goback\\_${r.id}`, `\n/drop\\_${r.id}`, '\n' ].join(' ')),
                        '',
                        '?????????????????? /search /filter',
                        '*?????????? ??????????????* /route\\_new'
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
            const routes = user.get('routes') || [];
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
                '??????????????::',
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
                '???????? ?????????????????????? ??????????????::',
                ...stations.map(stObj =>
                    [
                        messagesService.stationObjectToShortNameFormatter(stObj),
                        (isEvenRouteStationsAfter ? '/from\\_' : '/to\\_') + stObj.station.codes.yandex_code,
                    ]
                        .join(' ')
                ),
                '',
                '?????????????????? /route /search /filter',
            ].join('\n')
        );


    },
};

const handler = (telegramBot) => async (update) => {
    const db = rxdb.getDb();

    console.log('UPDATE', JSON.stringify(update, null, 4));

    let user = await db.users.findOne({
        selector: {
            userId: tgh.getChatIdFromUpdate(update)
        }
    }).exec();
    if (!user) {
        user = await db.users.insert({
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
            '?????? some state error ??????'
        );
    }
};

const emergencyHandler = (telegramBot) => async (update) => {
    await telegramBot.sendMessage(
      tgh.getChatIdFromUpdate(update),
      '?????? Sorry, transferoute-bot have some problems, and temporally turned off...'
    );
};


module.exports = {
    handler,
    emergencyHandler,
};
