import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiRequest } from '../../lib/api';
import { FileText, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface FormField {
  field_id: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'dropdown' | 'file';
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
  public_slug: string;
}

export const PublicDynamicFormPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [form, setForm] = useState<DynamicFormItem | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    setSubmitting(true);
    setError('');

    try {
      await apiRequest(`/forms/public/${slug}/submit`, 'POST', formData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Loading public form...
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-slate-950 px-4">
        <div className="glass-panel p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-slate-100">Form Unavailable</h2>
          <p className="text-xs text-slate-400 mt-2">{error || 'This form does not exist or has been closed by DSW Admin.'}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#040806] px-4">
        <div className="glass-panel p-8 max-w-md text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-bold text-white">Submission Received!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Your form response has been successfully logged into the Geeta University DSW database and synced to Google Sheets.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[#040806] p-4 relative">
      <div className="w-full max-w-xl glass-panel p-8 relative shadow-2xl space-y-6">
        <div className="border-b border-white/10 pb-4">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {form.purpose_label}
          </span>
          <h1 className="text-2xl font-bold text-white mt-2">{form.title}</h1>
          <p className="text-xs text-slate-300 mt-1">{form.description || 'Geeta University Dean of Student Welfare Portal'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {form.form_schema.map(field => (
            <div key={field.field_id}>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {field.label} {field.required && <span className="text-rose-400">*</span>}
              </label>

              {field.type === 'dropdown' ? (
                <select
                  required={field.required}
                  value={formData[field.field_id] || ''}
                  onChange={e => handleChange(field.field_id, e.target.value)}
                  className="glass-input"
                >
                  <option value="">-- Select Option --</option>
                  {field.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  required={field.required}
                  type={field.type === 'phone' ? 'tel' : field.type}
                  value={formData[field.field_id] || ''}
                  onChange={e => handleChange(field.field_id, e.target.value)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className="glass-input"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full btn-primary justify-center py-2.5 mt-4"
          >
            {submitting ? 'Submitting Form...' : 'Submit Response'} <Send className="w-4 h-4 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
};
