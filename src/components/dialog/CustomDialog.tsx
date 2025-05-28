"use client";

import React from 'react';
import { createPortal } from 'react-dom';

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  content: string;
  type: 'alert' | 'confirm';
}

export default function CustomDialog({ 
  isOpen,
  onClose,
  onConfirm,
  title,
  content,
  type
}: CustomDialogProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">{title}</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{content}</p>
        </div>
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          {type === 'confirm' ? (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                削除
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              閉じる
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
