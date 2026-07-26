interface Props {
  message: string;
  type: 'success' | 'error';
}

export function Toast({ message, type }: Props) {
  return (
    <div
      className={`fixed top-4 left-1/2 z-50 px-5 py-3 rounded-full shadow-lg text-white text-sm font-medium animate-fade-in-down pointer-events-none ${
        type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
      }`}
    >
      {type === 'success' ? '✓' : '✕'}&nbsp; {message}
    </div>
  );
}
