# asar-lightweight

`asar-lightweight` is a lightweight library to read and write asar archives.

It uses the same format as original asar files. Here you can read archives directly using buffers which means you have a total control over the archive, how you get it and how you store it.

# Usage

## Installation

```bash
$ npm install asar-lightweight
```

## Importation

```js
const asar = require('asar-lightweight'); // CommonJS

import * as asar from 'asar-lightweight'; // ES6
```

## Reading

```js
const asar = require('asar-lightweight');
const fs = require('fs');

// Getting the file from the file system (but you can get the Buffer from another source)
const archive = fs.readFileSync('/path/to/archive.asar');

// Now you can read it
// Remember the function is asynchronous
(async () => {
  const content = await asar.readArchive(archive);
  // Do stuff with `content`
})();
```

## Writing

```js
const asar = require('asar-lightweight');
const fs = require('fs');

// Getting the file from the file system (but you can get the Buffer from another source)
const archive = fs.readFileSync('/path/to/archive.asar');

// Now you can read it, edit the data and then write it back
// Remember those functions are asynchronous
(async () => {
  const content = await asar.readArchive(archive);

  // Do stuff with `content`

  const packed = await asar.writeArchive(content);
})();
```
