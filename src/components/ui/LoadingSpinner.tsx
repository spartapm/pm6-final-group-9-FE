type LoadingSpinnerProps = {
  className?: string;
  /** 기본 12px — 버튼 텍스트 라인에 맞춤 */
  size?: number;
};

/** 원형 링 스피너: 0.8s linear 시계방향 무한 회전 */
export function LoadingSpinner({
  className = "",
  size = 12,
}: LoadingSpinnerProps) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full border-2 border-current/30 border-t-current [animation:spin_0.8s_linear_infinite] ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
