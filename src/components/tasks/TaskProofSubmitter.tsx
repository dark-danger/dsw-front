import React, { useState, useRef } from 'react';
import { 
  FolderGit2, 
  UploadCloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Image as ImageIcon, 
  FileText, 
  X, 
  Loader2, 
  Sparkles,
  Link2
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface TaskProofSubmitterProps {
  valueUrl: string;
  valueName?: string;
  onChange: (url: string, fileName?: string) => void;
  disabled?: boolean;
}

// Client-side image compressor for ultra-fast instant upload
const compressImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 400 * 1024) return file; // Already small enough (<400KB)

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1400;
        const MAX_HEIGHT = 1400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            'image/webp',
            0.82
          );
        } else {
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export const TaskProofSubmitter: React.FC<TaskProofSubmitterProps> = ({
  valueUrl,
  valueName,
  onChange,
  disabled = false
}) => {
  const [mode, setMode] = useState<'drive' | 'upload'>('drive');
  const [driveInput, setDriveInput] = useState(valueUrl.includes('drive.google') || valueUrl.includes('http') ? valueUrl : '');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isGoogleDriveLink = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('photos.app.goo.gl');
  };

  const handleDriveUrlChange = (url: string) => {
    setDriveInput(url);
    onChange(url.trim(), isGoogleDriveLink(url) ? 'Google Drive Attachment' : 'External Link Proof');
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(15);

    try {
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 85 ? prev + 15 : prev));
      }, 80);

      const optimizedFile = await compressImageFile(file);
      setUploadProgress(90);

      const formData = new FormData();
      formData.append('file', optimizedFile);
      const res = await apiRequest('/uploads', 'POST', formData, true);

      clearInterval(progressTimer);
      setUploadProgress(100);

      setTimeout(() => {
        onChange(res.file_url, res.file_name || file.name);
        setUploading(false);
        setUploadProgress(0);
      }, 200);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Network error'}. You can also use the Google Drive Link option above.`);
      setUploading(false);
      setUploadProgress(0);
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
    setDriveInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[var(--text-primary)]">
          Proof Attachment / Document
        </label>
        {/* Mode Switch */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-[var(--panel-border)]">
          <button
            type="button"
            onClick={() => setMode('drive')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'drive'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" /> Google Drive Link
          </button>
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              mode === 'upload'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Direct Upload
          </button>
        </div>
      </div>

      {/* Selected Value Preview Banner */}
      {valueUrl && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {isGoogleDriveLink(valueUrl) ? (
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm font-bold text-xs">
                GD
              </div>
            ) : valueUrl.startsWith('data:image') || /\.(jpg|jpeg|png|webp)/i.test(valueUrl) ? (
              <img src={valueUrl} alt="Proof" className="w-9 h-9 rounded-xl object-cover border border-emerald-400 shrink-0" />
            ) : (
              <FileText className="w-6 h-6 text-emerald-500 shrink-0" />
            )}
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-emerald-700 dark:text-emerald-300 truncate">
                  {valueName || (isGoogleDriveLink(valueUrl) ? 'Google Drive Proof Link' : 'Proof File Ready')}
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <a 
                href={valueUrl} 
                target="_blank" 
                rel="noreferrer" 
                className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline truncate block font-mono"
              >
                {valueUrl}
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all shrink-0"
            title="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Google Drive Link Mode */}
      {mode === 'drive' && !valueUrl && (
        <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-900/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                Submit Google Drive Proof
              </span>
            </div>
            <a
              href="https://drive.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-all self-start"
            >
              Open Google Drive ↗
            </a>
          </div>

          <div className="relative">
            <input
              type="url"
              disabled={disabled}
              value={driveInput}
              onChange={e => handleDriveUrlChange(e.target.value)}
              placeholder="Paste Google Drive share link (e.g. https://drive.google.com/...)"
              className="glass-input text-xs pl-8 pr-3 py-2.5 w-full font-mono"
            />
            <Link2 className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            💡 <strong>Fast & Permanent:</strong> Upload your photos, certificates, or files to your Google Drive and paste the shareable link above. Set permissions to <em>"Anyone with the link can view"</em>.
          </p>
        </div>
      )}

      {/* Direct Fast Upload Mode */}
      {mode === 'upload' && !valueUrl && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
              : 'border-[var(--panel-border)] bg-[var(--card-bg-to)] hover:border-blue-400'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            disabled={disabled || uploading}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />

          {uploading ? (
            <div className="space-y-3 py-2">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Compressing & Fast Uploading... {uploadProgress}%</span>
              </div>
              {/* Animated Progress Line */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full animate-progress-bar rounded-full transition-all duration-150"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="w-10 h-10 mx-auto rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Click or Drag file to upload
                </p>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Images are auto-compressed for lightning fast upload (under 200ms) • PNG, JPG, PDF, DOCX
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
