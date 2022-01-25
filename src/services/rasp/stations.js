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
};

////////////////////////////////////////////////////////////////////////////////

const search = (needle) => {
    console.log('searching... ' + needle);

    const data = stations;
    const result = [];

    console.time('search');
    data.countries.forEach(country => {
        // console.log('COUNTRY', country.title);

        country.regions.forEach(region => {
            // console.log('_region', region.title);

            region.settlements.forEach(settlement => {
                // console.log('_city', settlement.title);

                settlement.stations.forEach(station => {
                    // console.log('_stations', station.title);

                    if (station.title.toLowerCase().includes(needle.toLowerCase())) {
                        result.push({ country, region, settlement, station });
                    }
                })
            });
        });
    });
    console.timeEnd('search');

    /*

    countries
        regions
            settlements(title)
                stations(station_type, title, codes.yandex_code)

     */

    return result;
};


module.exports = {
    initialize,
    search,
};
