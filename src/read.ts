import { createFromBuffer } from 'chromium-pickle-js';
import {
  DirectoryEntry,
  FileEntry,
  IDirectoryEntry,
  IFileEntry,
  isDirectoryEntry,
} from './types';

/**
 * Reads an asar archive file (from a buffer) and returns the content of the archive as a list of entries.
 * @param archive The archive to read from
 * @returns The parsed archive (list of all the entries)
 * @example
 * ```js
 * import { readArchive } from 'asar-lightweight';
 * import { readFile } from 'fs/promises';
 *
 * (async () => { // Need to be in an async environnement
 *  const archive = await readFile('path/to/archive.asar');
 *  const content = await readArchive(archive);
 * })();
 * ```
 */
export async function readArchive(
  archive: Buffer
): Promise<(IFileEntry | IDirectoryEntry)[]> {
  const sizePickle = createFromBuffer(archive.slice(0, 8));
  const headerSize = sizePickle.createIterator().readUInt32() as number;

  const headerPickle = createFromBuffer(archive.slice(8, headerSize + 8));
  const rawHeader = headerPickle.createIterator().readString() as string;
  const header = JSON.parse(rawHeader);

  const fileOffset = headerSize + 16;

  const entries: (IFileEntry | IDirectoryEntry)[] = [];

  for (const filename in header.files) {
    const entry = header.files[filename];

    entries.push(
      readFileDirectoryEntry(archive, entry, fileOffset + 3, filename)
    );
  }

  return entries;
}

function readFileDirectoryEntry(
  archive: Buffer,
  entry: DirectoryEntry | FileEntry,
  offset: number,
  name: string
): IFileEntry | IDirectoryEntry {
  if (isDirectoryEntry(entry))
    return readDirectoryEntry(archive, entry, offset, name);
  else return readFileEntry(archive, entry, offset, name);
}

function readDirectoryEntry(
  archive: Buffer,
  entry: DirectoryEntry,
  directoryOffset: number,
  directoryName: string
): IDirectoryEntry {
  const files = [];

  for (const filename in entry.files) {
    const _entry = entry.files[filename];
    files.push(
      readFileDirectoryEntry(archive, _entry, directoryOffset, filename)
    );
  }

  return { directoryName, files };
}

function readFileEntry(
  archive: Buffer,
  entry: FileEntry,
  fileOffset: number,
  filename: string
): IFileEntry {
  const start = fileOffset + parseInt(entry.offset);

  return {
    filename,
    data: archive.slice(start, start + entry.size),
  };
}
