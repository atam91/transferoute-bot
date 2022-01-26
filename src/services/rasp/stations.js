const fs = require('fs');
const fsp = fs.promises;

let stationsStructure = null;

const getAllStations = async () => {
    const file = await fsp.readFile('./data/stations_list.json');
    stationsStructure = JSON.parse(file.toString());

    return stationsStructure;
};

const initialize = async () => {
    console.time('getAllStations');
    await getAllStations();
    console.timeEnd('getAllStations');
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
    # stationsStructure
        countries(title)
            regions(title)
                settlements(title)
                    stations(station_type, title, codes.yandex_code)
 */
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const search = (needle) => {
    const result = [];

    console.time('search');
    stationsStructure.countries.forEach(country => {
        country.regions.forEach(region => {
            region.settlements.forEach(settlement => {
                settlement.stations.forEach(station => {
                    if (station.title.toLowerCase().includes(needle.toLowerCase())) {
                        result.push({ country, region, settlement, station });
                    }
                })
            });
        });
    });
    console.timeEnd('search');

    return result;
};

const getByYandexCode = (yandexCode) => {
    let result = null;

    console.time('getByYandexCode');
    stationsStructure.countries.every(country => {
        return country.regions.every(region => {
            return region.settlements.every(settlement => {
                return settlement.stations.every(station => {
                    if (station.codes.yandex_code == yandexCode) {
                        result = { country, region, settlement, station };

                        return false;
                    }

                    return true;
                })
            });
        });
    });
    console.timeEnd('getByYandexCode');

    return result;
};


module.exports = {
    initialize,
    search,
    getByYandexCode,
};
