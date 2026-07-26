import { useState } from 'react';

interface Props {
  onSave: (key: string) => void;
  onClose?: () => void;
  currentKey?: string;
}

export function ApiKeyModal({ onSave, onClose, currentKey }: Props) {
  const [key, setKey] = useState(currentKey ?? '');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith('sk-ant-')) {
      setError('Key should start with "sk-ant-"');
      return;
    }
    onSave(trimmed);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-slide-up">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-light"
          >
            ✕
          </button>
        )}

        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🥗</div>
          <h1 className="text-xl font-bold text-gray-800">NutriTrack</h1>
          <p className="text-gray-500 text-sm mt-2">
            AI-powered calorie tracker with full Indian &amp; global cuisine support
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-5 text-sm text-emerald-800">
          Upload a photo of your food <span className="font-medium">or</span> search any dish
          — Claude AI gives you accurate nutrition info including all Indian recipes.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError('');
              }}
              placeholder="sk-ant-api03-..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            <p className="text-xs text-gray-400 mt-2">
              Get your key at{' '}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline"
              >
                console.anthropic.com
              </a>{' '}
              · Stored in your browser only, never sent to any server
            </p>
          </div>

          <button
            type="submit"
            disabled={!key.trim()}
            className="w-full py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 disabled:opacity-40 transition-colors"
          >
            {currentKey ? 'Update Key' : 'Get Started'}
          </button>
        </form>
      </div>
    </div>
  );
}
