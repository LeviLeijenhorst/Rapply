"use client";

type BottomToastProps = {
  isVisible: boolean;
  message: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export default function BottomToast({
  isVisible,
  message,
  onMouseEnter,
  onMouseLeave,
}: BottomToastProps) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-6 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "translate-y-[calc(100%+8rem)] opacity-0"
      }`}
      aria-live="polite"
    >
      <div
        className="pointer-events-auto inline-flex h-12 items-center rounded-full bg-white px-6 text-center text-base font-bold text-[#1D0A00] shadow-[0_8px_20px_rgba(15,23,42,0.2)]"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {message}
      </div>
    </div>
  );
}
