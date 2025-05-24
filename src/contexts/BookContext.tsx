import { createContext, useContext, useReducer, ReactNode } from 'react';
import { BookMetadata, Chapter } from '@/types/epub';
import { EPubParseResult } from '@/utils/epubParser';

interface BookState {
  metadata: BookMetadata | null;
  chapters: Chapter[];
  currentChapter: string | null;
  content: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

type BookAction =
  | { type: 'SET_BOOK_DATA'; payload: EPubParseResult }
  | { type: 'SET_CURRENT_CHAPTER'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'RESET' };

const initialState: BookState = {
  metadata: null,
  chapters: [],
  currentChapter: null,
  content: {},
  isLoading: false,
  error: null,
};

function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'SET_BOOK_DATA':
      return {
        ...state,
        metadata: action.payload.metadata,
        chapters: action.payload.chapters,
        content: action.payload.content,
        error: null,
        isLoading: false,
      };
    case 'SET_CURRENT_CHAPTER':
      return {
        ...state,
        currentChapter: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const BookContext = createContext<{
  state: BookState;
  dispatch: React.Dispatch<BookAction>;
} | null>(null);

export function BookProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  return (
    <BookContext.Provider value={{ state, dispatch }}>
      {children}
    </BookContext.Provider>
  );
}

export function useBook() {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBook must be used within a BookProvider');
  }
  return context;
}
