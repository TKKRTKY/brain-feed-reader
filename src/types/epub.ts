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
  content?: string;  // コンテンツは必須ではない（目次のみの場合もある）
  summary?: string;
  children?: Chapter[];
  level: number;     // 章の階層レベル（1: 章、2: 節、3: 項など）
}
