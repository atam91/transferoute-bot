const compareAsc = require('date-fns/compareAsc');

const isDateAfter = (dateLeft, dateRight) => compareAsc(dateLeft, dateRight) === 1;

const isDateBefore = (dateLeft, dateRight) => compareAsc(dateLeft, dateRight) === -1;


module.exports = {
  isDateAfter,
  isDateBefore,
};
