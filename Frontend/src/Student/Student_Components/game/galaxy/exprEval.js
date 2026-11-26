// A tiny C++ expression / assignment evaluator used by the code challenges.
// Student answers are judged by what they DO on test cases, so equivalent
// spellings such as "dist[u] + w < dist[v]" and "w + dist[u] < dist[v]" both pass.

export const INF_VALUE = 1e9;

const TOKEN = /\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_][A-Za-z_0-9]*|&&|\|\||==|!=|<=|>=|\+=|-=|[-+*/%<>=!()[\]])/y;

function tokenize(text) {
  const tokens = [];
  TOKEN.lastIndex = 0;
  let pos = 0;
  while (pos < text.length) {
    if (/^\s*$/.test(text.slice(pos))) break;
    TOKEN.lastIndex = pos;
    const match = TOKEN.exec(text);
    if (!match) throw new Error(`unexpected character near "${text.slice(pos, pos + 6).trim()}"`);
    tokens.push(match[1]);
    pos = TOKEN.lastIndex;
  }
  return tokens;
}

function parse(tokens, allowAssign) {
  let i = 0;
  const peek = () => tokens[i];
  const take = (expected) => {
    if (expected && tokens[i] !== expected) throw new Error(`expected "${expected}"`);
    return tokens[i++];
  };

  const binary = (ops, next) => () => {
    let left = next();
    while (ops.includes(peek())) {
      const op = take();
      left = { t: "bin", op, left, right: next() };
    }
    return left;
  };

  function primary() {
    const tok = take();
    if (tok === undefined) throw new Error("the expression ends too early");
    if (tok === "(") {
      const inner = orExpr();
      take(")");
      return inner;
    }
    if (/^\d/.test(tok)) return { t: "num", v: Number(tok) };
    if (/^[A-Za-z_]/.test(tok)) {
      let node = { t: "var", name: tok };
      while (peek() === "[") {
        take("[");
        const index = orExpr();
        take("]");
        node = { t: "idx", base: node, index };
      }
      return node;
    }
    throw new Error(`unexpected "${tok}"`);
  }

  function unary() {
    if (peek() === "!" || peek() === "-" || peek() === "+") {
      const op = take();
      return { t: "un", op, expr: unary() };
    }
    return primary();
  }

  const mul = binary(["*", "/", "%"], unary);
  const add = binary(["+", "-"], mul);
  const rel = binary(["<", ">", "<=", ">="], add);
  const eq = binary(["==", "!="], rel);
  const andExpr = binary(["&&"], eq);
  const orExpr = binary(["||"], andExpr);

  const first = orExpr();

  if (allowAssign && (peek() === "=" || peek() === "+=" || peek() === "-=")) {
    const op = take();
    const value = orExpr();
    if (i < tokens.length) throw new Error(`unexpected "${peek()}"`);
    return { t: "assign", op, target: first, value };
  }

  if (i < tokens.length) throw new Error(`unexpected "${peek()}"`);
  return first;
}

function evaluate(node, env) {
  switch (node.t) {
    case "num":
      return node.v;
    case "var": {
      if (node.name === "true") return 1;
      if (node.name === "false") return 0;
      if (node.name === "INF" || node.name === "INT_MAX") return node.name === "INF" ? INF_VALUE : 2147483647;
      if (!(node.name in env)) throw new Error(`"${node.name}" is not available here`);
      return env[node.name];
    }
    case "idx": {
      const base = evaluate(node.base, env);
      if (!Array.isArray(base)) throw new Error("only arrays can be indexed");
      const value = base[evaluate(node.index, env)];
      if (value === undefined) throw new Error("that index does not exist");
      return value;
    }
    case "un": {
      const v = evaluate(node.expr, env);
      return node.op === "!" ? (v ? 0 : 1) : node.op === "-" ? -v : v;
    }
    case "bin": {
      if (node.op === "&&") return evaluate(node.left, env) && evaluate(node.right, env) ? 1 : 0;
      if (node.op === "||") return evaluate(node.left, env) || evaluate(node.right, env) ? 1 : 0;
      const a = evaluate(node.left, env);
      const b = evaluate(node.right, env);
      switch (node.op) {
        case "+": return a + b;
        case "-": return a - b;
        case "*": return a * b;
        case "/": return Math.trunc(a / b);
        case "%": return a % b;
        case "<": return a < b ? 1 : 0;
        case ">": return a > b ? 1 : 0;
        case "<=": return a <= b ? 1 : 0;
        case ">=": return a >= b ? 1 : 0;
        case "==": return a === b ? 1 : 0;
        default: return a !== b ? 1 : 0;
      }
    }
    default:
      throw new Error("not an expression");
  }
}

function run(node, env) {
  if (node.t !== "assign") return evaluate(node, env);
  const value = evaluate(node.value, env);
  const target = node.target;
  const current = evaluate(target, env);
  const next = node.op === "=" ? value : node.op === "+=" ? current + value : current - value;

  if (target.t === "idx") {
    const array = evaluate(target.base, env);
    array[evaluate(target.index, env)] = next;
  } else if (target.t === "var") {
    env[target.name] = next;
  } else {
    throw new Error("you can only assign to a variable");
  }
  return next;
}

const cloneEnv = (env) => Object.fromEntries(Object.entries(env).map(([k, v]) => [k, Array.isArray(v) ? [...v] : v]));
const clean = (text) => text.trim().replace(/;+\s*$/, "").trim();

// blank: { kind: "expr" | "assign", answer: "reference code", tests: [{ env, why }] }
export function judgeCode(blank, input) {
  const text = clean(input || "");
  if (!text) return { ok: false, why: "This blank is empty." };

  let student;
  try {
    student = parse(tokenize(text), blank.kind === "assign");
  } catch (error) {
    return { ok: false, why: `That is not valid C++ here (${error.message}).` };
  }

  if (blank.kind === "assign" && student.t !== "assign") {
    return { ok: false, why: "This blank needs an assignment such as x = value." };
  }
  if (blank.kind === "expr" && student.t === "assign") {
    return { ok: false, why: "This blank needs a condition or value, not an assignment." };
  }

  const reference = parse(tokenize(blank.answer), blank.kind === "assign");

  for (const test of blank.tests) {
    const expectedEnv = cloneEnv(test.env);
    const studentEnv = cloneEnv(test.env);
    let expected;
    let got;

    try {
      expected = run(reference, expectedEnv);
      got = run(student, studentEnv);
    } catch (error) {
      return { ok: false, why: `Your code failed on a test case: ${error.message}.` };
    }

    const same =
      blank.kind === "assign"
        ? JSON.stringify(expectedEnv.dist) === JSON.stringify(studentEnv.dist)
        : blank.type === "bool"
          ? Boolean(expected) === Boolean(got)
          : expected === got;

    if (!same) return { ok: false, why: test.why };
  }

  return { ok: true };
}

// blank: { kind: "text", accept: ["q.front()"], wrong: { "q.top()": "reason" } }
export function judgeText(blank, input) {
  const norm = (s) => s.replace(/\s+/g, "").replace(/;+$/, "");
  const text = norm(input || "");
  if (!text) return { ok: false, why: "This blank is empty." };
  if (blank.accept.some((a) => norm(a) === text)) return { ok: true };
  const special = Object.entries(blank.wrong || {}).find(([key]) => norm(key) === text);
  return { ok: false, why: special ? special[1] : blank.fallback || "That is not the right code for this blank." };
}

export const judgeBlank = (blank, input) => (blank.kind === "text" ? judgeText(blank, input) : judgeCode(blank, input));
