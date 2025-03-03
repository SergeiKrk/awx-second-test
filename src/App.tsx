import React, { useState, useEffect, useCallback, useRef } from "react";
import PriceInput from "./PriceInput";
import ProgressBar from "./ProgressBar";
import "./style.css";
import Decimal from "decimal.js";

const App: React.FC = () => {
  const leftInputMin = new Decimal(10000);
  const leftInputMax = new Decimal(70000000);
  const leftInputStep = new Decimal(100);
  const rightInputStep = new Decimal(0.000001);

  const [leftInputValue, setLeftInputValue] = useState<Decimal>(leftInputMin);
  const [leftInputRawValue, setLeftInputRawValue] = useState<string>(
    leftInputMin.toString()
  );
  const [rightInputValue, setRightInputValue] = useState<Decimal>(
    new Decimal(0)
  );
  const [rightInputRawValue, setRightInputRawValue] = useState<string>("0");
  const [priceData, setPriceData] = useState<{
    price: Decimal;
    reversePrice: Decimal;
  } | null>(null);
  const [activeInput, setActiveInput] = useState<"left" | "right">("left");
  const [isLeftInputFiltered, setIsLeftInputFiltered] =
    useState<boolean>(false);
  const [exchangeRate, setExchangeRate] = useState<string>("");

  const leftInputTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rightInputTimerRef = useRef<NodeJS.Timeout | null>(null);
  const percentageTimerRef = useRef<NodeJS.Timeout | null>(null);
  const apiCallTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Объявляем fetchConversion до её использования
  const fetchConversion = useCallback(
    async (inAmount: Decimal | null, outAmount: Decimal | null) => {
      try {
        const response = await fetch("/b2api/change/user/pair/calc", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            serial: "a7307e89-fbeb-4b28-a8ce-55b7fb3c32aa",
          },
          body: JSON.stringify({
            pairId: 133,
            inAmount: inAmount?.toNumber() || null,
            outAmount: outAmount?.toNumber() || null,
            timestamp: Date.now(), // Уникальный параметр для избежания кэширования
          }),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        console.log("API Response:", data); // Лог для отладки

        const priceDecimal = new Decimal(data.price[1]); // Прямая цена (RUB/USDT)
        const reversePriceDecimal = new Decimal(data.price[0]); // Обратная цена (USDT/RUB)
        setPriceData({
          price: priceDecimal,
          reversePrice: reversePriceDecimal,
        });

        // Обновляем курс для отображения
        setExchangeRate(`1 USDT = ${priceDecimal.toFixed(2)} RUB`);

        return { price: priceDecimal, reversePrice: reversePriceDecimal };
      } catch (error) {
        console.error("Ошибка при запросе к API:", error);
        return null;
      }
    },
    []
  );

  // Используем fetchConversion после её объявления
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Fetching conversion data..."); // Лог для отладки
      if (activeInput === "left") {
        fetchConversion(leftInputValue, null);
      } else {
        fetchConversion(null, rightInputValue);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [activeInput, leftInputValue, rightInputValue, fetchConversion]);

  const roundToStep = (value: Decimal, step: Decimal): Decimal => {
    return value.div(step).round().mul(step);
  };

  const handleLeftInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLeftInputRawValue(rawValue);

    if (rawValue === "") {
      setLeftInputValue(leftInputMin);
      setLeftInputRawValue(leftInputMin.toString());
      return;
    }

    const numericValue = new Decimal(rawValue);

    if (numericValue.isNaN()) {
      setLeftInputValue(leftInputMin);
      setLeftInputRawValue(leftInputMin.toString());
      return;
    }

    setLeftInputValue(numericValue);
    setActiveInput("left");
    setIsLeftInputFiltered(false);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let validatedValue = leftInputValue;

      if (validatedValue.lessThan(leftInputMin)) validatedValue = leftInputMin;
      if (validatedValue.greaterThan(leftInputMax))
        validatedValue = leftInputMin;

      if (activeInput === "left") {
        const roundedValue = roundToStep(validatedValue, leftInputStep);
        setLeftInputValue(roundedValue);
        setLeftInputRawValue(roundedValue.toString());
        setIsLeftInputFiltered(true);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [leftInputValue, leftInputMin, leftInputMax, leftInputStep, activeInput]);

  useEffect(() => {
    if (isLeftInputFiltered && priceData?.price.greaterThan(0)) {
      const convertedValue = leftInputValue.div(priceData.price);
      setRightInputValue(convertedValue);
      setRightInputRawValue(convertedValue.toFixed(6));
      setIsLeftInputFiltered(false);
    }
  }, [isLeftInputFiltered, leftInputValue, priceData]);

  const handleRightInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setRightInputRawValue(rawValue);

    if (rawValue === "") {
      setRightInputValue(new Decimal(0));
      setRightInputRawValue("0");
      return;
    }

    const numericValue = new Decimal(rawValue);

    if (numericValue.isNaN()) {
      setRightInputValue(new Decimal(0));
      setRightInputRawValue("0");
      return;
    }

    setRightInputValue(numericValue);
    setActiveInput("right");

    if (rightInputTimerRef.current) {
      clearTimeout(rightInputTimerRef.current);
    }
    rightInputTimerRef.current = setTimeout(() => {
      if (priceData?.price.greaterThan(0)) {
        const convertedValue = numericValue.mul(priceData.price);

        if (convertedValue.lessThan(leftInputMin)) {
          setLeftInputValue(leftInputMin);
          setLeftInputRawValue(leftInputMin.toString());

          const newRightValue = leftInputMin.div(priceData.price);
          setRightInputValue(newRightValue);
          setRightInputRawValue(newRightValue.toFixed(6));
        } else {
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      let validatedValue = rightInputValue;

      if (validatedValue.lessThan(0)) validatedValue = new Decimal(0);

      const roundedValue = roundToStep(validatedValue, rightInputStep);

      setRightInputValue(roundedValue);
      setRightInputRawValue(roundedValue.toString());
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [rightInputValue, rightInputStep]);

  useEffect(() => {
    fetchConversion(leftInputValue, null);
  }, [fetchConversion, leftInputValue]);

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

  const progress = leftInputValue
    .minus(leftInputMin)
    .div(leftInputMax.minus(leftInputMin))
    .mul(100)
    .toNumber();

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
      if (apiCallTimerRef.current) {
        clearTimeout(apiCallTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="container">
      <div className="contain mr-5">
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
          <div
            style={{ width: "100%" }}
            onClick={() => handleLeftPercentageClick(25)}
          >
            <ProgressBar
              positiveProgress={progress}
              negativeProgress={100 - progress}
            />
          </div>
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
        <PriceInput
          placeholder="0.000000"
          currency="USDT"
          value={rightInputRawValue}
          onChange={handleRightInputChange}
          step={rightInputStep.toNumber()}
        />
        <div className="progress-bars">
          <div
            style={{ width: "100%" }}
            onClick={() => handleRightPercentageClick(25)}
          >
            <ProgressBar
              positiveProgress={progress}
              negativeProgress={100 - progress}
            />
          </div>
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
