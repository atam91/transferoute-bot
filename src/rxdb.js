const { createRxDatabase } = require('rxdb');
const { getRxStoragePouch, addPouchPlugin } = require('rxdb/plugins/pouchdb');
const leveldown = require('leveldown');

addPouchPlugin(require('pouchdb-adapter-leveldb')); // leveldown adapters need the leveldb plugin to work

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const USERS_SCHEMA = {
    title: "users schema",
    version: 2,
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
            },
        }
    });
};

const getDb = () => db;

module.exports = {
    initialize,
    getDb,
};