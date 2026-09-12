import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  X, 
  Loader2, 
  FolderGit2,
  Paperclip
} from 'lucide-react';

interface TaskProofSubmitterProps {
  valueUrl: string;
  valueName?: string;
  onChange: (url: string, fileName?: string) => void;
  facultyName?: string;
  taskName?: string;
  disabled?: boolean;
}

const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvqiDv2QH_fdSZptr0-RFqm99Grwe4vVpYzCVPhd6qLWH8-qs4-GM0lRKZbp4wSpN6/exec";

export const TaskProofSubmitter: React.FC<TaskProofSubmitterProps> = ({
  valueUrl,
  valueName,
  onChange,
  facultyName = 'Faculty Member',
  taskName = 'Assigned Duty',
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const appsScriptUrl = 
    (import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL as string) || 
    DEFAULT_APPS_SCRIPT_URL;

  // Convert File to base64 string without data prefix
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file || disabled || uploading) return;

    setUploading(true);
    setErrorMessage('');
    setUploadStatus('Reading file...');
    setUploadProgress(20);

    try {
      const base64Data = await fileToBase64(file);

      setUploadProgress(45);
      setUploadStatus(`Uploading to Google Drive (${facultyName} / ${taskName})...`);

      const payload = {
        facultyName: facultyName.trim() || 'Faculty Member',
        taskName: taskName.trim() || 'Assigned Duty',
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileData: base64Data
      };

      // Progress animation ticker
      const timer = setInterval(() => {
        setUploadProgress(prev => (prev < 90 ? prev + 10 : prev));
      }, 300);

      // Send to Google Apps Script Web App (using text/plain to bypass CORS preflight)
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      clearInterval(timer);
      setUploadProgress(95);
      setUploadStatus('Processing Drive response...');

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Google Drive upload returned unsuccessful status');
      }

      setUploadProgress(100);
      setUploadStatus('Uploaded successfully!');

      setTimeout(() => {
        onChange(result.fileUrl, result.fileName || file.name);
        setUploading(false);
        setUploadProgress(0);
        setUploadStatus('');
      }, 300);

    } catch (err: any) {
      console.error('Google Drive Upload Failed:', err);
      setErrorMessage(err.message || 'Failed to upload file to Google Drive. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (disabled || uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('', '');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[var(--text-primary)]">
          Proof Attachment (Direct Google Drive Upload)
        </label>
        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
          <FolderGit2 className="w-3 h-3 text-blue-500" />
          Auto-saves to Drive: <span className="font-semibold text-blue-600 dark:text-blue-400">{facultyName}</span>
        </span>
      </div>

      {/* 1. UPLOADED FILE SUCCESS STATE */}
      {valueUrl && (
        <div className="p-3.5 bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-xs">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-[var(--text-primary)] truncate">
                  {valueName || 'Uploaded Submission File'}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] text-[var(--text-muted)] truncate">
                Saved in Google Drive: <span className="font-mono text-blue-600 dark:text-blue-400">Faculty Submissions / {facultyName} / {taskName}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={valueUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Submission / Open File ↗
            </a>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
              title="Replace / Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. FILE UPLOAD DROPZONE / BUTTON */}
      {!valueUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && !disabled && fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all ${
            disabled ? 'opacity-60 cursor-not-allowed border-slate-300' :
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 cursor-pointer'
              : 'border-[var(--panel-border)] bg-[var(--card-bg-to)] hover:border-blue-400 cursor-pointer'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            disabled={disabled || uploading}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.txt"
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{uploadStatus || 'Uploading to Google Drive...'} ({uploadProgress}%)</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full max-w-xs mx-auto bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                Creating folder structure & uploading to your Google Drive...
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="w-11 h-11 mx-auto rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Choose File or Drag & Drop to Upload
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  PDF, Images, Word Documents, Excel, PPT or ZIP
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  disabled={disabled}
                  className="btn-secondary text-xs py-1.5 px-3.5 inline-flex items-center gap-1.5 font-bold pointer-events-none"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Choose File
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-600 dark:text-rose-400 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
