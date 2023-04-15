const { TimeStampedStorage } = require('../../src/base/cache');

describe(`TimeStampedStorage`, () => {
    let timeStampedStorage;
    beforeAll(() => {
        timeStampedStorage = TimeStampedStorage();
    });

    beforeEach(() => {
        timeStampedStorage.clear();
    });

    const KEY = 'abc';
    const VALUE = { a: 123, b: 576 };

    test(`check set check get timeStampedStorage`, () => {
        expect(timeStampedStorage.getValue(KEY)).toBeFalsy();

        timeStampedStorage.set(KEY, VALUE);

        expect(timeStampedStorage.getValue(KEY)).toEqual(VALUE);
    });
});
