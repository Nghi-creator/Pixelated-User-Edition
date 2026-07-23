import { useEffect, useState } from "react";
import { Gamepad2, Keyboard, RotateCcw } from "lucide-react";
import {
  INPUT_ACTION_LABELS,
  WASM_INPUT_ACTIONS,
  formatKeyboardCode,
  type GamepadInputMapping,
  type KeyboardInputMapping,
  type WasmInputAction,
} from "../input/inputMappings";

type Props = {
  disabled: boolean;
  gamepadMapping: GamepadInputMapping;
  gamepadName: string | null;
  keyboardMapping: KeyboardInputMapping;
  onGamepadBindingChange: (action: WasmInputAction, button: number) => string | null;
  onKeyboardBindingChange: (action: WasmInputAction, code: string) => string | null;
  onResetGamepad: () => void;
  onResetKeyboard: () => void;
  variant?: "inline" | "drawer";
};

const bindingButtonClass =
  "min-w-24 rounded-md border border-synth-border bg-synth-bg px-3 py-2 text-sm font-bold text-white hover:border-synth-primary disabled:cursor-not-allowed disabled:opacity-50";

export function WasmInputSettings({
  disabled,
  gamepadMapping,
  gamepadName,
  keyboardMapping,
  onGamepadBindingChange,
  onKeyboardBindingChange,
  onResetGamepad,
  onResetKeyboard,
  variant = "inline",
}: Props) {
  const [capturingGamepad, setCapturingGamepad] = useState<WasmInputAction | null>(null);
  const [capturingKeyboard, setCapturingKeyboard] = useState<WasmInputAction | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!capturingGamepad || disabled) return;
    let frame = 0;
    let ready = false;
    const poll = () => {
      const gamepad = navigator.getGamepads?.().find((candidate) => candidate?.id === gamepadName);
      const pressed = gamepad?.buttons
        .map((button, index) => ({ index, pressed: button.pressed || button.value > 0.5 }))
        .filter((button) => button.pressed) || [];
      if (!ready) {
        ready = pressed.length === 0;
      } else if (pressed[0]) {
        const error = onGamepadBindingChange(capturingGamepad, pressed[0].index);
        setMessage(error || `${INPUT_ACTION_LABELS[capturingGamepad]} assigned to gamepad button ${pressed[0].index}.`);
        setCapturingGamepad(null);
        return;
      }
      frame = requestAnimationFrame(poll);
    };
    frame = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(frame);
  }, [capturingGamepad, disabled, gamepadName, onGamepadBindingChange]);

  const beginKeyboardCapture = (action: WasmInputAction) => {
    if (disabled) return;
    setMessage("");
    setCapturingGamepad(null);
    setCapturingKeyboard(action);
  };

  const captureKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!capturingKeyboard) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.code === "Escape") {
      setCapturingKeyboard(null);
      setMessage("Keyboard assignment cancelled.");
      return;
    }
    const error = onKeyboardBindingChange(capturingKeyboard, event.code);
    setMessage(error || `${INPUT_ACTION_LABELS[capturingKeyboard]} assigned to ${formatKeyboardCode(event.code)}.`);
    setCapturingKeyboard(null);
  };

  const content = (
    <div data-ignore-game-input>
      <div className={`grid gap-6 ${variant === "inline" ? "border-t border-synth-border p-4 lg:grid-cols-2" : "lg:grid-cols-2"}`}>
        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 font-bold text-white"><Keyboard className="h-4 w-4" /> Keyboard</h3>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50" disabled={disabled} onClick={onResetKeyboard} type="button"><RotateCcw className="h-3.5 w-3.5" /> Defaults</button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {WASM_INPUT_ACTIONS.map((action) => (
              <label className="text-xs font-semibold text-gray-400" key={action}>
                {INPUT_ACTION_LABELS[action]}
                <button
                  className={`${bindingButtonClass} mt-1 w-full`}
                  disabled={disabled}
                  onClick={() => beginKeyboardCapture(action)}
                  onKeyDown={captureKeyboard}
                  type="button"
                >
                  {capturingKeyboard === action ? "Press key…" : formatKeyboardCode(keyboardMapping[action])}
                </button>
              </label>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex min-w-0 items-center gap-2 font-bold text-white"><Gamepad2 className="h-4 w-4 shrink-0" /><span className="truncate">{gamepadName || "Gamepad"}</span></h3>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-white disabled:opacity-50" disabled={disabled || !gamepadName} onClick={onResetGamepad} type="button"><RotateCcw className="h-3.5 w-3.5" /> Defaults</button>
          </div>
          {gamepadName ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {WASM_INPUT_ACTIONS.map((action) => (
                <label className="text-xs font-semibold text-gray-400" key={action}>
                  {INPUT_ACTION_LABELS[action]}
                  <button
                    className={`${bindingButtonClass} mt-1 w-full`}
                    disabled={disabled}
                    onClick={() => {
                      setMessage("");
                      setCapturingKeyboard(null);
                      setCapturingGamepad(action);
                    }}
                    type="button"
                  >
                    {capturingGamepad === action ? "Press button…" : `Button ${gamepadMapping[action]}`}
                  </button>
                </label>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-md border border-synth-border bg-synth-bg/60 p-3 text-sm text-gray-400">Connect a gamepad to create a mapping for that controller.</p>
          )}
        </section>
      </div>
      <div className="border-t border-synth-border px-4 py-3 text-xs text-gray-400">
        {disabled ? "Stop the game before changing input mappings." : message || "Mappings are stored only in this browser. Duplicate keys or buttons are rejected."}
      </div>
    </div>
  );

  if (variant === "drawer") return content;

  return (
    <details className="border-t border-synth-border bg-synth-surface">
      <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-white">
        Keyboard &amp; gamepad mapping
      </summary>
      {content}
    </details>
  );
}
