import { render, screen, fireEvent } from "@testing-library/react";
import App from "./App";

describe("App component input validation", () => {
  // Тест на обработку пустого значения в левом инпуте
  test("handles empty left input", () => {
    render(<App />);
    const leftInput = screen.getByPlaceholderText("10000");

    // Вводим пустое значение
    fireEvent.change(leftInput, { target: { value: "" } });
    expect(leftInput).toHaveValue("10000"); // Должно быть заменено на leftInputMin
  });

  // Тест на обработку пустого значения в правом инпуте
  test("handles empty right input", () => {
    render(<App />);
    const rightInput = screen.getByPlaceholderText("0.000000");

    // Вводим пустое значение
    fireEvent.change(rightInput, { target: { value: "" } });
    expect(rightInput).toHaveValue("0.000000"); // Должно быть заменено на 0
  });

  // Тест на обработку некорректного значения в левом инпуте (буквы)
  test("handles invalid left input (letters)", () => {
    render(<App />);
    const leftInput = screen.getByPlaceholderText("10000");

    // Вводим некорректное значение (буквы)
    fireEvent.change(leftInput, { target: { value: "abc" } });
    expect(leftInput).toHaveValue("10000"); // Должно быть заменено на leftInputMin
  });

  // Тест на обработку некорректного значения в правом инпуте (буквы)
  test("handles invalid right input (letters)", () => {
    render(<App />);
    const rightInput = screen.getByPlaceholderText("0.000000");

    // Вводим некорректное значение (буквы)
    fireEvent.change(rightInput, { target: { value: "abc" } });
    expect(rightInput).toHaveValue("0.000000"); // Должно быть заменено на 0
  });

  // Тест на ограничение по min в левом инпуте
  test("validates left input min value", () => {
    render(<App />);
    const leftInput = screen.getByPlaceholderText("10000");

    // Вводим значение меньше min
    fireEvent.change(leftInput, { target: { value: "5000" } });
    expect(leftInput).toHaveValue("10000"); // Должно быть заменено на leftInputMin
  });

  // Тест на ограничение по max в левом инпуте
  test("validates left input max value", () => {
    render(<App />);
    const leftInput = screen.getByPlaceholderText("10000");

    // Вводим значение больше max
    fireEvent.change(leftInput, { target: { value: "80000000" } });
    expect(leftInput).toHaveValue("70000000"); // Должно быть заменено на leftInputMax
  });

  // Тест на округление до шага в правом инпуте
  test("validates right input step", () => {
    render(<App />);
    const rightInput = screen.getByPlaceholderText("0.000000");

    // Вводим значение, которое не кратно шагу
    fireEvent.change(rightInput, { target: { value: "0.0000005" } });
    expect(rightInput).toHaveValue("0.000001"); // Должно быть округлено до шага
  });

  // Тест на ограничение по min в правом инпуте
  test("validates right input min value", () => {
    render(<App />);
    const rightInput = screen.getByPlaceholderText("0.000000");

    // Вводим отрицательное значение
    fireEvent.change(rightInput, { target: { value: "-0.000001" } });
    expect(rightInput).toHaveValue("0.000000"); // Должно быть заменено на 0
  });
});
