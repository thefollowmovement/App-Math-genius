import { defineGenerator, n, r } from '../kit';

// [calculation, value, first step] for three numbers a, b, c.
type Template = (a: number, b: number, c: number) => [string, number, string];
const TEMPLATES: Template[] = [
  (a, b, c) => [`${a} + ${b} × ${c}`, a + b * c, `${b} × ${c} = ${b * c}`],
  (a, b, c) => [`${a * b + c} − ${a} × ${b}`, c, `${a} × ${b} = ${a * b}`],
  (a, b, c) => [`(${a} + ${b}) × ${c}`, (a + b) * c, `${a} + ${b} = ${a + b}`],
  (a, b, c) => [
    `${a * c} ÷ ${c} + ${b} × ${c}`,
    a + b * c,
    `${a * c} ÷ ${c} = ${a} et ${b} × ${c} = ${b * c}`,
  ],
  (a, b, c) => [`${a} × (${b + c} − ${c}) − ${b}`, a * b - b, `${b + c} − ${c} = ${b}`],
];

export default defineGenerator({
  skill: '6e.priorites-operatoires',
  generate(rng, difficulty) {
    const template = rng.pick(TEMPLATES.slice(0, difficulty));
    const [expression, value, first] = template(rng.int(2, 12), rng.int(2, 9), rng.int(2, 9));
    return {
      type: 'numeric',
      prompt: `Calcule : ${expression}`,
      check: expression,
      answer: r(value),
      hint: 'Les parenthèses d’abord, puis les multiplications et les divisions, puis les additions et les soustractions.',
      explanation: [`On commence par ${first}.`, `${expression} = ${n(value)}`],
    };
  },
});
