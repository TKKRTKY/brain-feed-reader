# Brain Feed Reader

電子書籍を脳に直接流し込むWebアプリケーション。EPUBファイルをアップロードし、AIによる要約機能を活用して効率的に内容を把握できます。

## 主な機能

- 📚 **EPUBビューワー**: EPUBファイルのアップロードと閲覧
- 🤖 **AI要約**: 章単位または選択範囲の内容をAIが要約
- 📝 **[WIP]メモ機能**: Markdown形式でメモを記録

## 技術スタック

- Framework: Next.js
- Language: TypeScript
- UI: React
- Styling: Tailwind CSS

## 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/brain-feed-reader.git
cd brain-feed-reader

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

## LLM設定

このアプリケーションは要約機能のために、LLMサーバーとの接続が必要です。
OpenAPIなどのAPIを利用することもできますが、ローカルでOllamaを使用する場合は下記の手順でサーバーを起動をしてください。

```bash
# Ollamaのインストール（Mac）
brew install ollama

# Qwen3モデルのダウンロードと起動
ollama pull qwen3:4b
ollama run qwen3:4b
```

## ライセンス

MIT
