'use client';

import { FileUpload } from '@/components/upload/FileUpload';
import { showError, showSuccess } from '@/utils/notification';
import type { EPubFile } from '@/types/epub';
import { useState } from 'react';

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (file: EPubFile) => {
    setIsProcessing(true);
    try {
      // TODO: EPUBファイルの処理を実装
      showSuccess(`${file.name}を読み込みました`);
    } catch (error) {
      showError('ファイルの処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleError = (error: string) => {
    showError(error);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Brain Feed Reader
      </h1>
      <div className="max-w-2xl mx-auto">
        {isProcessing ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-blue-600 border-r-2 border-b-2 border-gray-200"></div>
              <p className="mt-4 text-gray-600">処理中...</p>
            </div>
          </div>
        ) : (
          <FileUpload
            onFileSelect={handleFileSelect}
            onError={handleError}
          />
        )}
      </div>
    </main>
  );
}
