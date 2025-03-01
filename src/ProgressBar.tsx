import React, { useState, useEffect, useRef } from "react";
import "./style.css";

interface ProgressBarProps {
  positiveProgress: number; // Процент для положительной части
  negativeProgress: number; // Процент для отрицательной части
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  positiveProgress,
  negativeProgress,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null); // Ref для .progress-bar
  const [spanWidth, setSpanWidth] = useState<number>(0); // Ширина span

  // Эффект для обновления ширины span при изменении размера .progress-bar
  useEffect(() => {
    const updateSpanWidth = () => {
      if (progressBarRef.current) {
        // Устанавливаем ширину span равной ширине .progress-bar
        setSpanWidth(progressBarRef.current.offsetWidth);
      }
    };

    // Обновляем ширину span при изменении размера .progress-bar
    updateSpanWidth();
    window.addEventListener("resize", updateSpanWidth);

    return () => {
      window.removeEventListener("resize", updateSpanWidth);
    };
  }, []);

  return (
    <div className="progress-bar" ref={progressBarRef}>
      {/* Положительная часть прогресс бара */}
      <div className="bar positive" style={{ width: `${positiveProgress}%` }}>
        <span style={{ width: `${spanWidth}px` }}>25%</span>
      </div>
      {/* Отрицательная часть прогресс бара */}
      <div className="bar negative" style={{ width: `${negativeProgress}%` }}>
        <span style={{ width: `${spanWidth}px` }}>25%</span>
      </div>
    </div>
  );
};

export default ProgressBar;
