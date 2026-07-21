"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

type Options = {
  onRefresh: () => Promise<unknown> | void;
  threshold?: number;
  disabled?: boolean;
};

/**
 * 모바일 상단 pull-to-refresh.
 * scrollTop ≈ 0 인 컨테이너(또는 window)에서만 동작한다.
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 72,
  disabled = false,
}: Options) {
  const [pulling, setPulling] = useState(false);
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const active = useRef(false);

  const finish = useCallback(async () => {
    if (distance < threshold) {
      setDistance(0);
      setPulling(false);
      return;
    }
    setRefreshing(true);
    setPulling(false);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
      setDistance(0);
    }
  }, [distance, onRefresh, threshold]);

  useEffect(() => {
    if (disabled) return;

    function getScrollTop() {
      return (
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      );
    }

    function onTouchStart(e: TouchEvent) {
      if (refreshing) return;
      if (getScrollTop() > 2) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0]?.clientY ?? null;
      active.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || startY.current == null || refreshing) return;
      const y = e.touches[0]?.clientY ?? startY.current;
      const delta = y - startY.current;
      if (delta <= 0 || getScrollTop() > 2) {
        setDistance(0);
        setPulling(false);
        return;
      }
      // 과스크롤 방지용 감쇠
      const damped = Math.min(delta * 0.45, threshold * 1.4);
      setDistance(damped);
      setPulling(true);
      if (damped > 8) {
        e.preventDefault();
      }
    }

    async function onTouchEnd() {
      if (!active.current) return;
      active.current = false;
      startY.current = null;
      await finish();
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd);
    document.addEventListener("touchcancel", onTouchEnd);

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [disabled, finish, refreshing, threshold]);

  return {
    pulling,
    refreshing,
    distance,
    indicatorStyle: {
      height: refreshing ? 40 : distance,
      opacity: refreshing || distance > 8 ? 1 : 0,
    } as CSSProperties,
  };
}
