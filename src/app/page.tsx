"use client";

import { FileUpload } from "@/components/upload/FileUpload";
import { BookViewer } from "@/components/viewer/BookViewer";
import { showError, showSuccess } from "@/utils/notification";
import { BookProvider, useBook } from "@/contexts/BookContext";
import type { EPubFile } from "@/types/epub";
import { parseEPub } from "@/utils/epubParser";

function HomeContent() {
  const { state, dispatch } = useBook();

  const handleFileSelect = async (file: EPubFile) => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await parseEPub(file);
      dispatch({ type: "SET_BOOK_DATA", payload: result });
      showSuccess(`${file.name}を読み込みました`);
    } catch (error) {
      if (error instanceof Error) {
        showError(error.message);
      } else {
        showError("ファイルの処理中にエラーが発生しました");
      }
      dispatch({ type: "SET_ERROR", payload: "ファイルの処理中にエラーが発生しました" });
    }
  };

  const handleError = (error: string) => {
    showError(error);
    dispatch({ type: "SET_ERROR", payload: error });
  };

  const handleChapterSelect = (href: string) => {
    dispatch({ type: "SET_CURRENT_CHAPTER", payload: href });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Brain Feed Reader
      </h1>
      <div className="max-w-4xl mx-auto">
        {state.isLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 border-r-2 border-b-2 border-gray-200"></div>
              <p className="mt-4 text-gray-600">処理中...</p>
            </div>
          </div>
        ) : state.metadata ? (
          <BookViewer
            metadata={state.metadata}
            chapters={state.chapters}
            content={state.content}
            onChapterSelect={handleChapterSelect}
          />
        ) : (
          <FileUpload onFileSelect={handleFileSelect} onError={handleError} />
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <BookProvider>
      <HomeContent />
    </BookProvider>
  );
}
