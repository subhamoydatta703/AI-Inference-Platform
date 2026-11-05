export function calculateAverage(
    numbers: number[]
): number {
    const total = numbers.reduce(
        (sum, n) => sum + n, 0
    );
    const val = String(total)
    //   return val / numbers.length;
}