const fs = require('fs');
const fsp = fs.promises;

let stations = null;

const getAllStations = async () => {
    const file = await fsp.readFile('./data/stations_list.json');
    stations = JSON.parse(file.toString());

    return stations;
};

const initialize = async () => {
    console.time('getAllStations');
    await getAllStations();
    console.timeEnd('getAllStations');

    console.log('STATIONS starts here', Object.keys(stations));
};

////////////////////////////////////////////////////////////////////////////////

const search = (needle) => {
    console.log('searching... ' + needle);

    return 'nono';
};


module.exports = {
    initialize,
    search,
};
