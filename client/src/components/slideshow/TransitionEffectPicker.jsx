import { TRANSITIONS } from './transitionRegistry.js';

export function TransitionEffectPicker({ value, onChange }) {
  return (
    <select className="effect-picker" value={value} onChange={(e) => onChange(e.target.value)}>
      {Object.entries(TRANSITIONS).map(([key, { label }]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
