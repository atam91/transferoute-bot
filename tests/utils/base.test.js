const { groupBySortedField } = require('../../src/utils/base');

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
