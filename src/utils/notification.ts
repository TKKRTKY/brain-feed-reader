/**
 * エラーメッセージを表示するユーティリティ関数
 * 将来的にはToast通知などに置き換え可能
 */
export const showError = (message: string): void => {
  // 開発段階では単純なalertを使用
  alert(message);
};

/**
 * 成功メッセージを表示するユーティリティ関数
 */
export const showSuccess = (message: string): void => {
  // 開発段階では単純なalertを使用
  alert(message);
};
