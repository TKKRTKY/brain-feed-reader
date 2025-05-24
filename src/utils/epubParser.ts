import { BookMetadata, Chapter, EPubFile } from '@/types/epub';
import ePub from 'epubjs';

export interface EPubParseResult {
  metadata: BookMetadata;
  chapters: Chapter[];
  content: Record<string, string>;
}

export class EPubError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EPubError';
  }
}

export async function parseEPub(file: EPubFile): Promise<EPubParseResult> {
  try {
    // EPUBオブジェクトを作成
    const book = ePub(file.content);
    await book.loaded.metadata;

    // メタデータの取得
    const metadata: BookMetadata = {
      title: book.packaging.metadata.title || '',
      creator: book.packaging.metadata.creator || undefined,
      language: book.packaging.metadata.language || undefined,
      publisher: book.packaging.metadata.publisher || undefined,
      rights: book.packaging.metadata.rights || undefined,
    };

    // 目次データの取得と変換
    const nav = await book.loaded.navigation;
    const chapters: Chapter[] = nav.toc.map((item: any) => ({
      id: item.id || '',
      href: item.href,
      title: item.label,
      level: item.level || 0,
      children: item.subitems ? item.subitems.map((subitem: any) => ({
        id: subitem.id || '',
        href: subitem.href,
        title: subitem.label,
        level: (item.level || 0) + 1,
      })) : undefined,
    }));

    // 各チャプターの内容を取得
    const content: Record<string, string> = {};
    for (const chapter of chapters) {
      if (chapter.href) {
        try {
          const section = await book.spine.get(chapter.href);
          if (section) {
            const doc = await section.load();
            const text = doc.documentElement.textContent || '';
            content[chapter.href] = text;
          }
        } catch (error) {
          console.warn(`チャプター ${chapter.href} の読み込みに失敗しました:`, error);
          content[chapter.href] = '';
        }
      }
    }

    return { metadata, chapters, content };
  } catch (error) {
    console.error('EPUBファイルの解析エラー:', error);
    throw new EPubError('EPUBファイルの解析中にエラーが発生しました');
  }
}
