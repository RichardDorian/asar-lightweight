#!/usr/bin/env node

import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import {
  IDirectoryEntry,
  IFileEntry,
  isIDirectoryEntry,
  readArchive,
  writeArchive,
} from '.';

if (process.argv.includes('--help')) {
  console.log(`asar-lightweight usage:

  Pack: asar-lightweight pack <inputFolder> <outputFile> [options]
    Options:
      --skipIntegrity - Do not add the integrity hash to the archive

  Extract: asar-lightweight extract <inputFile> [outputFolder]
    Options:
      outputFolder - The folder to extract the archive to. If not specified, the archive will be extracted to the current directory.
  `);
  process.exit(0);
}

function genericError(error: string): void {
  console.error(error);
  process.exit(1);
}

const action = process.argv.find((arg) => arg === 'pack' || arg === 'extract');
if (!action) genericError('No action specified, use --help for more info');

if (action === 'pack') {
  console.time('Packed in');
  const inputFolder = process.argv[process.argv.indexOf('pack') + 1];
  const outputFile = process.argv[process.argv.indexOf('pack') + 2];

  if (!inputFolder)
    genericError('No input folder specified, use --help for more info');
  if (!outputFile)
    genericError('No output file specified, use --help for more info');

  (async () => {
    const entries: (IFileEntry | IDirectoryEntry)[] = [];
    const discovered = await discover(inputFolder);

    async function processDiscoveredEntry(
      entry: DiscoveredEntry,
      parentPath: string
    ): Promise<IFileEntry | IDirectoryEntry> {
      if (entry.folder) {
        const files: (IFileEntry | IDirectoryEntry)[] = [];
        for (const _entry of entry.files)
          files.push(
            await processDiscoveredEntry(_entry, join(parentPath, entry.name))
          );
        return {
          directoryName: entry.name,
          files,
        };
      } else {
        return {
          filename: entry.name,
          data: await readFile(join(parentPath, entry.name)),
        };
      }
    }

    for (const entry of discovered)
      entries.push(await processDiscoveredEntry(entry, inputFolder));

    const output = await writeArchive(entries, {
      skipIntegrity: process.argv.includes('--skipIntegrity'),
    });
    await writeFile(outputFile, output);
    console.log(`Asar archive packed to ${outputFile}`);
    console.timeEnd('Packed in');
  })();
}

if (action === 'extract') {
  console.time('Extracted in');
  const inputFile = process.argv[process.argv.indexOf('extract') + 1];
  const outputFolder =
    process.argv[process.argv.indexOf('extract') + 2] || process.cwd();

  if (!inputFile)
    genericError('No input file specified, use --help for more info');

  (async () => {
    if (!(await stat(outputFolder).catch(() => undefined)))
      await mkdir(outputFolder, { recursive: true });

    const content = await readFile(inputFile);
    const archive = await readArchive(content);

    async function processEntry(
      entry: IFileEntry | IDirectoryEntry,
      parentPath: string
    ): Promise<void> {
      if (isIDirectoryEntry(entry)) {
        const folderPath = join(parentPath, entry.directoryName);
        await mkdir(folderPath, {
          recursive: true,
        });

        for (const file of entry.files) await processEntry(file, folderPath);
      } else await writeFile(join(parentPath, entry.filename), entry.data);
    }

    for (const entry of archive) await processEntry(entry, outputFolder);
    console.log(`Asar archive extracted to ${outputFolder}`);
    console.timeEnd('Extracted in');
  })();
}

interface DiscoveredEntry {
  folder: boolean;
  name: string;
  files?: DiscoveredEntry[];
}

async function discover(directory: string): Promise<DiscoveredEntry[]> {
  let results: DiscoveredEntry[] = [];
  const files = await readdir(directory);
  let i = 0;
  async function next() {
    const file = files[i++];
    if (!file) return;
    const path = resolve(directory, file);
    const stats = await stat(path);
    if (stats.isDirectory())
      results.push({
        folder: true,
        name: file,
        files: await discover(path),
      });
    else results.push({ folder: false, name: file });
    await next();
  }
  await next();
  return results;
}
