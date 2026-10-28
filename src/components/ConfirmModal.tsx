import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment?: string) => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger' | 'success';
  requireComment?: boolean;
  commentPlaceholder?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  requireComment = false,
  commentPlaceholder = 'Add optional note or comment...',
  isLoading = false
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(comment);
    setComment('');
  };

  const variantButtonStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white'
  }[confirmVariant];

  const variantIcon = {
    primary: <Info className="w-6 h-6 text-indigo-600" />,
    danger: <AlertTriangle className="w-6 h-6 text-rose-600" />,
    success: <CheckCircle className="w-6 h-6 text-emerald-600" />
  }[confirmVariant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              {variantIcon}
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1.5">{title}</h3>
          <p className="text-sm text-slate-600 mb-4">{message}</p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reviewer Notes / Feedback {requireComment && <span className="text-rose-500">*</span>}
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder={commentPlaceholder}
              rows={3}
              className="w-full text-sm rounded-xl border border-slate-300 p-2.5 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading || (requireComment && !comment.trim())}
              className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 ${variantButtonStyles} ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
