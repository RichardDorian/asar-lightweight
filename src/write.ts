import { createEmpty } from 'chromium-pickle-js';
import { createHash } from 'crypto';
import {
  DirectoryEntry,
  FileEntry,
  IDirectoryEntry,
  IEntryProperties,
  IFileEntry,
  isIDirectoryEntry,
} from './types';

/**
 * Writes an parsed asar archive to a buffer
 * @param archiveContent The content of the archive
 * @param options Options to pass to the writer
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
  archiveContent: (IFileEntry | IDirectoryEntry)[],
  options?: WriteArchiveOptions
): Promise<Buffer> {
  options = options ?? {};

  const header: DirectoryEntry = { files: {} };

  // We can predict content size which might speed up the writing process
  const totalSize = calculateSize(archiveContent);

  const buffers = {
    header: Buffer.alloc(0),
    content: Buffer.allocUnsafe(totalSize),
    offset: 0,
  };

  for (const entry of archiveContent)
    await processDirectoryFileEntry(buffers, entry, header, options);

  const headerPickle = createEmpty();
  headerPickle.writeString(JSON.stringify(header));
  const headerBuf = headerPickle.toBuffer() as Buffer;

  const sizePickle = createEmpty();
  sizePickle.writeUInt32(headerBuf.length);
  const sizeBuf = sizePickle.toBuffer() as Buffer;

  buffers.header = Buffer.concat([sizeBuf, headerBuf]);

  return Buffer.concat([buffers.header, buffers.content]);
}

function calculateSize(
  archiveContent: (IFileEntry | IDirectoryEntry)[]
): number {
  return archiveContent.reduce((acc, curr) => {
    let currentSize;
    if (isIDirectoryEntry(curr)) currentSize = calculateSize(curr.files);
    else currentSize = curr.data.length;
    return acc + currentSize;
  }, 0);
}

async function processDirectoryFileEntry(
  buffers: { content: Buffer; offset: number },
  entry: IDirectoryEntry | IFileEntry,
  header: DirectoryEntry,
  options: WriteArchiveOptions
): Promise<void> {
  if (isIDirectoryEntry(entry))
    writeDirectoryEntry(buffers, entry, header, options);
  else writeFileEntry(entry, buffers, header, options);
}

function writeDirectoryEntry(
  buffers: { content: Buffer; offset: number },
  directoryEntry: IDirectoryEntry,
  header: DirectoryEntry,
  options: WriteArchiveOptions
): void {
  header.files[directoryEntry.directoryName] = { files: {} };

  for (const entry of directoryEntry.files) {
    processDirectoryFileEntry(
      buffers,
      entry,
      header.files[directoryEntry.directoryName] as DirectoryEntry,
      options
    );
  }
}

function writeFileEntry(
  entry: IFileEntry,
  buffers: { content: Buffer; offset: number },
  header: DirectoryEntry,
  options: WriteArchiveOptions
): void {
  const size = entry.data.length;

  entry.data.copy(buffers.content, buffers.offset);
  buffers.offset += size;

  writeFileEntryHeader(entry, buffers.offset - size, size, header, options, {
    unpacked: entry.unpacked,
  });
}

function writeFileEntryHeader(
  entry: IFileEntry,
  offset: number,
  size: number,
  header: DirectoryEntry,
  options: WriteArchiveOptions,
  properties: IEntryProperties
): void {
  const fileHeader: FileEntry = {
    offset: offset.toString(),
    size,
    ...properties,
  };

  if (options.skipIntegrity)
    return void (header.files[entry.filename] = fileHeader);

  // 4MB block size
  const blockSize = 4 * 1024 * 1024;
  const blocks: string[] = [];

  const hash = createHash('sha256');
  for (let i = 0; i < entry.data.length; i += blockSize) {
    const data = entry.data.slice(i, i + blockSize);
    hash.update(data);
    blocks.push(createHash('sha256').update(data).digest('hex'));
  }

  fileHeader.integrity = {
    algorithm: 'SHA256',
    hash: hash.digest('hex'),
    blocks,
    blockSize,
  };

  header.files[entry.filename] = fileHeader;
}

export interface WriteArchiveOptions {
  /** Whether or not to skip file integrity in header */
  skipIntegrity?: boolean;
}
