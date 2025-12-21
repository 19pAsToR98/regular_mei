import React, { useState } from 'react';
import { supabase } from '../src/integrations/supabase/client';
import { showError, showSuccess } from '../utils/toastUtils';

interface FileUploadProps {
  bucket: string;
  path: string; // Caminho dentro do bucket (ex: 'assistant/icon.gif')
  onUploadSuccess: (url: string) => void;
  accept: string;
  currentUrl?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ bucket, path, onUploadSuccess, accept, currentUrl }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError('Selecione um arquivo primeiro.');
      return;
    }

    setLoading(true);

    try {
      // 1. Upload the file, replacing the existing one at the specified path
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true, // Overwrite existing file
        });

      if (error) {
        throw error;
      }

      // 2. Get the public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      if (!publicUrlData.publicUrl) {
        throw new Error('Falha ao obter URL pública.');
      }

      onUploadSuccess(publicUrlData.publicUrl);
      showSuccess('Arquivo enviado com sucesso!');
      setFile(null); // Clear file input after successful upload

    } catch (error: any) {
      console.error('Upload error:', error);
      showError(`Erro no upload: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
      <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload de Arquivo</h5>
      
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="flex-1 text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
        />
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || loading}
          className="bg-primary hover:bg-blue-600 disabled:bg-slate-300 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Enviando
            </>
          ) : (
            <>
              <span className="material-icons text-sm">upload</span>
              Upload
            </>
          )}
        </button>
      </div>
      
      {currentUrl && (
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate pt-2 border-t border-slate-100 dark:border-slate-700">
              URL Atual: <a href={currentUrl} target="_blank" className="text-primary hover:underline">{currentUrl}</a>
          </div>
      )}
    </div>
  );
};

export default FileUpload;