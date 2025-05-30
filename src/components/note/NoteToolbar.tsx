import React from 'react';
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="7 10 12 15 17 10"></polyline>
    <line x1="12" y1="15" x2="12" y2="3"></line>
  </svg>
);

interface NoteToolbarProps {
  onPreviewToggle: () => void;
  onExport: () => void;
  showPreview: boolean;
  className?: string;
  onSummaryRequest?: () => void;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ onClick, icon, label }) => (
  <button
    onClick={onClick}
    className="flex items-center px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
    title={label}
  >
    {icon}
    <span className="ml-1">{label}</span>
  </button>
);

export const NoteToolbar: React.FC<NoteToolbarProps> = ({
  onPreviewToggle,
  onExport,
  showPreview,
  className = '',
  onSummaryRequest,
}) => {
  const insertMarkdown = (type: string) => {
    const editor = document.querySelector('[role="textbox"]') as HTMLTextAreaElement;
    if (!editor) return;

    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    let insertion = '';

    switch (type) {
      case 'bold':
        insertion = `**${text.slice(start, end) || '太字'}**`;
        break;
      case 'italic':
        insertion = `*${text.slice(start, end) || 'イタリック'}*`;
        break;
      case 'code':
        insertion = `\`${text.slice(start, end) || 'コード'}\``;
        break;
      case 'link':
        insertion = `[${text.slice(start, end) || 'リンクテキスト'}](url)`;
        break;
      case 'list':
        insertion = `\n- リストアイテム`;
        break;
      case 'quote':
        insertion = `\n> ${text.slice(start, end) || '引用'}`;
        break;
    }

    const newText = text.slice(0, start) + insertion + text.slice(end);
    editor.value = newText;
    editor.focus();
    editor.selectionStart = start + insertion.length;
    editor.selectionEnd = start + insertion.length;

    // イベントを発火してエディタの変更を通知
    const event = new Event('input', { bubbles: true });
    editor.dispatchEvent(event);
  };

  return (
    <div className={`flex items-center space-x-2 p-2 border-b ${className}`}>
      <div className="flex space-x-1">
        <button
          onClick={() => insertMarkdown('bold')}
          className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded"
          title="太字"
        >
          B
        </button>
        <button
          onClick={() => insertMarkdown('italic')}
          className="px-2 py-1 text-sm italic hover:bg-gray-100 rounded"
          title="イタリック"
        >
          I
        </button>
        <button
          onClick={() => insertMarkdown('code')}
          className="px-2 py-1 text-sm font-mono hover:bg-gray-100 rounded"
          title="コード"
        >
          {'</>'}
        </button>
      </div>

      <div className="flex space-x-1 border-l pl-2">
        <button
          onClick={() => insertMarkdown('link')}
          className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
          title="リンク"
        >
          🔗
        </button>
        <button
          onClick={() => insertMarkdown('list')}
          className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
          title="リスト"
        >
          •
        </button>
        <button
          onClick={() => insertMarkdown('quote')}
          className="px-2 py-1 text-sm hover:bg-gray-100 rounded"
          title="引用"
        >
          "
        </button>
      </div>

      <div className="flex-grow" />

      <div className="flex space-x-1">
        <ToolbarButton
          onClick={onPreviewToggle}
          icon={<ViewIcon />}
          label={showPreview ? "プレビューを非表示" : "プレビューを表示"}
        />
        <ToolbarButton
          onClick={onExport}
          icon={<DownloadIcon />}
          label="エクスポート"
        />
      </div>

      <div className="flex space-x-1 border-l pl-2">
        <ToolbarButton
          onClick={() => onSummaryRequest?.()}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <line x1="10" y1="9" x2="8" y2="9"></line>
            </svg>
          }
          label="要約を挿入"
        />
      </div>
    </div>
  );
};
