'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressPhoto } from '@/types';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PhotoUploadProps {
  alunoId: string;
  photos: ProgressPhoto[];
}

export default function PhotoUpload({ alunoId, photos }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [weekNumber, setWeekNumber] = useState('');
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !weekNumber) {
      alert('Por favor, selecione uma foto e informe o número da semana');
      return;
    }

    setUploading(true);
    const file = e.target.files[0];

    try {
      // Upload da foto para o Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${alunoId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);

      // Inserir registro no banco
      const { error: dbError } = await supabase.from('progress_photos').insert({
        aluno_id: alunoId,
        photo_url: publicUrl,
        week_number: parseInt(weekNumber),
        notes: notes || null,
      });

      if (dbError) throw dbError;

      // Reset form
      setWeekNumber('');
      setNotes('');
      e.target.value = '';

      router.refresh();
    } catch (error: any) {
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <ImageIcon size={24} />
        Fotos de Progresso
      </h2>

      {/* Upload Form */}
      <div className="mb-6 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Semana
            </label>
            <input
              type="number"
              min="1"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="Ex: 1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Foto
            </label>
            <label className="flex items-center justify-center w-full px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md cursor-pointer transition-colors">
              <Upload size={18} className="mr-2" />
              {uploading ? 'Enviando...' : 'Selecionar'}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Observações (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            placeholder="Como você está se sentindo?"
          />
        </div>
      </div>

      {/* Photos Grid */}
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <div className="aspect-square bg-gray-700 rounded-lg overflow-hidden">
              <Image
                src={photo.photo_url}
                alt={`Semana ${photo.week_number}`}
                width={300}
                height={300}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-xs text-white">
              <p className="font-semibold">Semana {photo.week_number}</p>
              {photo.notes && <p className="text-gray-300">{photo.notes}</p>}
            </div>
          </div>
        ))}
      </div>

      {photos.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          Nenhuma foto enviada ainda
        </p>
      )}
    </div>
  );
}
