const { readArchive, writeArchive } = require('../dist');
const { readFile } = require('fs/promises');

(async () => {
  const archive = await readFile('testWithFolders.asar');
  const content = await readArchive(archive);
  console.log(content);

  const packed = await writeArchive(content);
  console.log(packed.toString('hex'));
})();
