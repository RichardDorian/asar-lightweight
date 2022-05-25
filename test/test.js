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
  const packed = writeArchive(content, { skipIntegrity: true });
  console.timeEnd('writeArchive');

  // console.time('writeFile');
  // await writeFile('app-edited.asar', packed);
  // console.timeEnd('writeFile');
  console.log('other process');
})();
