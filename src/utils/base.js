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


module.exports = {
    groupBySortedField,
};
