const fs = require('fs');
const fsp = fs.promises;

const getAllStations = async () => {
    const file = await fsp.readFile('./data/stations_list.json');
    const stations = JSON.parse(file.toString());

    return stations;
};


module.exports = {
    getAllStations
};