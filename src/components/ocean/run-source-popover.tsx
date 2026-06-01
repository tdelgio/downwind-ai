"use client";

import { ExternalLink, Info } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const RUN_SOURCE_OPEN_EVENT = "ocean-state:run-source-open";
const POPOVER_WIDTH = 208;
const VIEWPORT_GUTTER = 12;

type PopoverPosition = {
  left: number;
  top: number;
};

export function RunSourcePopover({
  sourceName,
  updated,
  sourceType,
  sourceUrl,
}: {
  sourceName: string;
  updated: string;
  sourceType: string;
  sourceUrl?: string;
}) {
  const id = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<PopoverPosition | null>(null);

  useEffect(() => {
    const closeOtherPopovers = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) setIsOpen(false);
    };
    window.addEventListener(RUN_SOURCE_OPEN_EVENT, closeOtherPopovers);
    return () => window.removeEventListener(RUN_SOURCE_OPEN_EVENT, closeOtherPopovers);
  }, [id]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !popoverRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popoverWidth = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_GUTTER * 2);
      const left = Math.min(
        Math.max(VIEWPORT_GUTTER, rect.right - POPOVER_WIDTH),
        window.innerWidth - popoverWidth - VIEWPORT_GUTTER,
      );
      setPosition({ left, top: rect.bottom + 6 });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((current) => {
      const next = !current;
      if (next) window.dispatchEvent(new CustomEvent(RUN_SOURCE_OPEN_EVENT, { detail: id }));
      return next;
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="grid size-6 shrink-0 place-items-center rounded-full text-[#7c9098] transition hover:bg-[#e8f0f1] hover:text-[#0d5968] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d5968] dark:text-[#8fa8b1] dark:hover:bg-[#102a3a] dark:hover:text-[#9debf9]"
        aria-expanded={isOpen}
        aria-label={`Show source for ${sourceName}`}
        title={`Source: ${sourceName}`}
        onClick={toggle}
      >
        <Info className="size-4" strokeWidth={2.5} aria-hidden />
      </button>
      {isOpen && position
        ? createPortal(
            <div
              ref={popoverRef}
              role="dialog"
              aria-label={`Source details for ${sourceName}`}
              className="fixed z-[100] w-52 rounded-lg border border-[#cbd9dd] bg-white p-2.5 text-left text-[0.68rem] font-semibold leading-4 text-[#526a73] shadow-[0_16px_36px_rgba(7,35,45,0.2)] dark:border-white/14 dark:bg-[#102a3a] dark:text-[#c9d9df]"
              style={{ ...position, maxWidth: `calc(100vw - ${VIEWPORT_GUTTER * 2}px)` }}
            >
              <p className="text-[#102b3a] dark:text-white">{sourceName}</p>
              <p className="mt-1">{updated}</p>
              <p className="mt-0.5">{sourceType}</p>
              {sourceUrl ? (
                <a
                  className="mt-1.5 inline-flex items-center gap-1 text-[#0d5968] hover:underline dark:text-[#9debf9]"
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open source
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
