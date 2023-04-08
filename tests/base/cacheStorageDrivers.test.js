const { MemoryCacheStorageDriver } = require('../../src/base/cache/storageDrivers');

describe.each([  // this for values more
    [ MemoryCacheStorageDriver.create(), 'Infinity memory cache' ],
    // [ MemoryCacheStorageDriver.create({ lifeTime: 1 }), 'One second memory cache' ],
])(``, (cacheStorageDriver, driverName) => {
    beforeEach(() => {
        cacheStorageDriver.clearAllData();
    });

    const KEY = 'abc';
    const VALUE = { a: 123, b: 576 };

    test(`check set check get ${driverName}`, () => {
        expect(cacheStorageDriver.check(KEY)).toBe(false);

        cacheStorageDriver.set(KEY, VALUE);

        expect(cacheStorageDriver.check(KEY)).toBe(true);

        expect(cacheStorageDriver.get(KEY)).toEqual(VALUE);
    });
});
