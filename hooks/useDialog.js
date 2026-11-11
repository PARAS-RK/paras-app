import { useEffect, useRef } from "react";

// Mengelola fokus awal, tombol Esc, dan jebakan Tab untuk modal.
export function useDialog(onClose) {
  const ref = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    const dialog = ref.current;
    if (!dialog) return;

    const focusables = () =>
      [...dialog.querySelectorAll('button, input, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.disabled
      );
    focusables()[0]?.focus();

    const onKey = (event) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  return ref;
}