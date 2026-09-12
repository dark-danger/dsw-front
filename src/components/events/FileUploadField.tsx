import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

interface FileUploadFieldProps {
  label: string;
  subLabel?: string;
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  isImage?: boolean;
  required?: boolean;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
  label,
  subLabel,
  value,
  onChange,
  accept = "image/*,application/pdf",
  isImage = false,
  required = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds maximum 15MB limit.");
      return;
    }

    setUploading(true);

    // Read as Base64 Data URL for instant rendering & offline-safe report printing
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(dataUrl);
      setUploading(false);
    };
    reader.onerror = () => {
      console.error("FileReader error");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[var(--text-primary)]">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {subLabel && <span className="text-[11px] text-[var(--text-secondary)]">{subLabel}</span>}
      </div>

      {value ? (
        <div className="relative group p-3 bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 overflow-hidden">
            {value.startsWith('data:image') || isImage || value.match(/\.(jpeg|jpg|png|webp|gif)/i) ? (
              <img
                src={value}
                alt="Upload preview"
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-800 shrink-0 bg-white"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" /> Attached Document
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-xs font-mono mt-0.5">
                {value.length > 50 ? `${value.substring(0, 45)}...` : value}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
              title="Preview in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-2xl p-4 text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 ${
            dragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-[var(--panel-border)] hover:border-blue-400/60 hover:bg-slate-50 dark:hover:bg-slate-900/40'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
            accept={accept}
            className="hidden"
          />

          {uploading ? (
            <div className="flex items-center gap-2 text-xs font-medium text-blue-500 py-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing and attaching file...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center">
                {isImage ? <ImageIcon className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  Click to browse or drag & drop {isImage ? 'picture' : 'scanned copy/PDF'}
                </p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                  Supports JPG, PNG, WEBP, PDF (Max 15MB)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
