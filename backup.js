const fs = require('fs/promises');

const rxdb = require('./src/rxdb');

(async () => {
  await rxdb.initialize();
  const db = rxdb.getDb();

  const usersDocs = await db.users.find().exec();

  const users = usersDocs.map( d => d.toJSON() );
  await fs.writeFile('./backup.json', JSON.stringify({ users }, null, 4));

  process.exit();
})();


