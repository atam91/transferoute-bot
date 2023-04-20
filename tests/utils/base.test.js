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
        { a: 'aaa', b: '53546' },
        { a: 'fff', b: 'djkhvf' },
        { a: 'hhh', b: 'fgoijp' },
        { a: 'terte', b: 'qqtyrtqq' },
        { a: 'dfgs', b: 'etrt' },
        { a: 'hhre', b: 'qqssfdqq' },
        { a: 'zzzz', b: 'asd' },
    ];
    data = sortByFields([ 'a', 'b' ])(data);

    console.log(data);

});
