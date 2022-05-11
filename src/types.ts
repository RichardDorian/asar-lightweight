export type FileEntry = {
  offset: string;
  size: number;
  executable?: boolean;
  integrity: {
    hash: string;
    algorithm: 'SHA256';
    blocks: string[];
    blockSize: number;
  };
};

export interface DirectoryEntry {
  files: { [key: string]: DirectoryEntry | FileEntry };
}

export function isDirectoryEntry(obj: any): obj is DirectoryEntry {
  return typeof obj === 'object' && typeof obj.files === 'object';
}

export interface IFileEntry {
  filename: string;
  data: Buffer;
}

export interface IDirectoryEntry {
  directoryName: string;
  files: IFileEntry[];
}
