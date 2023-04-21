const { groupBySortedField, sortByFields } = require('../../src/utils/base');

test('groupBySortedField', () => {
    const data = [
        { a: 1, b: 1 },
        { a: 1, b: 2 },
        { a: 2, b: 3 },
        { a: 2, b: 4 },
        { a: 3, b: 5 },
    ];

    const result = groupBySortedField('a')(data);

    expect(result).toEqual([
        [ { a: 1, b: 1 }, { a: 1, b: 2 }, ],
        [ { a: 2, b: 3 }, { a: 2, b: 4 }, ],
        [ { a: 3, b: 5 }, ],
    ]);
});

test('sortByFields', () => {
    let data = [
        { n: 'one', t: 'type_2' },
        { n: 'two', t: 'type_2' },
        { n: 'four', t: 'type_1' },
        { n: 'one', t: 'type_3' },
        { n: 'three', t: 'type_2' },
        { n: 'four', t: 'type_3' },
        { n: 'one', t: 'type_1' },
        { n: 'two', t: 'type_3' },
        { n: 'three', t: 'type_3' },
        { n: 'two', t: 'type_1' },
        { n: 'three', t: 'type_1' },
        { n: 'four', t: 'type_2' },
    ];
    data = sortByFields([ 'n', 't' ])(data);

    console.log(222, data);

    expect(data).toEqual([
        { n: 'four', t: 'type_1' },
        { n: 'four', t: 'type_2' },
        { n: 'four', t: 'type_3' },
        { n: 'one', t: 'type_1' },
        { n: 'one', t: 'type_2' },
        { n: 'one', t: 'type_3' },
        { n: 'three', t: 'type_1' },
        { n: 'three', t: 'type_2' },
        { n: 'three', t: 'type_3' },
        { n: 'two', t: 'type_1' },
        { n: 'two', t: 'type_2' },
        { n: 'two', t: 'type_3' },
    ]);
});

test('sortByInnerFields', () => {
    let data = [
        { "id": 0, "inner": { "n": "one", "t": "type_2" } },
        { "id": 1, "inner": { "n": "two", "t": "type_2" } },
        { "id": 2, "inner": { "n": "four", "t": "type_1" } },
        { "id": 3, "inner": { "n": "one", "t": "type_3" } },
        { "id": 4, "inner": { "n": "three", "t": "type_2" } },
        { "id": 5, "inner": { "n": "four", "t": "type_3" } },
        { "id": 6, "inner": { "n": "one", "t": "type_1" } },
        { "id": 7, "inner": { "n": "two", "t": "type_3" } },
        { "id": 8, "inner": { "n": "three", "t": "type_3" } },
        { "id": 9, "inner": { "n": "two", "t": "type_1" } },
        { "id": 10, "inner": { "n": "three", "t": "type_1" } },
        { "id": 11, "inner": { "n": "four", "t": "type_2" } },
    ];
    data = sortByFields([ 'inner.n', 'inner.t' ])(data);

    console.log(222, data);

    expect(data).toEqual([
        { id: 2, inner: { n: 'four', t: 'type_1' } },
        { id: 11, inner: { n: 'four', t: 'type_2' } },
        { id: 5, inner: { n: 'four', t: 'type_3' } },
        { id: 6, inner: { n: 'one', t: 'type_1' } },
        { id: 0, inner: { n: 'one', t: 'type_2' } },
        { id: 3, inner: { n: 'one', t: 'type_3' } },
        { id: 10, inner: { n: 'three', t: 'type_1' } },
        { id: 4, inner: { n: 'three', t: 'type_2' } },
        { id: 8, inner: { n: 'three', t: 'type_3' } },
        { id: 9, inner: { n: 'two', t: 'type_1' } },
        { id: 1, inner: { n: 'two', t: 'type_2' } },
        { id: 7, inner: { n: 'two', t: 'type_3' } }
    ]);
});
