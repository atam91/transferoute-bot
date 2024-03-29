const addHours = require('date-fns/addHours');
const setHours = require('date-fns/setHours');
const startOfHour = require('date-fns/startOfHour');
const api = require('./api');

const { isDateAfter, isDateBefore } = require('../../utils/datetime');

const { YANDEX_RASP_API_KEY } = require('../../config');

const defaultDate = () => new Date;

const getSchedule = async ({ from, to }, {
    dateTime: _dateTime,
    hours,
    fromHours,
    toHours,
    openInterval,
} = {}) => {
    const dateTime = _dateTime || defaultDate();
    const date = dateTime.toISOString().split('T')[0];

    const dateFloor = fromHours ? startOfHour(setHours(new Date(dateTime), fromHours)) : new Date(dateTime);
    const dateCeil = toHours ? startOfHour(setHours(new Date(dateTime), toHours)) : addHours(dateTime, hours || 3);

    console.log('___DDDDDD_INTERVAL', dateFloor, dateCeil);

    const segments = await api.getSchedule({ from, to, date });

    return segments.filter(({ departure }) => {
        return isDateBefore(dateFloor, new Date(departure))
            && (openInterval || isDateAfter(dateCeil, new Date(departure)));
    });
};


module.exports = {
    getSchedule,
}
