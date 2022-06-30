const { readArchive, writeArchive } = require('../dist');
const { readFile, writeFile } = require('fs/promises');

(async () => {
  const archive = await readFile('app.asar');

  const content = await readArchive(archive);

  const packed = await writeArchive(content, { skipIntegrity: true });

  await writeFile('app.asar', packed);
})();
