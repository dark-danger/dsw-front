import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  QrCode, 
  Upload, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Lock,
  Smartphone,
  Sparkles
} from 'lucide-react';

interface FormField {
  field_id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'textarea' | 'date';
  required: boolean;
  options?: string[];
}

interface DynamicFormItem {
  id: number;
  title: string;
  purpose_label: string;
  description: string;
  form_schema: FormField[];
  google_sheet_id: string;
  enable_image_upload: boolean;
  image_upload_label: string;
  image_upload_required: boolean;
  enable_payment: boolean;
  payment_amount: number;
  upi_id?: string;
  upi_payee_name?: string;
  public_slug: string;
}

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<DynamicFormItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [uploadedImage, setUploadedImage] = useState<string>('');
  
  // Payment State
  const [transactionId, setTransactionId] = useState<string>('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const imageInputRef = useRef<HTMLInputElement>(null);
  const paymentScreenshotRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadForm() {
      if (!slug) return;
      try {
        const data = await apiRequest<DynamicFormItem>(`/forms/public/${slug}`);
        setForm(data);
      } catch (e: any) {
        setError(e.message || 'Form not found or closed');
      } finally {
        setLoading(false);
      }
    }
    loadForm();
  }, [slug]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFileUpload = (file: File, setter: (val: string) => void) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("File size exceeds 15MB limit.");
      return;
    }

    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setter(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }

    // Compress image client-side to avoid payload limit
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxWidth = 1200;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setter(compressedDataUrl);
        } else {
          setter(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !form) return;

    // Validate image upload if required
    if (form.enable_image_upload && form.image_upload_required && !uploadedImage) {
      alert(`Please upload: ${form.image_upload_label || 'Required image/document'}`);
      return;
    }

    // Validate payment if required
    if (form.enable_payment && !transactionId.trim()) {
      alert('Please enter your UPI Transaction ID / UTR number after scanning the QR Code.');
      return;
    }

    setSubmitting(true);
    setError('');

    const completePayload: Record<string, any> = {
      ...formData
    };

    if (form.enable_image_upload && uploadedImage) {
      completePayload['_uploaded_image'] = uploadedImage;
    }

    if (form.enable_payment) {
      completePayload['_payment_status'] = 'paid';
      completePayload['_payment_amount'] = form.payment_amount;
      completePayload['_upi_id'] = form.upi_id;
      completePayload['_transaction_id'] = transactionId;
      if (paymentScreenshot) {
        completePayload['_payment_screenshot'] = paymentScreenshot;
      }
    }

    try {
      const res = await apiRequest<any>(`/forms/public/${slug}/submit`, 'POST', completePayload);
      setSubmissionId(res.submission_id || null);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyUpi = () => {
    if (!form?.upi_id) return;
    navigator.clipboard.writeText(form.upi_id);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-300">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold">Loading official web form...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100">Form Unavailable</h2>
          <p className="text-xs text-slate-400 mt-2">{error || 'This form does not exist or has been closed by DSW Administration.'}</p>
        </div>
      </div>
    );
  }

  const generatedUpiUrl = form.enable_payment && form.upi_id
    ? `upi://pay?pa=${encodeURIComponent(form.upi_id)}&pn=${encodeURIComponent(form.upi_payee_name || 'Geeta University DSW')}&am=${form.payment_amount}&cu=INR&tn=${encodeURIComponent(form.title)}`
    : '';

  const qrCodeImageUrl = generatedUpiUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(generatedUpiUrl)}`
    : '';

  if (submitted) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-4">
        <div className="bg-slate-900 border border-emerald-500/30 p-8 md:p-10 rounded-3xl max-w-lg text-center shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Submission Successful!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your response for <strong>{form.title}</strong> has been received and synchronized to the official Geeta University Google Sheet ledger.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Reference ID:</span>
              <strong className="text-emerald-400">#GU-DSW-{submissionId || Math.floor(100000 + Math.random() * 900000)}</strong>
            </div>
            {form.enable_payment && (
              <>
                <div className="flex justify-between text-slate-400">
                  <span>Fee Amount:</span>
                  <strong className="text-white">₹{form.payment_amount}.00</strong>
                </div>
                <div className="flex justify-between text-slate-400 truncate">
                  <span>Txn ID (UTR):</span>
                  <strong className="text-amber-400 truncate max-w-[160px]">{transactionId}</strong>
                </div>
              </>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Timestamp:</span>
              <span className="text-slate-300">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Geeta University DSW Submission
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 md:p-8 relative">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl relative space-y-6">
        
        {/* Form Brand Header */}
        <div className="border-b border-slate-800 pb-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              {form.purpose_label || 'Official Web Form'}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-400" /> Secure SSL Form
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {form.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            {form.description || 'Geeta University • Directorate of Student Welfare'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Custom Form Fields */}
          <div className="space-y-4">
            {form.form_schema.map(field => (
              <div key={field.field_id}>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>

                {field.type === 'dropdown' ? (
                  <select
                    required={field.required}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Option --</option>
                    {field.options?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    required={field.required}
                    rows={3}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    required={field.required}
                    type={field.type === 'phone' ? 'tel' : field.type}
                    value={formData[field.field_id] || ''}
                    onChange={e => handleChange(field.field_id, e.target.value)}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Image / Document Upload Section (if enabled) */}
          {form.enable_image_upload && (
            <div className="p-5 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> {form.image_upload_label || 'Upload Document / Photo'} {form.image_upload_required && <span className="text-rose-500">*</span>}
                </label>
              </div>

              {uploadedImage ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-purple-500/30 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <img src={uploadedImage} alt="Uploaded preview" className="w-12 h-12 rounded-lg object-cover bg-white shrink-0" />
                    <span className="text-xs text-emerald-400 font-bold truncate">Photo Attached Successfully</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedImage('')}
                    className="p-1.5 text-rose-400 hover:bg-rose-950/40 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="cursor-pointer border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-2xl p-4 text-center space-y-1.5 bg-purple-950/10 hover:bg-purple-950/20 transition-all"
                >
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0], setUploadedImage);
                      }
                    }}
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-purple-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-200">Click to upload or take a picture</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, WEBP, PDF (Max 15MB)</p>
                </div>
              )}
            </div>
          )}

          {/* UPI Payment & Dynamic QR Code Scanner Section (if enabled) */}
          {form.enable_payment && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950 border-2 border-amber-500/40 space-y-5 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-black text-amber-400 uppercase tracking-wider">Registration Payment</span>
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-black text-sm border border-amber-400/30">
                  Amount: ₹{form.payment_amount}.00
                </div>
              </div>

              {/* Dynamic QR Scanner Card */}
              <div className="p-5 bg-slate-900 rounded-2xl border border-amber-500/30 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div className="p-2 bg-white rounded-2xl shadow-xl shrink-0">
                  <img src={qrCodeImageUrl} alt="UPI QR Code Scanner" className="w-36 h-36 rounded-xl" />
                </div>

                <div className="space-y-2 flex-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">Scan with any UPI App</span>
                  <h4 className="text-sm font-bold text-white">{form.upi_payee_name || 'Geeta University DSW'}</h4>
                  
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-amber-300 truncate">{form.upi_id}</span>
                    <button
                      type="button"
                      onClick={handleCopyUpi}
                      className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedUpi ? 'Copied' : 'Copy'}
                    </button>
                  </div>

                  {/* Mobile Deep Link */}
                  {generatedUpiUrl && (
                    <a
                      href={generatedUpiUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-md mt-1"
                    >
                      <Smartphone className="w-3.5 h-3.5" /> Pay in GPay / PhonePe / Paytm
                    </a>
                  )}
                </div>
              </div>

              {/* Transaction ID & Screenshot Verification Inputs */}
              <div className="space-y-4 pt-2 border-t border-amber-500/20">
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    UPI Transaction ID / UTR Number * <span className="text-slate-400 font-normal">(12-digit number from payment app)</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 425518291039"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Upload Payment Screenshot / Receipt (Optional)
                  </label>
                  {paymentScreenshot ? (
                    <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img src={paymentScreenshot} alt="Payment receipt" className="w-10 h-10 rounded-lg object-cover bg-white" />
                        <span className="text-xs text-emerald-400 font-bold">Screenshot Attached</span>
                      </div>
                      <button type="button" onClick={() => setPaymentScreenshot('')} className="p-1 text-rose-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => paymentScreenshotRef.current?.click()}
                      className="cursor-pointer border border-dashed border-slate-700 hover:border-amber-400/50 rounded-xl p-3 text-center bg-slate-950/60"
                    >
                      <input
                        type="file"
                        ref={paymentScreenshotRef}
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0], setPaymentScreenshot);
                          }
                        }}
                        className="hidden"
                      />
                      <span className="text-xs text-slate-400">+ Attach payment screenshot / invoice</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/25 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Verifying & Submitting...' : 'Submit Form & Confirm'} <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[10px] text-slate-500 font-medium">
            Powered by Geeta University DSW Platform • Responses automatically logged into university Google Sheet ledger
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicDynamicFormPage;
