'use client';

/** Przełącznik Tak/Nie — pigułka 40×22 px (pkt 4.6). */
export function Toggle({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      id={id}
      className="toggle"
      aria-pressed={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track" aria-hidden="true">
        <span className="toggle-knob" />
      </span>
      <span>
        {label}: <strong>{checked ? 'Tak' : 'Nie'}</strong>
      </span>
    </button>
  );
}
