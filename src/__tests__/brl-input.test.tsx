import { afterEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { BrlInput } from "@/components/ui/brl-input";

afterEach(() => {
  cleanup();
});

function Harness({
  initialCents = 0,
  max,
  onChange,
}: {
  initialCents?: number;
  max?: number;
  onChange?: (cents: number) => void;
}) {
  const [cents, setCents] = useState(initialCents);
  return (
    <BrlInput
      cents={cents}
      max={max}
      onChange={(next) => {
        setCents(next);
        onChange?.(next);
      }}
    />
  );
}

function getInput(): HTMLInputElement {
  return screen.getByRole("textbox") as HTMLInputElement;
}

function formattedValue(input: HTMLInputElement): string {
  // Intl.NumberFormat uses NBSP (\u00A0) between "R$" and the number.
  return input.value.replace(/\u00A0/g, " ");
}

describe("BrlInput", () => {
  it("renders 'R$ 0,00' when empty", () => {
    render(<Harness />);
    expect(formattedValue(getInput())).toBe("R$ 0,00");
  });

  it("shifts digits in from the right (Nubank pattern)", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "R$ 0,001" } });
    expect(onChange).toHaveBeenLastCalledWith(1);

    fireEvent.change(input, { target: { value: "R$ 0,012" } });
    expect(onChange).toHaveBeenLastCalledWith(12);

    fireEvent.change(input, { target: { value: "R$ 0,123" } });
    expect(onChange).toHaveBeenLastCalledWith(123);

    fireEvent.change(input, { target: { value: "R$ 1,234" } });
    expect(onChange).toHaveBeenLastCalledWith(1234);
  });

  it("re-renders the formatted value as cents grow", () => {
    render(<Harness />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "1" } });
    expect(formattedValue(input)).toBe("R$ 0,01");

    fireEvent.change(input, { target: { value: "R$ 0,0112" } });
    expect(formattedValue(input)).toBe("R$ 1,12");

    fireEvent.change(input, { target: { value: "R$ 1,12345" } });
    // digits extracted = "112345" → 1123.45 BRL
    expect(formattedValue(input)).toBe("R$ 1.123,45");
  });

  it("removes the last digit on backspace (empty input → 0)", () => {
    const onChange = vi.fn();
    render(<Harness initialCents={1234} onChange={onChange} />);
    const input = getInput();
    expect(formattedValue(input)).toBe("R$ 12,34");

    fireEvent.change(input, { target: { value: "R$ 12,3" } });
    expect(onChange).toHaveBeenLastCalledWith(123);

    fireEvent.change(input, { target: { value: "" } });
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it("respects the max cap", () => {
    const onChange = vi.fn();
    render(<Harness max={9999} onChange={onChange} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "12345" } });
    // 12345 cents would display as R$ 123,45 — but cap is 9999 (R$ 99,99).
    expect(onChange).toHaveBeenLastCalledWith(9999);
    expect(formattedValue(input)).toBe("R$ 99,99");
  });

  it("accepts paste of a formatted currency string", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "R$ 1.234,56" } });
    expect(onChange).toHaveBeenLastCalledWith(123456);
    expect(formattedValue(input)).toBe("R$ 1.234,56");
  });

  it("ignores non-digit characters", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = getInput();

    fireEvent.change(input, { target: { value: "abc" } });
    expect(onChange).toHaveBeenLastCalledWith(0);

    fireEvent.change(input, { target: { value: "1a2b3" } });
    expect(onChange).toHaveBeenLastCalledWith(123);
  });

  it("pre-fills with the initial value in edit mode", () => {
    render(<Harness initialCents={9990} />);
    expect(formattedValue(getInput())).toBe("R$ 99,90");
  });
});
