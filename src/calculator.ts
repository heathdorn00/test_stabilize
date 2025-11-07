/**
 * Simple calculator module for demonstrating test infrastructure
 * RDB-002 Week 1 Implementation - CONCRETE DELIVERABLE
 */

export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }

  subtract(a: number, b: number): number {
    return a - b;
  }

  multiply(a: number, b: number): number {
    return a * b;
  }

  divide(a: number, b: number): number {
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }

  isEven(n: number): boolean {
    return n % 2 === 0;
  }
}

export function factorial(n: number): number {
  if (n < 0) {
    throw new Error('Factorial of negative number');
  }
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}
