/**
 * A self-contained slider overlay.
 *
 * Creates its own DOM elements and styles — no HTML boilerplate needed.
 *
 * @example
 * new Slider({
 *   label: 'a',
 *   min: 0, max: 1, step: 0.01, value: 0.5,
 *   onChange: (v) => console.log(v),
 * });
 */
export class Slider {
  /**
   * @param {Object} options
   * @param {string}   options.label    - Display name shown before the value
   * @param {number}   options.min      - Minimum value
   * @param {number}   options.max      - Maximum value
   * @param {number}   options.step     - Step size
   * @param {number}   options.value    - Initial value
   * @param {function} options.onChange  - Called with the new value on every input event
   * @param {function} [options.format] - Custom label formatter: (value) → string
   */
  constructor({ label, min, max, step, value, onChange, format }) {
    this._label = label;
    this._format = format ?? (v => `${label} = ${v.toFixed(2)}`);

    injectStyles();

    // Build DOM
    this.container = document.createElement('div');
    this.container.className = 'slider-container';

    this.labelEl = document.createElement('label');
    this.labelEl.textContent = this._format(value);

    this.input = document.createElement('input');
    this.input.type = 'range';
    this.input.min = min;
    this.input.max = max;
    this.input.step = step;
    this.input.value = value;

    this.container.appendChild(this.labelEl);
    this.container.appendChild(this.input);
    document.body.appendChild(this.container);

    this.input.addEventListener('input', () => {
      const v = parseFloat(this.input.value);
      this.labelEl.textContent = this._format(v);
      onChange(v);
    });
  }
}

// --- Styles (injected once) ---

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.textContent = `
    .slider-container {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(0, 0, 0, 0.5);
      padding: 8px 16px;
      border-radius: 8px;
      color: #fff;
      font-family: monospace;
      font-size: 14px;
      z-index: 10;
    }
    .slider-container input[type="range"] {
      width: 200px;
    }
  `;
  document.head.appendChild(style);
}
