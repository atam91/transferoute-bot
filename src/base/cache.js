const currentTimestamp = () => Date.now();

const checkTimestampLifetime = (t, lf) => (currentTimestamp() - t) <= lf;


function TimeStampedStorage() {
    let storage = {};

    const item = value => ({
        value: JSON.stringify(value),
        createdAt: currentTimestamp()
    });

    const getValueFromItem = ({ value: _value }) => {
        try {
            return JSON.parse(_value);
        } catch (err) {
            console.error(err);
            console.log('Error parsing from TimeStampedStorage ' + _value);

            return false;
        }
    };

    const getCreatedAtFromItem = ({ createdAt }) => createdAt;

    const saveToStorage = (key, value) => storage[key] = item(value);

    const dropFromStorage = (key) => {
        const { value } = storage[key];

        delete storage[key];

        return value; // 3443M
    };

    const getValueFromStorage = (key) => {
        const item = storage[key];

        return item && getValueFromItem(item);
    }

    const getCreatedAtForKey = (key) => {
        const item = storage[key];

        return item && getCreatedAtFromItem(item);
    };

    const clearStorage = () => { storage = {}; };

    return {
        set: saveToStorage,
        drop: dropFromStorage,
        getValue: getValueFromStorage,
        getCreatedAt: getCreatedAtForKey,
        clear: clearStorage,
    };
}

const DELIMITER = '_';

/**
 *
 * @param timeStampedStorage {TimeStampedStorage}
 * @returns {{get: (function(*): function(*=): Promise<*|*>)}}
 * @constructor
 */
function Cache(timeStampedStorage) {
    const get = options => async queryParams => {
        const {
            prefix = '',
            lifeTime = 10 * (60 * 60 * 1000), /* Hour 3600k */
            cb,
        } = options;

        if (!cb) throw new Error('Need cb for Cache.get');

        const keys = Object.keys(queryParams);
        keys.sort();

        //console.log('KEYS', keys);

        const key = [ prefix, ...keys.map(k => queryParams[k]) ].join(DELIMITER);

        const storageCreatedAt = await timeStampedStorage.getCreatedAt(key);
        if (storageCreatedAt && checkTimestampLifetime(storageCreatedAt, lifeTime)) {
            return await timeStampedStorage.getValue(key);
        }

        const data = await cb(queryParams);
        await timeStampedStorage.set(key, data);

        return data;
    };

    return {
        get,
    };
}

const timeStampedStorage = TimeStampedStorage();
const cache = Cache(timeStampedStorage);

/**
 * В итоге нужна функция с мемоизацией
 *
 * getQuery(queryCallback)(queryParams)
 */

const genGetCacheQuery = (options) => async (queryParams) => {
    return await cache.get(options)(queryParams);
};


module.exports = {
    TimeStampedStorage,
    Cache,
    genGetCacheQuery,
};
