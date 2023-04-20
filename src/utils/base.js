const genGetField = field => data => data[field];

const groupBySortedField = field => data => {
    let current = [];
    const result = [ current ];
    let last = data[0];

    const getGroupingField = genGetField(field);

    data.forEach(item => {
        if (getGroupingField(item) === getGroupingField(last)) {
            current.push(item);
        } else {
            current = [ item ];
            result.push(current);
            last = item;
        }
    });

    return result;
};

const compareMany = (...compareFunctions) => (a, b) => {
    let result = 0;

    for (let i = 0; result === 0 && i < compareFunctions.length; i++) {
        const compareFunction = compareFunctions[i];
        result = compareFunction(a, b);
    }

    return result;
};

const compareStrings = (a, b) => a === b ? 0 : (a < b && -1 || 1);
const sortByFields = fields => data => {
    data.sort(
        compareMany(
            ...fields.map(field =>
                (a, b) => -compareStrings(a[field], b[field])
            )
        )
    );

    return data;
};


module.exports = {
    groupBySortedField,
    sortByFields,
};
