import { BookMetadata, Chapter, EPubFile } from '@/types/epub';
import ePub from 'epubjs';
import JSZip from 'jszip';

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
    console.log('EPUBファイルの解析を開始します');
    console.log('ファイルの内容:', typeof file.content, file.content instanceof ArrayBuffer ? 'ArrayBuffer' : '');

      // EPUBデータの解凍
      const zip = await JSZip.loadAsync(file.content);
      console.log('EPUBファイルを解凍:', Object.keys(zip.files));

      // ZIPエントリのキャッシュを作成
      const zipEntries = new Map<string, JSZip.JSZipObject>();
      Object.entries(zip.files).forEach(([path, file]) => {
        zipEntries.set(path.toLowerCase(), file);
      });
      console.log('ZIPエントリをキャッシュ:', Array.from(zipEntries.keys()));

      // ファイルの読み込みハンドラを定義
      const requestHandler = async (url: string) => {
        console.log('リソースリクエスト:', url);
        
        // URLからファイルパスを抽出
        const cleanPath = url
          .replace(/^https?:\/\/[^/]+\//, '')
          .replace(/^\/+/, '')
          .toLowerCase();
        console.log('正規化したパス:', cleanPath);

        // 直接マッチを試す
        let zipFile = zipEntries.get(cleanPath);

        // 見つからない場合は、他のパターンを試す
        if (!zipFile) {
          const alternativePaths = [
            `META-INF/${cleanPath}`,
            `OEBPS/${cleanPath}`,
            cleanPath.replace(/^(META-INF\/|OEBPS\/)/, ''),
          ];
          
          for (const altPath of alternativePaths) {
            zipFile = zipEntries.get(altPath.toLowerCase());
            if (zipFile) {
              console.log(`代替パス ${altPath} が見つかりました`);
              break;
            }
          }
        }

        if (zipFile) {
          try {
            const content = await zipFile.async('arraybuffer');
            console.log(`ファイル読み込み完了: ${content.byteLength} bytes`);
            return content;
          } catch (e) {
            console.error('ファイル読み込みエラー:', e);
            throw e;
          }
        }

        console.warn(`ファイルが見つかりません: ${cleanPath}`);
        throw new Error(`File not found: ${cleanPath}`);
      };

      // 重要なファイルを事前に読み込み
      console.log('コンテナファイルを事前読み込み');
      const containerData = await requestHandler('/META-INF/container.xml');
      const containerText = new TextDecoder().decode(containerData);
      const rootFileMatch = containerText.match(/full-path="([^"]+)"/);
      
      if (!rootFileMatch) {
        throw new Error('Could not find root file in container.xml');
      }
      
      const rootFilePath = rootFileMatch[1];
      console.log('ルートファイルのパス:', rootFilePath);
      
      // パッケージファイルを読み込み
      const packageData = await requestHandler(rootFilePath);
      const packageText = new TextDecoder().decode(packageData);
      console.log('パッケージファイル読み込み完了');

      // パッケージファイルのXMLを解析してベースディレクトリを取得
      const parser = new DOMParser();
      const packageDoc = parser.parseFromString(packageText, 'text/xml');
      const itemRefs = packageDoc.querySelectorAll('itemref');
      const items = packageDoc.querySelectorAll('item');

      // ベースディレクトリを特定
      const rootDir = rootFilePath.split('/').slice(0, -1).join('/');
      console.log('コンテンツのルートディレクトリ:', rootDir);

      // href解決用の関数を定義
      const resolveHref = (href: string) => {
        const path = href.startsWith('/') ? href.slice(1) : href;
        return path.includes(rootDir) ? path : `${rootDir}/${path}`;
      };

      // EPUBオブジェクトを作成
      const book = ePub();
      (book as any).request = requestHandler;
      await book.open(file.content);
      console.log('book opened完了');

      // リソースを読み込み
      await book.loaded.metadata;
      console.log('metadata読み込み完了');
      await book.loaded.spine;
      console.log('spine読み込み完了');
      await book.loaded.navigation;
      console.log('navigation読み込み完了');

      console.log('全リソースの読み込み完了');

    // メタデータの取得
    const metadata: BookMetadata = {
      title: book.packaging.metadata.title || '',
      creator: book.packaging.metadata.creator || undefined,
      language: book.packaging.metadata.language || undefined,
      publisher: book.packaging.metadata.publisher || undefined,
      rights: book.packaging.metadata.rights || undefined,
    };

    // 目次データの取得（ない場合はspineから生成）
    const nav = book.navigation;
    console.log('ナビゲーション:', nav);
    
    let chapters: Chapter[] = [];
    if (nav.toc && nav.toc.length > 0) {
      // 通常の目次がある場合
      chapters = nav.toc.map((item: any) => ({
        id: item.id || '',
        href: item.href,
        title: item.label || 'untitled',
        level: item.level || 0,
        children: item.subitems ? item.subitems.map((subitem: any) => ({
          id: subitem.id || '',
          href: subitem.href,
          title: subitem.label || 'untitled',
          level: (item.level || 0) + 1,
        })) : undefined,
      }));
    } else {
      // 目次がない場合はspineから生成
      console.log('目次が見つからないため、spineから生成します');
      chapters = (book.spine as any).spineItems.map((item: any, index: number) => ({
        id: `spine-${index}`,
        href: item.href,
        title: `Page ${index + 1}`,
        level: 0
      }));
    }

    console.log('最終的な章構成:', chapters);

    // 各チャプターの内容を取得
    const content: Record<string, string> = {};

    for (const chapter of chapters) {
      if (chapter.href) {
        try {
          console.log(`チャプター ${chapter.href} の読み込みを開始`);
          // hrefからハッシュを除去
          const baseHref = chapter.href.split('#')[0];
          
          console.log(`セクション ${baseHref} のロード開始`);

          // セクションのパス解決
          const possiblePaths = new Set([
            baseHref,                                    // 元のパス
            `${rootDir}/text/${baseHref}`,              // rootDir/text/を追加
            `${rootDir}/${baseHref}`,                   // rootDirを追加
            baseHref.replace(/^text\//, `${rootDir}/text/`), // text/をrootDir/text/に置換
            `text/${baseHref}`,                         // text/を追加
          ]);
          console.log('試行するパス:', Array.from(possiblePaths));

          let sectionContent: ArrayBuffer | null = null;
          let successPath = '';

          for (const tryPath of possiblePaths) {
            try {
              sectionContent = await requestHandler(tryPath);
              successPath = tryPath;
              console.log(`成功したパス: ${tryPath}`);
              break;
            } catch (e) {
              console.log(`パス ${tryPath} は失敗`);
            }
          }

          if (!sectionContent) {
            throw new Error(`セクション ${baseHref} の読み込みに失敗しました (試行: ${Array.from(possiblePaths).join(', ')})`);
          }

          // HTMLの解析
          const text = new TextDecoder().decode(sectionContent);
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const html = doc.documentElement.outerHTML;
          console.log(`セクション ${successPath} のロード完了:`, html?.length || 0, 'bytes');


          // 画像リソースを探して事前に読み込み
          const imgSrcRegex = /(src=["'])(.*?)(["'])/g;
          const imgMatches = [...html.matchAll(imgSrcRegex)];
          const imgPromises = imgMatches.map(async ([match, p1, p2, p3]) => {
            if (p2.startsWith('data:')) {
              return { original: match, replacement: match };
            }

            try {
              console.log(`リソースパスの処理: ${p2}`);
              // 画像パスの解決
              if (p2.startsWith('data:') || p2.includes('://')) {
                return { original: match, replacement: match };
              }

              // 画像の相対パスを解決
              const basePath = successPath.split('/').slice(0, -1).join('/');
              const normalizedPath = p2.startsWith('/')
                ? resolveHref(p2.slice(1))  // 絶対パスの場合
                : resolveHref(`${basePath}/${p2}`);  // 相対パスの場合
              console.log(`画像パスを解決: ${p2} -> ${normalizedPath}`);
              console.log(`正規化されたパス:`, normalizedPath);

              // 画像データの読み込みとBase64変換
              const resourceData = await requestHandler(normalizedPath);
              const uint8Array = new Uint8Array(resourceData);
              const base64 = btoa(
                Array.from(uint8Array)
                  .map(byte => String.fromCharCode(byte))
                  .join('')
              );
              console.log(`画像データを変換: ${uint8Array.length} bytes -> Base64`);

              // MIMEタイプの判定
              let mimeType: string | undefined;

              // 1. 拡張子から判定
              const ext = normalizedPath.split('.').pop()?.toLowerCase() || '';
              const mimeTypes = {
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg',
                'png': 'image/png',
                'gif': 'image/gif',
                'svg': 'image/svg+xml',
                'webp': 'image/webp',
                'bmp': 'image/bmp',
                'tiff': 'image/tiff',
                'tif': 'image/tiff'
              };
              mimeType = mimeTypes[ext as keyof typeof mimeTypes];

              // 2. マジックナンバーから判定
              if (!mimeType) {
          // バイナリデータからシグネチャを取得
          const signature = Array.from(new Uint8Array(resourceData).slice(0, 4))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
                console.log(`画像のマジックナンバー: ${signature}`);
                
                // 一般的な画像フォーマットのシグネチャをチェック
                const signatureMap: { [key: string]: string } = {
                  '89504e47': 'image/png',  // PNG
                  'ffd8ffe0': 'image/jpeg', // JPEG
                  'ffd8ffe1': 'image/jpeg', // JPEG (EXIF)
                  'ffd8ffdb': 'image/jpeg', // JPEG (JFIF)
                  '47494638': 'image/gif',  // GIF
                };

                const sigKey = signature.slice(0, 8).toLowerCase();
                mimeType = signatureMap[sigKey];
                
                if (!mimeType) {
                  console.warn(`未知の画像形式: 拡張子=${ext}, マジックナンバー=${signature}`);
                  return { original: match, replacement: match };
                }
              }
              
              const blob = `data:${mimeType};base64,${base64}`;
              console.log(`変換後のURL:`, blob);
              return {
                original: match,
                replacement: `${p1}${blob}${p3}`
              };
            } catch (error) {
              console.warn(`リソース ${p2} の読み込みに失敗:`, error);
              return { original: match, replacement: match };
            }
          });

          // 全ての画像を並行して処理
          const replacements = await Promise.all(imgPromises);
          
          // HTMLを更新
          let modifiedHtml = html;
          for (const { original, replacement } of replacements) {
            modifiedHtml = modifiedHtml.replace(original, replacement);
          }
          content[chapter.href] = modifiedHtml;
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
