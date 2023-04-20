const fs = require('fs');
const fsp = fs.promises;

const { getDistanceFromLatLonInKm } = require('../../utils/geo')
const { sortByFields } = require('../../utils/base')

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

const search = (needle, filters) => {
    const result = [];

    const denyTransportType = filters ? new Set(filters.denyTransportType || []) : new Set();
    const geoFilter = filters && filters.geolocation;

    console.time('search');
    stationsStructure.countries.forEach(country => {
        country.regions.forEach(region => {
            region.settlements.forEach(settlement => {
                settlement.stations.forEach(station => {
                    if (
                        !denyTransportType.has(station.transport_type)
                        && station.title.toLowerCase().includes(needle.toLowerCase())
                        && (
                            geoFilter && geoFilter.radius
                                ? geoFilter.radius > getDistanceFromLatLonInKm(geoFilter.latitude, geoFilter.longitude, station.latitude, station.longitude)
                                : true
                        )
                    ) {
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

const getManyByYandexCodes = (yandexCodesArray) => {
    const result = [];
    const yandexCodesSet = new Set(yandexCodesArray);

    console.time('getManyByYandexCodes');
    stationsStructure.countries.forEach(country => {
        country.regions.forEach(region => {
            region.settlements.forEach(settlement => {
                settlement.stations.forEach(station => {
                    if (yandexCodesSet.has(station.codes.yandex_code)) {
                        result.push({ country, region, settlement, station });
                    }
                })
            });
        });
    });
    console.timeEnd('getManyByYandexCodes');
    sortByFields([ 'transport_type', 'title' ])(result);

    return result;
};


module.exports = {
    initialize,
    search,
    getByYandexCode,
    getManyByYandexCodes,
};
