const { readArchive, writeArchive } = require('../dist');
const { readFile, writeFile } = require('fs/promises');

(async () => {
  const archive = await readFile('app-edited.asar');
  const content = await readArchive(archive);
  console.log(content);

  // const packed = await writeArchive(content);
  // await writeFile('app-edited.asar', packed);
})();
