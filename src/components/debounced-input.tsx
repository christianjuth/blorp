import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  ChangeEvent,
  useEffect,
  useMemo,
} from "react";
import debounce from "lodash/debounce";

type DebouncedInputProps = DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  /** how long to wait after the last keystroke before firing onChange */
  debounceTimeout?: number;
};

export function DebouncedInput({
  debounceTimeout = 300,
  onChange,
  ...props
}: DebouncedInputProps) {
  // wrap the incoming onChange in a debounced function
  const debouncedOnChange = useMemo(
    () =>
      debounce((event: ChangeEvent<HTMLInputElement>) => {
        onChange?.(event);
      }, debounceTimeout),
    [onChange, debounceTimeout],
  );

  // cancel debounced calls on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  // forward every change event into the debounced handler
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    debouncedOnChange(e);
  };

  return (
    <input
      {...props}
      onChange={handleChange}
      onBlur={(e) => {
        debouncedOnChange.flush();
        props.onBlur?.(e);
      }}
    />
  );
}
