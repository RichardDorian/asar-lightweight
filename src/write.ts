import { createEmpty } from 'chromium-pickle-js';
import { createHash } from 'crypto';
import {
  DirectoryEntry,
  IDirectoryEntry,
  IFileEntry,
  isIDirectoryEntry,
} from './types';

/**
 * Writes an parsed asar archive to a buffer
 * @param archiveContent The content of the archive
 * @returns The packed archive
 * @example
 * ```js
 * import { readArchive, writeArchive } from 'asar-lightweight';
 * import { readFile } from 'fs/promises';
 *
 * (async () => { // Need to be in an async environnement
 *  const archive = await readFile('path/to/archive.asar');
 *  const content = await readArchive(archive);
 *
 * // ... Edit the content of the archive ...
 *
 *  const packed = await writeArchive(content);
 * })();
 * ```
 */
export async function writeArchive(
  archiveContent: (IFileEntry | IDirectoryEntry)[]
): Promise<Buffer> {
  const header: DirectoryEntry = { files: {} };

  const buffers = {
    header: Buffer.alloc(0),
    content: Buffer.alloc(0),
  };

  for (const entry of archiveContent)
    processDirectoryFileEntry(buffers, entry, header);

  const headerPickle = createEmpty();
  headerPickle.writeString(JSON.stringify(header));
  const headerBuf = headerPickle.toBuffer() as Buffer;

  const sizePickle = createEmpty();
  sizePickle.writeUInt32(headerBuf.length);
  const sizeBuf = sizePickle.toBuffer() as Buffer;

  buffers.header = Buffer.concat([sizeBuf, headerBuf]);

  return Buffer.concat([buffers.header, buffers.content]);
}

function processDirectoryFileEntry(
  buffers: { content: Buffer },
  entry: IDirectoryEntry | IFileEntry,
  header: DirectoryEntry
): void {
  if (isIDirectoryEntry(entry)) writeDirectoryEntry(buffers, entry, header);
  else writeFileEntry(entry, buffers, header);
}

function writeDirectoryEntry(
  buffers: { content: Buffer },
  directoryEntry: IDirectoryEntry,
  header: DirectoryEntry
): void {
  header.files[directoryEntry.directoryName] = { files: {} };

  for (const entry of directoryEntry.files) {
    processDirectoryFileEntry(
      buffers,
      entry,
      header.files[directoryEntry.directoryName] as DirectoryEntry
    );
  }
}

function writeFileEntry(
  entry: IFileEntry,
  buffers: { content: Buffer },
  header: DirectoryEntry
): void {
  const size = entry.data.length;
  const offset = buffers.content.length;

  buffers.content = Buffer.concat([buffers.content, entry.data]);

  writeFileEntryHeader(entry, offset, size, header);
}

function writeFileEntryHeader(
  entry: IFileEntry,
  offset: number,
  size: number,
  header: DirectoryEntry
): void {
  const hash = createHash('sha256');

  // 4MB block size
  const blockSize = 4 * 1024 * 1024;
  const blocks: string[] = [];

  for (let i = 0; i < entry.data.length; i += blockSize) {
    const data = entry.data.slice(i, i + blockSize);
    hash.update(data);
    blocks.push(createHash('sha256').update(data).digest('hex'));
  }

  header.files[entry.filename] = {
    offset: offset.toString(),
    size,
    executable: true,
    integrity: {
      algorithm: 'SHA256',
      hash: hash.digest('hex'),
      blocks,
      blockSize,
    },
  };
}
