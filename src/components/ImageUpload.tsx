import { useState, useRef, useCallback } from 'react';
import { analyzeImage } from '../services/aiApi';
import type { PendingFood } from '../types';
import { FoodResult } from './FoodResult';

function compressImage(dataUrl: string, maxPx = 1024, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

interface Props {
  onAdd: (food: PendingFood) => void;
  onError: (msg: string) => void;
}

export function ImageUpload({ onAdd, onError }: Props) {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PendingFood | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }
    setResult(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const raw = e.target?.result as string;
      const compressed = await compressImage(raw);
      setPreview(compressed);
      setImageBase64(compressed.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  async function handleAnalyze() {
    if (!imageBase64) return;
    setAnalyzing(true);
    setResult(null);

    try {
      const data = await analyzeImage(imageBase64, 'image/jpeg');
      setResult({
        name: data.name,
        imagePreview: preview ?? undefined,
        baseServingSize: data.estimatedGrams,
        servingSize: data.estimatedGrams,
        nutritionPer100g: data.nutritionPer100g,
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setPreview(null);
    setImageBase64(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
            dragging
              ? 'border-emerald-400 bg-emerald-50'
              : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
          <div className="text-4xl mb-3">{dragging ? '📂' : '📷'}</div>
          <p className="text-gray-600 font-medium">
            {dragging ? 'Drop it here!' : 'Drop a food photo here'}
          </p>
          <p className="text-gray-400 text-sm mt-1">or tap to take / browse a photo</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden">
            <img src={preview} alt="Food" className="w-full h-52 object-cover" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center hover:bg-black/70 transition-colors text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {!result && (
            <button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Analyzing with AI…
                </>
              ) : (
                '✨  Analyze Food'
              )}
            </button>
          )}
        </div>
      )}

      {result && (
        <FoodResult
          food={result}
          onChange={setResult}
          onAdd={(food) => {
            onAdd(food);
            reset();
          }}
        />
      )}
    </div>
  );
}
