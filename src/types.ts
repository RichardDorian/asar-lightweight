export type FileEntry = {
  offset: string;
  size: number;
  executable?: boolean;
  unpacked?: boolean;
  integrity?: {
    hash: string;
    algorithm: 'SHA256';
    blocks: string[];
    blockSize: number;
  };
};

export interface IEntryProperties {
  unpacked?: boolean;
}

export interface DirectoryEntry {
  files: { [key: string]: DirectoryEntry | FileEntry };
}

export function isDirectoryEntry(obj: any): obj is DirectoryEntry {
  return typeof obj === 'object' && typeof obj.files === 'object';
}

export interface IFileEntry {
  filename: string;
  data: Buffer;
  unpacked?: boolean;
}

export interface IDirectoryEntry {
  directoryName: string;
  files: (IFileEntry | IDirectoryEntry)[];
}

export function isIDirectoryEntry(obj: any): obj is IDirectoryEntry {
  return (
    typeof obj === 'object' &&
    typeof obj.directoryName === 'string' &&
    Array.isArray(obj.files)
  );
}
