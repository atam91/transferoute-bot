const axios = require('axios').default;
const addHours = require('date-fns/addHours');
const { isDateAfter, isDateBefore } = require('../../utils/datetime');

const { YANDEX_RASP_API_KEY } = require('../../config');

const defaultDate = () => new Date;

const getSchedule = async ({ from, to }, {
    _dateTime,
    hours = 3,
} = {}) => {
    const dateTime = _dateTime || defaultDate();
    const date = dateTime.toISOString().split('T')[0];
    const dateCeil = addHours(dateTime, hours);

    const response = await axios.get(`https://api.rasp.yandex.net/v3.0/search/?from=${from}&to=${to}&date=${date}&apikey=${YANDEX_RASP_API_KEY}&limit=1000`);
    const data = response.data;

    return data.segments.filter(({ departure }) => {
        return isDateBefore(dateTime, new Date(departure))
            && isDateAfter(dateCeil, new Date(departure));
    });
};


module.exports = {
    getSchedule,
}
