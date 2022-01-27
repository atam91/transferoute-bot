const raspStationsService = require("./rasp/stations");
const TRANSPORT_TYPE_EMOJI_MAP = {
    plane: '✈',
    train: '🚅',
    suburban: '🚇',
    bus: '🚌',
    water: '🚤',
    helicopter: '🚁',
};

const BACK = 'назад';
const TURN_ON_SHORT = 'вкл';
const TURN_OFF_SHORT = 'выкл';

const YES_MARK = '✔';
const NO_MARK = '✖';


const stationObjectToFullNameFormatter = ({ country, region, settlement, station }) =>
    [
        TRANSPORT_TYPE_EMOJI_MAP[station.transport_type] || station.transport_type,
        `*${station.title}*`,
        '(' + [ region.title, settlement.title ].filter(v => v).map(v => `__${v}__`).join(' / ') + ')',
    ]
        .join(' ');

const userStationsMessage = (user) => {
    const stations = raspStationsService.getManyByYandexCodes(user.get('favoriteStations'));

    return [
        'Ваши сохранённые станции::'
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

///////////////////////////////////////////////

const stationAdded = ({ stObj, user }) =>
    `Добавлена станция: ${stObj.station.title}\n\n` + userStationsMessage(user);

const stationDropped = ({ stObj, user }) =>
    `Удалена станция: ${stObj.station.title}\n\n` + userStationsMessage(user);

const stationNotFoundDueManipulation = ({ user }) =>
    '🤷🏼‍♂️ Станция не обнаружена\n\n' + userStationsMessage(user);

const stationNotFoundAndUserStations = ({ user }) =>
    '🤷🏼‍♂️ Станция не найдена\n\n' + userStationsMessage(user);

const unknownStation = () => '🤷🏼‍♂️ Станция не найдена';

const unknownGeolocation = () => '🤷🏼‍♂️ Локация неизвестна';

const foundStations = ({ stationObjects, user }) => {
    const stationsCodes = user.get('favoriteStations');

    const text = stationObjects
        .map(stObj =>
            [
                stationObjectToFullNameFormatter(stObj),
                !stationsCodes.includes(stObj.station.codes.yandex_code)
                    && '/add\\_' + stObj.station.codes.yandex_code,
                '/where\\_' + stObj.station.codes.yandex_code,
            ]
                .filter(v => v)
                .join(' ')
        )
        .join('\n');

    return text;
};


module.exports = {
    stationAdded,
    stationDropped,
    stationNotFoundDueManipulation,
    stationNotFoundAndUserStations,
    unknownStation,
    unknownGeolocation,
    foundStations,
};







