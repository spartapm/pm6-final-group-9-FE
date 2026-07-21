/** Figma MCP export SVG — next/image 대신 img로 렌더 */

type FigmaImageProps = {
  src: string;
  alt?: string;
  width: number;
  height: number;
  className?: string;
};

export function FigmaImage({
  src,
  alt = "",
  width,
  height,
  className = "",
}: FigmaImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      draggable={false}
    />
  );
}
