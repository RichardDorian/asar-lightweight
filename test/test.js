const { readArchive, writeArchive } = require('../dist');
const { readFile, writeFile } = require('fs/promises');

(async () => {
  console.time('readFile');
  const archive = await readFile('app.asar');
  console.timeEnd('readFile');
  console.time('readArchive');
  const content = await readArchive(archive);
  console.timeEnd('readArchive');

  console.time('writeArchive');
  const packed = await writeArchive(content, { skipIntegrity: true });
  console.timeEnd('writeArchive');

  console.log(packed);
})();
