import React, { useCallback, useEffect, useState, useRef } from 'react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { NoteToolbar } from './NoteToolbar';
import { useNotes } from '../../contexts/NoteContext';
import debounce from 'lodash/debounce';
import { Chapter } from '@/types/epub';
import { useLLM } from '@/contexts/LLMContext';
import { useHighlight, Summary } from '@/contexts/HighlightContext';

interface NoteEditorProps {
  noteId: string;
  initialContent: string;
  className?: string;
  chapters?: Chapter[];
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  noteId,
  initialContent,
  className = '',
  chapters = [],
}) => {
  const { updateNote, exportNote, renderMarkdown } = useNotes();
  const { config } = useLLM();
  const { getSummariesByPage } = useHighlight();
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // 変更を自動保存する
  const debouncedUpdate = useCallback(
    debounce((content: string) => {
      updateNote(noteId, content).catch(console.error);
    }, 1000),
    [noteId, updateNote]
  );

  // プレビューを更新する
  const updatePreview = useCallback(async () => {
    if (!showPreview) return;
    try {
      const html = await renderMarkdown(content);
      setPreview(html);
    } catch (error) {
      console.error('Failed to render markdown:', error);
    }
  }, [content, showPreview, renderMarkdown]);

  // プレビューの更新
  // initialContentが変更されたらエディタの内容を更新
  useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  useEffect(() => {
    updatePreview();
  }, [content, showPreview, updatePreview]);

  // エディタの変更をハンドル
  const handleChange = useCallback((value: string) => {
    setContent(value);
    debouncedUpdate(value);
  }, [debouncedUpdate]);

  // エクスポート
  const handleExport = useCallback(() => {
    exportNote(noteId).catch(console.error);
  }, [noteId, exportNote]);

  const insertSummary = useCallback((summary: string) => {
    const editor = editorRef.current;
    if (!editor || !editor.view) return;

    // カーソル位置に要約を挿入
    const pos = editor.view.state.selection.main.head;
    editor.view.dispatch({
      changes: {
        from: pos,
        insert: summary
      }
    });
  }, []);

  // カーソル位置から現在のセクションを特定
  const getCurrentSection = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || !editor.view) return null;

    const cursorPos = editor.view.state.selection.main.head;
    const lines = content.split('\n');
    let currentPos = 0;
    let currentSection = null;
    let sectionText = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('#')) {
        if (currentPos <= cursorPos && cursorPos <= currentPos + content.slice(currentPos).indexOf('\n')) {
          // カーソルがこの見出しの行にある
          currentSection = { title: line.replace(/^#+\s+/, ''), start: i };
        } else if (currentPos < cursorPos && (!currentSection || currentSection.start < i)) {
          // カーソルがこのセクションの中にある
          currentSection = { title: line.replace(/^#+\s+/, ''), start: i };
        }
      }
      if (currentSection && currentSection.start < i) {
        sectionText += line + '\n';
      }
      currentPos += line.length + 1; // +1 for newline
    }

    return currentSection ? { ...currentSection, text: sectionText } : null;
  }, [content]);

  const findSectionPosition = useCallback((sectionTitle: string) => {
    const lines = content.split('\n');
    let pos = 0;
    let targetPos = 0;
    let found = false;

    for (const line of lines) {
      if (line.includes(sectionTitle)) {
        // セクションのタイトル行を見つけた
        found = true;
      } else if (found && line.includes('このチャプターの要約')) {
        // 要約セクションを見つけた
        targetPos = pos + line.length + 2; // 2は改行分
        break;
      }
      pos += line.length + 1; // 1は改行分
    }

    return found ? targetPos : null;
  }, [content]);

  useEffect(() => {
    const handleSummaryCreated = (event: CustomEvent<Summary>) => {
      if (!editorRef.current || !editorRef.current.view) return;

      const currentSection = getCurrentSection();
      if (!currentSection) return;

      const chapterIndex = chapters.findIndex(ch => {
        if (ch.title === currentSection.title) return true;
        if (currentSection.title.includes(ch.title)) return true;
        if (ch.title.includes(currentSection.title)) return true;
        return false;
      });

      const pageSummaries = getSummariesByPage(chapterIndex);
      if (pageSummaries.length === 0) return;

      const insertPosition = findSectionPosition(currentSection.title);
      if (insertPosition === null) return;

      const summary = pageSummaries[0].text;
      editorRef.current.view.dispatch({
        changes: {
          from: insertPosition,
          insert: summary + '\n\n'
        }
      });

      // 変更を保存
      handleChange(editorRef.current.view.state.doc.toString());
    };

    window.addEventListener('summaryCreated', handleSummaryCreated as EventListener);
    return () => {
      window.removeEventListener('summaryCreated', handleSummaryCreated as EventListener);
    };
  }, [chapters, getSummariesByPage, getCurrentSection, findSectionPosition]);

  const handleSummaryRequest = useCallback(() => {
    const currentSection = getCurrentSection();
    if (!currentSection) {
      alert('要約を挿入する位置を選択してください');
      return;
    }

    const chapterIndex = chapters.findIndex(ch => {
      if (ch.title === currentSection.title) return true;
      if (currentSection.title.includes(ch.title)) return true;
      if (ch.title.includes(currentSection.title)) return true;
      return false;
    });

    const pageSummaries = getSummariesByPage(chapterIndex);
    if (pageSummaries.length === 0) {
      alert('このページの要約がまだありません');
      return;
    }

    const insertPosition = findSectionPosition(currentSection.title);
    if (insertPosition === null) {
      alert('要約を挿入する位置が見つかりませんでした');
      return;
    }

    const summary = pageSummaries[0].text;
    const editor = editorRef.current;
    if (!editor || !editor.view) return;

    editor.view.dispatch({
      changes: {
        from: insertPosition,
        insert: summary + '\n\n'
      }
    });

    handleChange(editor.view.state.doc.toString());
  }, [chapters, getSummariesByPage, getCurrentSection, findSectionPosition]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
        <NoteToolbar
          onPreviewToggle={() => setShowPreview(!showPreview)}
          onExport={handleExport}
          onSummaryRequest={handleSummaryRequest}
          showPreview={showPreview}
          className="sticky top-0 bg-white z-10"
        />

      <div className="flex-1 flex overflow-hidden">
        <div className={`flex-1 ${showPreview ? 'w-1/2' : 'w-full'}`}>
            <CodeMirror
              ref={editorRef as any}
            value={content}
            onChange={handleChange}
            extensions={[
              markdown(),
              EditorView.lineWrapping,
            ]}
            className="h-full overflow-auto"
            theme="light"
            style={{ height: '100%' }}
          />
        </div>

        {showPreview && (
          <div 
            className="flex-1 w-1/2 p-4 overflow-auto border-l prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: preview }}
          />
        )}
      </div>
    </div>
  );
};
