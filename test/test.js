const { readArchive } = require('../dist');
const { readFile } = require('fs/promises');

(async () => {
  const archive = await readFile('test2.asar');
  const content = await readArchive(archive);
  console.log(content);
})();
