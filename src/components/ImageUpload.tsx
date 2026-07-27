import { useState, useRef, useCallback } from 'react';
import { analyzeImage } from '../services/aiApi';
import type { PendingFood, MealType } from '../types';
import { defaultMeal, MEAL_LABELS, MEAL_EMOJIS, MEAL_ORDER } from '../types';
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
  const [items, setItems] = useState<PendingFood[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      onError('Please upload an image file');
      return;
    }
    setItems([]);
    setSelectedIndex(null);

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
    setItems([]);
    setSelectedIndex(null);

    try {
      const meal = defaultMeal();
      const data = await analyzeImage(imageBase64, 'image/jpeg');
      const pending: PendingFood[] = data.map((item) => ({
        name: item.name,
        imagePreview: preview ?? undefined,
        baseServingSize: item.estimatedGrams,
        servingSize: item.estimatedGrams,
        nutritionPer100g: item.nutritionPer100g,
        meal,
      }));
      setItems(pending);
      if (pending.length === 1) setSelectedIndex(0);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to analyze image');
    } finally {
      setAnalyzing(false);
    }
  }

  function reset() {
    setPreview(null);
    setImageBase64(null);
    setItems([]);
    setSelectedIndex(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function updateItem(index: number, updated: PendingFood) {
    setItems((prev) => prev.map((item, i) => (i === index ? updated : item)));
  }

  function addItem(index: number) {
    onAdd(items[index]);
    if (items.length === 1) {
      reset();
    } else {
      setItems((prev) => prev.filter((_, i) => i !== index));
      setSelectedIndex(null);
    }
  }

  function setMealForAll(meal: MealType) {
    setItems((prev) => prev.map((item) => ({ ...item, meal })));
  }

  function addAll() {
    items.forEach((item) => onAdd(item));
    reset();
  }

  // If viewing a specific item detail
  if (selectedIndex !== null && items[selectedIndex]) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-xl overflow-hidden">
          <img src={preview!} alt="Food" className="w-full h-40 object-cover" />
        </div>
        <FoodResult
          food={items[selectedIndex]}
          onChange={(f) => updateItem(selectedIndex, f)}
          onAdd={() => addItem(selectedIndex)}
          onBack={() => setSelectedIndex(null)}
        />
      </div>
    );
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
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
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

          {items.length === 0 && (
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
                  Identifying food items…
                </>
              ) : (
                '✨  Analyze Food'
              )}
            </button>
          )}
        </div>
      )}

      {/* Multi-item results */}
      {items.length > 0 && (
        <div className="space-y-3 animate-slide-up">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              {items.length} item{items.length !== 1 ? 's' : ''} detected
            </p>
            <span className="text-xs text-gray-400">Tap item to adjust</span>
          </div>

          {/* Meal selector for all items */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1.5">Add all to:</p>
            <div className="flex gap-1.5 flex-wrap">
              {MEAL_ORDER.map((m) => (
                <button
                  key={m}
                  onClick={() => setMealForAll(m)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    items[0]?.meal === m
                      ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                      : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                  }`}
                >
                  <span>{MEAL_EMOJIS[m]}</span>
                  <span>{MEAL_LABELS[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Item list */}
          <div className="space-y-2">
            {items.map((item, i) => {
              const cal = Math.round((item.nutritionPer100g.calories * item.servingSize) / 100);
              const p = Math.round((item.nutritionPer100g.protein * item.servingSize) / 100 * 10) / 10;
              const c = Math.round((item.nutritionPer100g.carbs * item.servingSize) / 100 * 10) / 10;
              const f = Math.round((item.nutritionPer100g.fat * item.servingSize) / 100 * 10) / 10;
              return (
                <div
                  key={i}
                  className="bg-emerald-50 border border-emerald-100 rounded-xl p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        <span className="text-blue-500">P:{p}g</span> ·{' '}
                        <span className="text-amber-500">C:{c}g</span> ·{' '}
                        <span className="text-purple-500">F:{f}g</span>
                      </p>
                    </div>
                    <span className="text-lg font-bold text-emerald-600 shrink-0">{cal} kcal</span>
                  </div>

                  {/* Inline serving adjuster */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 shrink-0">Qty:</span>
                    <button
                      onClick={() => updateItem(i, { ...item, servingSize: Math.max(25, item.servingSize - 25) })}
                      className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm leading-none transition-colors shrink-0"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={item.servingSize}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!isNaN(v) && v > 0) updateItem(i, { ...item, servingSize: v });
                      }}
                      className="flex-1 text-center border border-gray-200 rounded-lg py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                    />
                    <span className="text-xs text-gray-400 shrink-0">g</span>
                    <button
                      onClick={() => updateItem(i, { ...item, servingSize: item.servingSize + 25 })}
                      className="w-6 h-6 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center text-sm leading-none transition-colors shrink-0"
                    >
                      +
                    </button>
                    <button
                      onClick={() => addItem(i)}
                      className="ml-auto px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {items.length > 1 && (
            <button
              onClick={addAll}
              className="w-full py-2.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors"
            >
              Add All {items.length} Items to {MEAL_LABELS[items[0]?.meal]}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
