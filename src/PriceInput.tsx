import React, { useState, useEffect, useRef } from "react";
import "./style.css";

interface PriceInputProps {
  placeholder: string;
  currency: string;
  value: string; // Текущее значение input (сырое значение)
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Обработчик изменения
  min?: number; // Минимальное значение
  max?: number; // Максимальное значение
  step?: number; // Шаг изменения
}

const PriceInput: React.FC<PriceInputProps> = ({
  placeholder,
  currency,
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
}) => {
  const [inputWidth, setInputWidth] = useState<number>(100); // Начальная ширина input
  const hiddenSpanRef = useRef<HTMLSpanElement>(null); // Ref для скрытого span

  // Эффект для обновления ширины input при изменении значения
  useEffect(() => {
    if (hiddenSpanRef.current) {
      // Устанавливаем ширину input равной ширине текста в скрытом span
      setInputWidth(hiddenSpanRef.current.offsetWidth);
    }
  }, [value]);

  return (
    <div className="field-block">
      <div className="price">
        {/* Скрытый span для измерения ширины текста */}
        <span
          ref={hiddenSpanRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            whiteSpace: "pre",
            fontSize: "42px", // Размер шрифта должен совпадать с input
            fontFamily: "Inter, sans-serif", // Шрифт должен совпадать с input
          }}
        >
          {value || placeholder}
        </span>

        {/* Input с динамической шириной */}
        <input
          type="number"
          className={`price-number${currency === "USDT" ? "-two" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange} // Используем переданный обработчик
          min={min}
          max={max}
          step={step}
          style={{ width: `${inputWidth}px` }} // Устанавливаем ширину input
        />
        <span className="currency-two">{currency}</span>
      </div>
    </div>
  );
};

export default PriceInput;
