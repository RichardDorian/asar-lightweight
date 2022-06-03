const { readArchive, writeArchive } = require('../dist');
const { readFile, writeFile } = require('fs/promises');

(async () => {
  const archive = await readFile('test2.asar');

  const content = await readArchive(archive);

  const packed = await writeArchive(content, { skipIntegrity: true });

  await writeFile('test2_out.asar', packed);
})();
