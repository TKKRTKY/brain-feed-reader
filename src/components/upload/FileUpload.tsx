import { ChangeEvent, useCallback } from 'react';
import type { EPubFile } from '@/types/epub';

interface FileUploadProps {
  onFileSelect: (file: EPubFile) => void;
  onError: (error: string) => void;
}

export const FileUpload = ({ onFileSelect, onError }: FileUploadProps) => {
  const handleFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // EPUBファイルの検証
    if (!file.name.endsWith('.epub')) {
      onError('EPUBファイルのみアップロード可能です。');
      return;
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const epubFile: EPubFile = {
        name: file.name,
        size: file.size,
        content: arrayBuffer,
      };
      onFileSelect(epubFile);
    } catch (error) {
      onError('ファイルの読み込み中にエラーが発生しました。');
    }
  }, [onFileSelect, onError]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
      <div className="text-center">
        <h3 className="mb-4 text-lg font-semibold">EPUBファイルをアップロード</h3>
        <p className="text-sm text-gray-600 mb-4">
          ドラッグ＆ドロップまたはクリックしてファイルを選択
        </p>
        <input
          type="file"
          accept=".epub"
          onChange={handleFileChange}
          className="hidden"
          id="epub-upload"
        />
        <label
          htmlFor="epub-upload"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors"
        >
          ファイルを選択
        </label>
      </div>
    </div>
  );
};
