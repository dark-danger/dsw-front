import React, { useState } from 'react';
import { 
  FolderGit2, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Eye, 
  X, 
  Download,
  Maximize2
} from 'lucide-react';

interface ProofViewerProps {
  url?: string;
  fileName?: string;
  className?: string;
}

export const ProofViewer: React.FC<ProofViewerProps> = ({
  url,
  fileName,
  className = ''
}) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!url) return null;

  const isGoogleDrive = url.includes('drive.google.com') || url.includes('docs.google.com') || url.includes('photos.app.goo.gl');
  const isImage = url.startsWith('data:image') || /\.(jpg|jpeg|png|webp|gif|svg)/i.test(url);
  const isPdf = /\.pdf/i.test(url) || url.includes('application/pdf');

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 1. Google Drive Proof Card */}
      {isGoogleDrive ? (
        <div className="p-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-400/30 dark:border-blue-700/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md font-bold text-xs">
              <FolderGit2 className="w-4 h-4" />
            </div>
            <div className="overflow-hidden min-w-0">
              <span className="font-bold text-xs text-blue-700 dark:text-blue-300 block truncate">
                {fileName || 'Google Drive Proof Document'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate block font-mono">
                {url}
              </span>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all shrink-0 active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Open Drive File ↗
          </a>
        </div>
      ) : isImage ? (
        /* 2. Direct Image Proof with Inline Thumbnail + Lightbox */
        <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> Image Proof Attached
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" /> Click to Enlarge
              </button>
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Open in new tab"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div
            onClick={() => setIsLightboxOpen(true)}
            className="relative group cursor-pointer overflow-hidden rounded-xl border border-[var(--panel-border)] bg-black/40 max-h-48 flex items-center justify-center"
          >
            <img
              src={url}
              alt={fileName || 'Proof image'}
              className="w-full h-auto max-h-48 object-contain transition-transform duration-200 group-hover:scale-102"
              onError={(e) => {
                // Fallback in case local upload URL 404s
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-xs">
              <Eye className="w-4 h-4" /> View Full Image
            </div>
          </div>
        </div>
      ) : (
        /* 3. PDF or Generic Document Card */
        <div className="p-3 bg-[var(--card-bg-to)] border border-[var(--panel-border)] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <FileText className="w-7 h-7 text-amber-500 shrink-0" />
            <div className="overflow-hidden min-w-0">
              <span className="font-bold text-xs text-[var(--text-primary)] block truncate">
                {fileName || (isPdf ? 'PDF Proof Document' : 'Proof Document Attachment')}
              </span>
              <span className="text-[10px] text-[var(--text-muted)] truncate block font-mono">
                {url}
              </span>
            </div>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0 active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View File ↗
          </a>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div 
            className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-3.5 sm:p-4 shadow-2xl relative flex flex-col space-y-3 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-white text-xs">
              <span className="font-bold truncate max-w-[180px] sm:max-w-md">{fileName || 'Proof Image Preview'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                </a>
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center">
              <img
                src={url}
                alt="Full size proof"
                className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
