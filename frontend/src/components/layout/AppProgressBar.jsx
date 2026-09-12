import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export const AppProgressBar = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(35);
    const t1 = setTimeout(() => setProgress(75), 100);
    const t2 = setTimeout(() => setProgress(100), 240);
    const t3 = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 420);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [location.pathname, location.search]);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none bg-transparent"
    >
      <div
        className="h-full bg-zinc-950 dark:bg-zinc-100 shadow-[0_0_8px_rgba(0,0,0,0.3)] dark:shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all ease-out"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transitionDuration: progress === 100 ? "120ms" : "220ms",
        }}
      />
    </div>
  );
};
