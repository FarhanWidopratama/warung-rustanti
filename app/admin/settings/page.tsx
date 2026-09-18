'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Image as ImageIcon, X, Save, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { compressImage } from '@/lib/imageCompression';

export default function AdminSettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [qrisImageUrl, setQrisImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'qris_image_url')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching settings:', error);
        return;
      }

      if (data?.value) {
        setQrisImageUrl(data.value);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar!');
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB!');
      return;
    }

    try {
      // Compress image
      const compressedFile = await compressImage(file);
      setSelectedFile(compressedFile);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Gagal memproses gambar');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Pilih gambar terlebih dahulu!');
      return;
    }

    try {
      setIsUploading(true);

      // Upload to Supabase Storage
      const fileName = `qris-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('qris-images')
        .upload(fileName, selectedFile, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Gagal upload gambar: ' + uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('qris-images')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Save to settings table
      const { error: settingsError } = await supabase
        .from('settings')
        .upsert({
          key: 'qris_image_url',
          value: publicUrl,
        });

      if (settingsError) {
        console.error('Settings error:', settingsError);
        alert('Gagal menyimpan settings: ' + settingsError.message);
        return;
      }

      // Delete old image if exists
      if (qrisImageUrl) {
        const oldFileName = qrisImageUrl.split('/').pop();
        if (oldFileName && oldFileName !== fileName) {
          await supabase.storage
            .from('qris-images')
            .remove([oldFileName]);
        }
      }

      setQrisImageUrl(publicUrl);
      setSelectedFile(null);
      setPreviewImage('');
      alert('✅ QRIS berhasil diupload!');
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Hapus gambar QRIS? Customer tidak akan bisa lihat QRIS!')) {
      return;
    }

    try {
      setIsUploading(true);

      // Delete from storage
      if (qrisImageUrl) {
        const fileName = qrisImageUrl.split('/').pop();
        if (fileName) {
          await supabase.storage.from('qris-images').remove([fileName]);
        }
      }

      // Update settings
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'qris_image_url',
          value: '',
        });

      if (error) {
        console.error('Error:', error);
        alert('Gagal menghapus');
        return;
      }

      setQrisImageUrl('');
      alert('✅ QRIS dihapus!');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fff8f7] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c83e23] mx-auto mb-4"></div>
          <p className="text-lg text-[#5a413c]">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8f7]">
      {/* Header */}
      <div className="bg-white border-b-2 border-[#e6ded6] sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 hover:bg-[#f5efeb] rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-[#1e1b1b]" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1e1b1b]">⚙️ Pengaturan Admin</h1>
              <p className="text-sm text-[#5a413c]">Upload QRIS & Kelola Settings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* QRIS Section */}
        <div className="bg-white rounded-2xl p-6 shadow-card border-2 border-[#e6ded6] mb-6">
          <h2 className="text-lg font-bold text-[#1e1b1b] mb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            QRIS Ibu Sri
          </h2>
          <p className="text-sm text-[#5a413c] mb-4">
            Upload gambar QRIS untuk ditampilkan ke customer saat checkout
          </p>

          {/* Current QRIS */}
          {qrisImageUrl ? (
            <div className="mb-6">
              <p className="text-xs font-semibold text-[#1e1b1b] mb-2">
                📱 QRIS Saat Ini:
              </p>
              <div className="relative">
                <img
                  src={qrisImageUrl}
                  alt="QRIS"
                  className="w-full max-w-sm mx-auto rounded-xl border-2 border-[#e6ded6] shadow-md"
                />
                <div className="flex gap-2 mt-3 justify-center">
                  <button
                    onClick={() => setShowPreview(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#f5efeb] text-[#1e1b1b] rounded-lg hover:bg-[#e6ded6] transition"
                  >
                    <Eye className="w-4 h-4" />
                    Preview
                  </button>
                  <button
                    onClick={handleRemove}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-8 border-2 border-dashed border-[#e6ded6] rounded-xl text-center">
              <ImageIcon className="w-12 h-12 text-[#8c827a] mx-auto mb-2" />
              <p className="text-sm text-[#5a413c]">Belum ada QRIS</p>
            </div>
          )}

          {/* Upload New */}
          <div className="border-t-2 border-[#e6ded6] pt-6">
            <p className="text-xs font-semibold text-[#1e1b1b] mb-3">
              {qrisImageUrl ? '🔄 Upload QRIS Baru:' : '📤 Upload QRIS:'}
            </p>

            {/* Preview Selected Image */}
            {previewImage && (
              <div className="mb-4">
                <p className="text-xs text-[#5a413c] mb-2">Preview:</p>
                <div className="relative">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full max-w-sm mx-auto rounded-xl border-2 border-[#c83e23] shadow-md"
                  />
                  <button
                    onClick={() => {
                      setPreviewImage('');
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f5efeb] text-[#1e1b1b] border-2 border-[#e6ded6] rounded-xl hover:bg-[#e6ded6] transition disabled:opacity-50"
              >
                <Upload className="w-5 h-5" />
                {previewImage ? 'Pilih Gambar Lain' : 'Pilih Gambar'}
              </button>

              {previewImage && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#c83e23] text-white rounded-xl hover:bg-[#a8321b] transition disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan QRIS
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-[#8c827a] mt-3">
              💡 Tips: Upload screenshot QRIS dari aplikasi bank. Gambar akan otomatis dikompres.
            </p>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Storage Info */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-blue-900 mb-2">
              📦 Storage Info
            </h3>
            <p className="text-xs text-blue-700 mb-1">
              • Gambar otomatis dikompres &lt;500KB
            </p>
            <p className="text-xs text-blue-700 mb-1">
              • Format: JPG/PNG
            </p>
            <p className="text-xs text-blue-700">
              • Tersimpan di Supabase Storage
            </p>
          </div>

          {/* Usage Info */}
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <h3 className="text-sm font-bold text-green-900 mb-2">
              ✅ Penggunaan
            </h3>
            <p className="text-xs text-green-700 mb-1">
              • Muncul di checkout page (payment QRIS)
            </p>
            <p className="text-xs text-green-700 mb-1">
              • Customer bisa scan langsung
            </p>
            <p className="text-xs text-green-700">
              • Ganti kapan aja kalau QRIS berubah
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mt-4">
          <h3 className="text-sm font-bold text-yellow-900 mb-2">
            📝 Cara Upload QRIS:
          </h3>
          <ol className="text-xs text-yellow-800 space-y-1 ml-4 list-decimal">
            <li>Buka aplikasi bank (BCA Mobile, Mandiri, BRI, dll)</li>
            <li>Cari menu "QRIS" atau "Terima Pembayaran"</li>
            <li>Screenshot QRIS code nya</li>
            <li>Klik "Pilih Gambar" di atas</li>
            <li>Pilih screenshot tadi</li>
            <li>Preview muncul → klik "Simpan QRIS"</li>
            <li>Selesai! Customer bisa scan QRIS saat checkout ✨</li>
          </ol>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && qrisImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPreview(false)}
        >
          <button
            onClick={() => setShowPreview(false)}
            className="absolute top-4 right-4 bg-white text-black p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="text-center">
            <img
              src={qrisImageUrl}
              alt="QRIS Preview"
              className="max-w-full max-h-[80vh] rounded-lg mx-auto"
            />
            <p className="text-white mt-4 text-sm">
              Ini yang dilihat customer saat checkout dengan QRIS
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
