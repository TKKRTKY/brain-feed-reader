export interface DBConfig {
  name: string;
  version: number;
  stores: {
    [key: string]: string; // store name -> keyPath
  };
}

export const DB_CONFIG: DBConfig = {
  name: 'BrainFeedReader',
  version: 1,
  stores: {
    books: 'id',
    highlights: 'id',
    notes: 'id',
    summaries: 'id'
  }
};

export interface Book {
  id: string;
  title: string;
  author?: string;
  filepath: string;
  lastOpened?: Date;
  currentChapter?: string;
}

export interface Highlight {
  id: string;
  bookId: string;
  chapterId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color?: string;
  note?: string;
  createdAt: Date;
}

export interface Note {
  id: string;
  bookId: string;
  chapterId?: string;
  title: string;
  content: string;
  highlightIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Summary {
  id: string;
  bookId: string;
  chapterId?: string;
  highlightId?: string;
  content: string;
  createdAt: Date;
}

export interface StoreIndex {
  name: string;
  keyPath: string | string[];
  options?: IDBIndexParameters;
}

export const STORE_INDEXES: Record<string, StoreIndex[]> = {
  highlights: [
    { name: 'by_book', keyPath: 'bookId' },
    { name: 'by_chapter', keyPath: ['bookId', 'chapterId'] }
  ],
  notes: [
    { name: 'by_book', keyPath: 'bookId' },
    { name: 'by_update', keyPath: 'updatedAt' }
  ],
  summaries: [
    { name: 'by_book', keyPath: 'bookId' },
    { name: 'by_highlight', keyPath: 'highlightId' }
  ]
};
