const axios = require('axios').default;
const { genGetCacheQuery } = require('../../base/cache');

const { YANDEX_RASP_API_KEY } = require("../../config");

/**
 *
 * @param from
 * @param to
 * @param date
 * @returns {Promise<Segments>}
 */
const getSchedule = async ({ from, to, date }) => {
    const response = await axios.get(`https://api.rasp.yandex.net/v3.0/search/?from=${from}&to=${to}&date=${date}&apikey=${YANDEX_RASP_API_KEY}&limit=1000`);
    const data = response.data;

    return data.segments;
};


module.exports = {
    getSchedule: genGetCacheQuery({ prefix: 'api_search', cb: getSchedule }),
}
