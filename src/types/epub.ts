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
  identifier?: string;
}

export interface Chapter {
  id: string;
  href: string;
  title: string;
  content: string;
  summary?: string;
  children?: Chapter[];
}
