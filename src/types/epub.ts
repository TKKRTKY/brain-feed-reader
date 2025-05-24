export interface EPubFile {
  name: string;
  size: number;
  content: ArrayBuffer;
}

export interface BookMetadata {
  title: string;
  creator?: string;
  language?: string;
  publisher?: string;
  rights?: string;
}

export interface Chapter {
  id: string;
  href: string;
  title: string;
  level: number;
  children?: Chapter[];
}
