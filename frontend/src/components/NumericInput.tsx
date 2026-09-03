import {
  useState,
  type ChangeEvent,
  type ComponentProps,
  type KeyboardEvent,
} from "react";
import {
  displayNumericInput,
  numberToNumericInput,
  parseNumericInput,
  sanitizeNumericInput,
  type NumericInputRules,
} from "../utils/numericInput";

type NumericInputProps = Omit<
  ComponentProps<"input">,
  "onChange" | "value" | "type" | "inputMode" | "maxLength"
> &
  NumericInputRules & {
    value?: number | string | null;
    onChange?: (value: number | null) => void;
  };

function textFromValue(
  next: number | string | null | undefined,
  rules: Pick<NumericInputRules, "isNegative" | "isDecimal">,
): string {
  if (typeof next === "string") {
    return displayNumericInput(sanitizeNumericInput(next, rules));
  }
  return numberToNumericInput(next);
}

function isAllowedKey(
  event: KeyboardEvent<HTMLInputElement>,
  rules: NumericInputRules,
): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  if (event.key.length !== 1) return true;
  if (event.key >= "0" && event.key <= "9") return true;
  if (event.key === "-" && rules.isNegative) return true;
  if ((event.key === "," || event.key === ".") && rules.isDecimal) return true;
  return false;
}

export function NumericInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  isNegative = false,
  isDecimal = false,
  maxLength,
  ref,
  ...props
}: NumericInputProps) {
  const rules: NumericInputRules = { isNegative, isDecimal, maxLength };
  const [text, setText] = useState(() =>
    textFromValue(value, { isNegative, isDecimal }),
  );
  const [prevValue, setPrevValue] = useState(value);

  if (!Object.is(value, prevValue)) {
    setPrevValue(value);
    const nextText = textFromValue(value, { isNegative, isDecimal });
    if (parseNumericInput(text) !== parseNumericInput(nextText)) {
      setText(nextText);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const displayed = displayNumericInput(
      sanitizeNumericInput(event.target.value, rules),
    );
    setText(displayed);
    onChange?.(parseNumericInput(displayed));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (!isAllowedKey(event, rules)) {
      event.preventDefault();
    }
  }

  return (
    <input
      {...props}
      ref={ref}
      type="text"
      inputMode={isDecimal ? "decimal" : "numeric"}
      value={displayNumericInput(text)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={onBlur}
    />
  );
}
