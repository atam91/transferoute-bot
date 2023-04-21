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

const compareByMany = (...compareFunctions) => (a, b) => {
    let result = 0;

    for (let i = 0; result === 0 && i < compareFunctions.length; i++) {
        const compareFunction = compareFunctions[i];
        result = compareFunction(a, b);
    }

    return result;
};

const compareStrings = (a, b) => a === b ? 0 : (a < b && -1 || 1);

const compareByField = (field, compareFunction = compareStrings) => (aObj, bObj) => {
    let aValue = aObj, bValue = bObj;
    const fieldPath = field.split('.');
    fieldPath.forEach(prop => {
        aValue = aValue[prop];
        bValue = bValue[prop];
    })

    return compareFunction(aValue, bValue);
};
const sortByFields = fields => data => {
    data.sort(
        compareByMany(
            ...fields.map(field => compareByField(field))
        )
    );

    return data;
};


module.exports = {
    groupBySortedField,
    sortByFields,
};
