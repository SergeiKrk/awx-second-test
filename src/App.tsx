import React, { useState, useEffect, useCallback, useRef } from "react";
import PriceInput from "./PriceInput";
import ProgressBar from "./ProgressBar";
import "./style.css";
import Decimal from "decimal.js";

const App: React.FC = () => {
  // Параметры для левого input (RUB)
  const leftInputMin = new Decimal(10000);
  const leftInputMax = new Decimal(70000000);
  const leftInputStep = new Decimal(100);

  // Параметры для правого input (USDT)
  const rightInputStep = new Decimal(0.000001);

  // Состояния для левого input
  const [leftInputValue, setLeftInputValue] = useState<Decimal>(leftInputMin);
  const [leftInputRawValue, setLeftInputRawValue] = useState<string>(
    leftInputMin.toString()
  );

  // Состояния для правого input
  const [rightInputValue, setRightInputValue] = useState<Decimal>(
    new Decimal(0)
  );
  const [rightInputRawValue, setRightInputRawValue] = useState<string>("0");

  // Состояние для цены из API (моковые данные)
  const [price, setPrice] = useState<Decimal>(new Decimal(0));

  // Состояние для отслеживания активного инпута
  const [activeInput, setActiveInput] = useState<"left" | "right">("left");

  // Состояние для отслеживания завершения фильтрации
  const [isLeftInputFiltered, setIsLeftInputFiltered] =
    useState<boolean>(false);

  // Таймеры для задержки конвертации
  const leftInputTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rightInputTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Реф для таймера кнопок процентов
  const percentageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Моковая функция для запроса к API
  const fetchConversion = useCallback(async () => {
    try {
      // Имитация задержки запроса
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Моковые данные
      const mockData = {
        price: "96.47", // Прямая цена
      };

      // Обновляем цену
      const priceDecimal = new Decimal(mockData.price);
      setPrice(priceDecimal);

      return priceDecimal;
    } catch (error) {
      console.error("Ошибка при запросе к API:", error);
      return null;
    }
  }, []);

  // Функция для округления до ближайшего шага (step)
  const roundToStep = (value: Decimal, step: Decimal): Decimal => {
    return value.div(step).round().mul(step);
  };

  // Обработчик изменения значения в левом input
  const handleLeftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLeftInputRawValue(rawValue); // Сохраняем сырое значение для отображения

    // Если поле пустое, устанавливаем минимальное значение (leftInputMin)
    if (rawValue === "") {
      setLeftInputValue(leftInputMin);
      setLeftInputRawValue(leftInputMin.toString());
      return;
    }

    const numericValue = new Decimal(rawValue);

    // Если значение некорректное (NaN), устанавливаем min
    if (numericValue.isNaN()) {
      setLeftInputValue(leftInputMin);
      setLeftInputRawValue(leftInputMin.toString());
      return;
    }

    // Сохраняем значение без валидации и округления
    setLeftInputValue(numericValue);
    setActiveInput("left"); // Устанавливаем активный инпут как левый
    setIsLeftInputFiltered(false); // Сбрасываем флаг фильтрации
  };

  // Эффект для валидации и округления значения левого инпута через 1 секунду после завершения ввода
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let validatedValue = leftInputValue;

      // Если значение меньше min или больше max, устанавливаем min
      validatedValue.lessThan(leftInputMin) && (validatedValue = leftInputMin);
      validatedValue.greaterThan(leftInputMax) &&
        (validatedValue = leftInputMin);

      // Округляем значение до ближайшего шага только если активный инпут — левый
      if (activeInput === "left") {
        const roundedValue = roundToStep(validatedValue, leftInputStep);
        setLeftInputValue(roundedValue);
        setLeftInputRawValue(roundedValue.toString());
        setIsLeftInputFiltered(true); // Устанавливаем флаг завершения фильтрации
      }
    }, 1000);

    return () => clearTimeout(timeoutId); // Очищаем таймер при изменении leftInputValue
  }, [leftInputValue, leftInputMin, leftInputMax, leftInputStep, activeInput]);

  // Эффект для конвертации после завершения фильтрации
  useEffect(() => {
    if (isLeftInputFiltered && price.greaterThan(0)) {
      const convertedValue = leftInputValue.div(price); // Конвертируем RUB в USDT
      setRightInputValue(convertedValue);
      setRightInputRawValue(convertedValue.toFixed(6));
      setIsLeftInputFiltered(false); // Сбрасываем флаг фильтрации
    }
  }, [isLeftInputFiltered, leftInputValue, price]);

  // Обработчик изменения значения в правом input
  const handleRightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setRightInputRawValue(rawValue); // Сохраняем сырое значение для отображения

    // Если поле пустое, устанавливаем минимальное значение (0)
    if (rawValue === "") {
      setRightInputValue(new Decimal(0));
      setRightInputRawValue("0");
      return;
    }

    const numericValue = new Decimal(rawValue);

    // Если значение некорректное (NaN), устанавливаем 0
    if (numericValue.isNaN()) {
      setRightInputValue(new Decimal(0));
      setRightInputRawValue("0");
      return;
    }

    // Сохраняем значение без валидации и округления
    setRightInputValue(numericValue);
    setActiveInput("right"); // Устанавливаем активный инпут как правый

    // Запускаем таймер для конвертации через 1200 мс
    if (rightInputTimerRef.current) {
      clearTimeout(rightInputTimerRef.current);
    }
    rightInputTimerRef.current = setTimeout(() => {
      if (price.greaterThan(0)) {
        const convertedValue = numericValue.mul(price); // Конвертируем USDT в RUB

        // Если значение меньше leftInputMin, устанавливаем leftInputMin
        if (convertedValue.lessThan(leftInputMin)) {
          setLeftInputValue(leftInputMin);
          setLeftInputRawValue(leftInputMin.toString());

          // Проводим прямую конвертацию из leftInputMin в правый инпут
          const newRightValue = leftInputMin.div(price);
          setRightInputValue(newRightValue);
          setRightInputRawValue(newRightValue.toFixed(6));
        } else {
          // Валидация по min и max, но без округления до шага
          const validatedValue = convertedValue.greaterThan(leftInputMax)
            ? leftInputMax
            : convertedValue.lessThan(leftInputMin)
            ? leftInputMin
            : convertedValue;

          setLeftInputValue(validatedValue);
          setLeftInputRawValue(validatedValue.toString());
        }
      }
    }, 1200);
  };

  // Эффект для валидации и округления значения правого инпута через 1 секунду после завершения ввода
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let validatedValue = rightInputValue;

      // Если значение меньше 0, устанавливаем 0
      validatedValue.lessThan(0) && (validatedValue = new Decimal(0));

      // Округляем значение до ближайшего шага
      const roundedValue = roundToStep(validatedValue, rightInputStep);

      // Обновляем состояние
      setRightInputValue(roundedValue);
      setRightInputRawValue(roundedValue.toString());
    }, 1000);

    return () => clearTimeout(timeoutId); // Очищаем таймер при изменении rightInputValue
  }, [rightInputValue, rightInputStep]);

  // Эффект для получения данных из API при монтировании компонента
  useEffect(() => {
    fetchConversion();
  }, [fetchConversion]);

  // Обработчик клика по кнопкам "25%", "50%", "75%", "100%" для левого инпута
  const handleLeftPercentageClick = (percentage: number) => {
    if (percentageTimerRef.current) {
      clearTimeout(percentageTimerRef.current);
    }
    percentageTimerRef.current = setTimeout(() => {
      const newValue = leftInputMax.mul(percentage).div(100);
      const roundedValue = roundToStep(newValue, leftInputStep);
      setLeftInputValue(roundedValue);
      setLeftInputRawValue(roundedValue.toString());
      setActiveInput("left");
      setIsLeftInputFiltered(true);
    }, 1200);
  };

  // Обработчик клика по кнопкам "25%", "50%", "75%", "100%" для правого инпута
  const handleRightPercentageClick = (percentage: number) => {
    if (percentageTimerRef.current) {
      clearTimeout(percentageTimerRef.current);
    }
    percentageTimerRef.current = setTimeout(() => {
      const newLeftValue = leftInputMax.mul(percentage).div(100);
      const roundedLeftValue = roundToStep(newLeftValue, leftInputStep);
      setLeftInputValue(roundedLeftValue);
      setLeftInputRawValue(roundedLeftValue.toString());
      setActiveInput("left");
      setIsLeftInputFiltered(true);
    }, 1200);
  };

  // Прогресс бар
  const progress = leftInputValue
    .minus(leftInputMin)
    .div(leftInputMax.minus(leftInputMin))
    .mul(100)
    .toNumber();

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      if (percentageTimerRef.current) {
        clearTimeout(percentageTimerRef.current);
      }
      if (leftInputTimerRef.current) {
        clearTimeout(leftInputTimerRef.current);
      }
      if (rightInputTimerRef.current) {
        clearTimeout(rightInputTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="contain mr-5">
        {/* Левый input (RUB) */}
        <PriceInput
          placeholder={leftInputMin.toString()}
          currency="RUB"
          value={leftInputRawValue}
          onChange={handleLeftInputChange}
          min={leftInputMin.toNumber()}
          max={leftInputMax.toNumber()}
          step={leftInputStep.toNumber()}
        />
        <div className="progress-bars">
          {/* Прогресс-бар как первая кнопка "25%" */}
          <div
            style={{ width: "100%" }} // Убедимся, что контейнер занимает всю ширину
            onClick={() => handleLeftPercentageClick(25)}
          >
            <ProgressBar
              positiveProgress={progress}
              negativeProgress={100 - progress}
            />
          </div>
          {/* Остальные кнопки */}
          <div
            className="progress-bar-stat"
            onClick={() => handleLeftPercentageClick(50)}
          >
            <div className="progress-bar-label">50%</div>
          </div>
          <div
            className="progress-bar-stat"
            onClick={() => handleLeftPercentageClick(75)}
          >
            <div className="progress-bar-label">75%</div>
          </div>
          <div
            className="progress-bar-stat"
            onClick={() => handleLeftPercentageClick(100)}
          >
            <div className="progress-bar-label">100%</div>
          </div>
        </div>
      </div>

      <div className="contain ml-5 mt-43">
        {/* Правый input (USDT) */}
        <PriceInput
          placeholder="0.000000"
          currency="USDT"
          value={rightInputRawValue}
          onChange={handleRightInputChange}
          step={rightInputStep.toNumber()}
        />
        <div className="progress-bars">
          {/* Прогресс-бар как первая кнопка "25%" */}
          <div
            style={{ width: "100%" }} // Убедимся, что контейнер занимает всю ширину
            onClick={() => handleRightPercentageClick(25)}
          >
            <ProgressBar
              positiveProgress={progress}
              negativeProgress={100 - progress}
            />
          </div>
          {/* Остальные кнопки */}
          <div
            className="progress-bar-stat"
            onClick={() => handleRightPercentageClick(50)}
          >
            <div className="progress-bar-label">50%</div>
          </div>
          <div
            className="progress-bar-stat"
            onClick={() => handleRightPercentageClick(75)}
          >
            <div className="progress-bar-label">75%</div>
          </div>
          <div
            className="progress-bar-stat"
            onClick={() => handleRightPercentageClick(100)}
          >
            <div className="progress-bar-label">100%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
