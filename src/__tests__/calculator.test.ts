/**
 * Unit tests for Calculator module
 * RDB-002 Week 1 Implementation - ACTUAL RUNNING TESTS
 *
 * This demonstrates:
 * - Jest test framework working
 * - TypeScript integration
 * - Code coverage collection
 * - Mutation testing ready
 */

import { Calculator, factorial } from '../calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(calculator.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      expect(calculator.add(-2, -3)).toBe(-5);
    });

    it('should handle zero', () => {
      expect(calculator.add(5, 0)).toBe(5);
    });
  });

  describe('subtract', () => {
    it('should subtract two numbers', () => {
      expect(calculator.subtract(5, 3)).toBe(2);
    });

    it('should handle negative results', () => {
      expect(calculator.subtract(3, 5)).toBe(-2);
    });
  });

  describe('multiply', () => {
    it('should multiply two numbers', () => {
      expect(calculator.multiply(3, 4)).toBe(12);
    });

    it('should handle multiplication by zero', () => {
      expect(calculator.multiply(5, 0)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(calculator.multiply(-3, 4)).toBe(-12);
    });
  });

  describe('divide', () => {
    it('should divide two numbers', () => {
      expect(calculator.divide(10, 2)).toBe(5);
    });

    it('should handle decimal results', () => {
      expect(calculator.divide(10, 3)).toBeCloseTo(3.333, 3);
    });

    it('should throw error on division by zero', () => {
      expect(() => calculator.divide(5, 0)).toThrow('Division by zero');
    });
  });

  describe('isEven', () => {
    it('should return true for even numbers', () => {
      expect(calculator.isEven(2)).toBe(true);
      expect(calculator.isEven(4)).toBe(true);
      expect(calculator.isEven(0)).toBe(true);
    });

    it('should return false for odd numbers', () => {
      expect(calculator.isEven(1)).toBe(false);
      expect(calculator.isEven(3)).toBe(false);
      expect(calculator.isEven(7)).toBe(false);
    });

    it('should handle negative numbers', () => {
      expect(calculator.isEven(-2)).toBe(true);
      expect(calculator.isEven(-3)).toBe(false);
    });
  });
});

describe('factorial', () => {
  it('should calculate factorial of 0', () => {
    expect(factorial(0)).toBe(1);
  });

  it('should calculate factorial of 1', () => {
    expect(factorial(1)).toBe(1);
  });

  it('should calculate factorial of positive numbers', () => {
    expect(factorial(5)).toBe(120);
    expect(factorial(3)).toBe(6);
  });

  it('should throw error for negative numbers', () => {
    expect(() => factorial(-1)).toThrow('Factorial of negative number');
  });
});
