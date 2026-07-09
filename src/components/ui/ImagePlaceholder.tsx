import Image from "next/image";

type ImagePlaceholderProps = {
  src?: string;
  alt: string;
  width: number;
  height: number;
  label?: string;
  className?: string;
};

/** Figma export 불가 시 점선 영역으로 표시 */
export function ImagePlaceholder({
  src,
  alt,
  width,
  height,
  label,
  className = "",
}: ImagePlaceholderProps) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)] ${className}`}
      style={{ width, height, maxWidth: "100%" }}
      role="img"
      aria-label={alt}
    >
      {label ? (
        <span className="px-3 text-center text-xs text-[var(--color-primary)]">
          {label}
        </span>
      ) : null}
    </div>
  );
}
