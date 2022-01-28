const { createRxDatabase } = require('rxdb');
const { getRxStoragePouch, addPouchPlugin } = require('rxdb/plugins/pouchdb');
const leveldown = require('leveldown');

addPouchPlugin(require('pouchdb-adapter-leveldb')); // leveldown adapters need the leveldb plugin to work

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const USERS_SCHEMA = {
    title: "users schema",
    version: 4,
    description: "users",
    primaryKey: "id",
    type: "object",
    properties: {
        id: { type: "string" },
        userId: { type: "number" },
        favoriteStations: {
            type: "array",
            items: { type: "string" },
        },
        state: "string",
        filters: {
            type: "object",
            properties: {
                denyTransportType: {
                    type: "array",
                    items: { type: "string" },
                },
                geolocation: {
                    type: "object",
                    properties: {
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        radius: { type: "number" },
                        messageId: { type: "number" },
                    },
                },
            },
        },
        routes: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    id: 'string',
                    name: 'string',
                    stations: {
                        type: 'array',
                        items: { type: "string" },
                    },
                },
            },
        },
    },
    required: [ "id", "userId", ],
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let db = null;

const initialize = async () => {
    db = await createRxDatabase({
        name: './data/rxdb',
        storage: getRxStoragePouch(leveldown) // the full leveldown-module
    });

    await db.addCollections({
        users: {
            schema: USERS_SCHEMA,
            migrationStrategies: {
                1: v => v, // silly
                2: v => v, // silly
                3: v => v, // silly
                4: v => Object.assign(v, { routes: [] }),
            },
        }
    });
};

const getDb = () => db;

module.exports = {
    initialize,
    getDb,
};