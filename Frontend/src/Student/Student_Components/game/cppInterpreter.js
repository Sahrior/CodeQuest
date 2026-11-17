const TYPE_WORDS = new Set(["int", "long", "double", "float", "bool", "string"]);

const UNSUPPORTED_WORDS = new Set([
  "char",
  "short",
  "unsigned",
  "signed",
  "auto",
  "void",
  "vector",
  "map",
  "set",
  "struct",
  "class",
  "switch",
  "do",
  "goto",
  "const",
]);

const BUILTIN_FUNCS = { min: 2, max: 2, abs: 1 };

const TWO_CHAR_OPS = new Set([
  "<<", ">>", "<=", ">=", "==", "!=", "&&", "||", "++", "--", "+=", "-=", "*=", "/=", "%=",
]);

const ONE_CHAR_OPS = "+-*/%<>=!(){};,?:.&|[]";

const ASSIGN_OPS = ["=", "+=", "-=", "*=", "/=", "%="];

export const STEP_LIMIT = 20000;

const NEED_INPUT = Symbol("need_input");

class CppError extends Error {
  constructor(kind, message, line) {
    super(message);
    this.kind = kind;
    this.line = line;
  }
}

const compileError = (message, line) => new CppError("compile", message, line);
const runtimeError = (message, line) => new CppError("runtime", message, line);

/* ------------------------------------------------------------------ */
/* Lexer                                                               */
/* ------------------------------------------------------------------ */

const isLetter = (c) => /[A-Za-z_]/.test(c);
const isDigit = (c) => c !== undefined && /[0-9]/.test(c);
const isWordChar = (c) => c !== undefined && /[A-Za-z0-9_]/.test(c);

function readQuoted(source, start, quote, line) {
  let j = start + 1;
  let text = "";

  while (j < source.length && source[j] !== quote) {
    if (source[j] === "\n") {
      throw compileError(`missing terminating ${quote} character`, line);
    }

    if (source[j] === "\\") {
      const e = source[j + 1];
      text += e === "n" ? "\n" : e === "t" ? "\t" : e === "0" ? "\0" : e;
      j += 2;
    } else {
      text += source[j];
      j += 1;
    }
  }

  if (j >= source.length) {
    throw compileError(`missing terminating ${quote} character`, line);
  }

  return { text, end: j + 1 };
}

function tokenize(source) {
  const tokens = [];
  const n = source.length;
  let i = 0;
  let line = 1;

  const push = (type, value, extra = {}) => tokens.push({ type, value, line, ...extra });

  while (i < n) {
    const c = source[i];

    if (c === "\n") {
      line += 1;
      i += 1;
      continue;
    }

    if (c === " " || c === "\t" || c === "\r") {
      i += 1;
      continue;
    }

    if (c === "#") {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }

    if (c === "/" && source[i + 1] === "/") {
      while (i < n && source[i] !== "\n") i += 1;
      continue;
    }

    if (c === "/" && source[i + 1] === "*") {
      const startLine = line;
      i += 2;
      while (i < n && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") line += 1;
        i += 1;
      }
      if (i >= n) throw compileError("unterminated /* comment", startLine);
      i += 2;
      continue;
    }

    if (isLetter(c)) {
      let j = i;
      while (j < n && isWordChar(source[j])) j += 1;
      const word = source.slice(i, j);
      i = j;

      if (word === "std" && source.startsWith("::", i)) {
        i += 2;
        continue;
      }

      push("id", word);
      continue;
    }

    if (isDigit(c)) {
      let j = i;
      while (isDigit(source[j])) j += 1;

      let isFloat = false;
      if (source[j] === "." && isDigit(source[j + 1])) {
        isFloat = true;
        j += 1;
        while (isDigit(source[j])) j += 1;
      }

      push("num", Number(source.slice(i, j)), { isFloat });
      i = j;
      continue;
    }

    if (c === '"' || c === "'") {
      const { text, end } = readQuoted(source, i, c, line);
      push("str", text);
      i = end;
      continue;
    }

    const two = source.slice(i, i + 2);
    if (TWO_CHAR_OPS.has(two)) {
      push("op", two);
      i += 2;
      continue;
    }

    if (ONE_CHAR_OPS.includes(c)) {
      push("op", c);
      i += 1;
      continue;
    }

    throw compileError(`stray '${c}' in program`, line);
  }

  tokens.push({ type: "eof", value: "end of file", line });
  return tokens;
}

/* ------------------------------------------------------------------ */
/* Parser                                                              */
/* ------------------------------------------------------------------ */

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
    this.scopes = [new Set()];
    this.loopDepth = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  next() {
    const token = this.tokens[this.pos];
    if (token.type !== "eof") this.pos += 1;
    return token;
  }

  prevLine() {
    return this.pos > 0 ? this.tokens[this.pos - 1].line : this.peek().line;
  }

  isOp(value) {
    const token = this.peek();
    return token.type === "op" && token.value === value;
  }

  isId(value) {
    const token = this.peek();
    return token.type === "id" && token.value === value;
  }

  expectOp(value) {
    if (this.isOp(value)) return this.next();
    const token = this.peek();
    throw compileError(`expected '${value}' before '${token.value}'`, token.line);
  }

  expectSemicolon() {
    if (this.isOp(";")) return this.next();
    const token = this.peek();
    throw compileError(`expected ';' before '${token.value}'`, this.prevLine());
  }

  pushScope() {
    this.scopes.push(new Set());
  }

  popScope() {
    this.scopes.pop();
  }

  declare(name, line) {
    const scope = this.scopes[this.scopes.length - 1];
    if (scope.has(name)) throw compileError(`redeclaration of '${name}'`, line);
    scope.add(name);
  }

  requireDeclared(token) {
    if (!this.scopes.some((scope) => scope.has(token.value))) {
      throw compileError(`'${token.value}' was not declared in this scope`, token.line);
    }
  }

  parseProgram() {
    while (this.isId("using")) {
      while (!this.isOp(";") && this.peek().type !== "eof") this.next();
      this.expectSemicolon();
    }

    const first = this.next();
    if (!(first.type === "id" && first.value === "int")) {
      throw compileError("start your program with int main() { ... }", first.line);
    }

    const name = this.next();
    if (!(name.type === "id" && name.value === "main")) {
      throw compileError("start your program with int main() { ... }", name.line);
    }

    this.expectOp("(");
    if (this.isId("void")) this.next();
    this.expectOp(")");

    const main = this.parseBlock();

    if (this.peek().type !== "eof") {
      throw compileError("only int main() is supported in this game", this.peek().line);
    }

    return { main };
  }

  parseBlock() {
    const open = this.expectOp("{");
    this.pushScope();

    const body = [];
    while (!this.isOp("}")) {
      if (this.peek().type === "eof") {
        throw compileError("expected '}' at the end of the program", open.line);
      }
      body.push(this.parseStatement());
    }

    this.next();
    this.popScope();

    return { type: "block", body, line: open.line };
  }

  parseBody() {
    this.pushScope();
    const statement = this.parseStatement();
    this.popScope();
    return statement;
  }

  parseStatement() {
    const token = this.peek();

    if (token.type === "op") {
      if (token.value === "{") return this.parseBlock();

      if (token.value === ";") {
        this.next();
        return { type: "empty", line: token.line };
      }

      if (token.value === "++" || token.value === "--") {
        const node = this.parseSimple();
        this.expectSemicolon();
        return node;
      }
    }

    if (token.type === "id") {
      switch (token.value) {
        case "if":
          return this.parseIf();
        case "while":
          return this.parseWhile();
        case "for":
          return this.parseFor();
        case "break":
        case "continue": {
          this.next();
          if (this.loopDepth === 0) {
            throw compileError(`${token.value} statement not within a loop`, token.line);
          }
          this.expectSemicolon();
          return { type: token.value, line: token.line };
        }
        case "return": {
          this.next();
          if (!this.isOp(";")) this.parseTernary();
          this.expectSemicolon();
          return { type: "return", line: token.line };
        }
        case "cin":
          return this.parseCin();
        case "cout":
          return this.parseCout();
        case "else":
          throw compileError("'else' without a previous 'if'", token.line);
        default:
          break;
      }

      if (TYPE_WORDS.has(token.value)) return this.parseDeclaration(true);

      if (UNSUPPORTED_WORDS.has(token.value)) {
        throw compileError(`'${token.value}' is not supported in this game yet`, token.line);
      }
    }

    const node = this.parseSimple();
    this.expectSemicolon();
    return node;
  }

  parseDeclaration(requireSemicolon) {
    const first = this.next();
    let typeWord = first.value;

    if (typeWord === "long") {
      if (this.isId("long")) this.next();
      if (this.isId("int")) this.next();
    }

    const varType =
      typeWord === "float" || typeWord === "double"
        ? "double"
        : typeWord === "bool"
          ? "bool"
          : typeWord === "string"
            ? "string"
            : "int";

    const items = [];

    do {
      const nameToken = this.next();

      if (nameToken.type !== "id") {
        throw compileError(`expected a variable name before '${nameToken.value}'`, nameToken.line);
      }

      if (this.isOp("[")) {
        throw compileError("arrays are not supported in this game yet", nameToken.line);
      }

      let init = null;
      if (this.isOp("=")) {
        this.next();
        init = this.parseTernary();
      }

      this.declare(nameToken.value, nameToken.line);
      items.push({ name: nameToken.value, init, line: nameToken.line });
    } while (this.isOp(",") && this.next());

    if (requireSemicolon) this.expectSemicolon();

    return { type: "decl", varType, items, line: first.line };
  }

  parseSimple() {
    const token = this.peek();

    if (token.type === "op" && (token.value === "++" || token.value === "--")) {
      this.next();
      const target = this.next();
      if (target.type !== "id") {
        throw compileError(`expected a variable after '${token.value}'`, target.line);
      }
      this.requireDeclared(target);
      return { type: "incdec", name: target.value, op: token.value, line: token.line };
    }

    if (token.type === "id") {
      const nameToken = this.next();
      this.requireDeclared(nameToken);

      const following = this.peek();

      if (following.type === "op" && ASSIGN_OPS.includes(following.value)) {
        this.next();
        const value = this.parseTernary();
        return {
          type: "assign",
          name: nameToken.value,
          op: following.value,
          value,
          line: nameToken.line,
        };
      }

      if (following.type === "op" && (following.value === "++" || following.value === "--")) {
        this.next();
        return { type: "incdec", name: nameToken.value, op: following.value, line: nameToken.line };
      }

      throw compileError(
        `expected '=' or ';' after '${nameToken.value}', but found '${following.value}'`,
        following.line
      );
    }

    throw compileError(`expected a statement before '${token.value}'`, token.line);
  }

  parseIf() {
    const token = this.next();
    this.expectOp("(");
    const cond = this.parseTernary();
    this.expectOp(")");
    const then = this.parseBody();

    let otherwise = null;
    if (this.isId("else")) {
      this.next();
      otherwise = this.parseBody();
    }

    return { type: "if", cond, then, otherwise, line: token.line };
  }

  parseWhile() {
    const token = this.next();
    this.expectOp("(");
    const cond = this.parseTernary();
    this.expectOp(")");

    this.loopDepth += 1;
    const body = this.parseBody();
    this.loopDepth -= 1;

    return { type: "while", cond, body, line: token.line };
  }

  parseFor() {
    const token = this.next();
    this.expectOp("(");
    this.pushScope();

    let init = null;
    if (!this.isOp(";")) {
      const head = this.peek();
      init =
        head.type === "id" && TYPE_WORDS.has(head.value)
          ? this.parseDeclaration(false)
          : this.parseSimple();
    }
    this.expectSemicolon();

    let cond = null;
    if (!this.isOp(";")) cond = this.parseTernary();
    this.expectSemicolon();

    let step = null;
    if (!this.isOp(")")) step = this.parseSimple();
    this.expectOp(")");

    this.loopDepth += 1;
    const body = this.parseBody();
    this.loopDepth -= 1;

    this.popScope();

    return { type: "for", init, cond, step, body, line: token.line };
  }

  parseCin() {
    const token = this.next();

    if (this.isOp(".")) {
      this.next();
      const method = this.next();

      if (method.value !== "ignore") {
        throw compileError(`'cin.${method.value}' is not supported in this game`, method.line);
      }

      this.expectOp("(");
      if (!this.isOp(")")) {
        this.parseTernary();
        if (this.isOp(",")) {
          this.next();
          this.parseTernary();
        }
      }
      this.expectOp(")");
      this.expectSemicolon();

      return { type: "ignore", line: token.line };
    }

    if (!this.isOp(">>")) {
      throw compileError("expected '>>' after 'cin'", token.line);
    }

    const targets = [];
    while (this.isOp(">>")) {
      this.next();
      const variable = this.next();

      if (variable.type !== "id") {
        throw compileError(
          `expected a variable after '>>' but found '${variable.value}'`,
          variable.line
        );
      }

      this.requireDeclared(variable);
      targets.push({ name: variable.value, line: variable.line });
    }

    this.expectSemicolon();

    return { type: "cin", targets, line: token.line };
  }

  parseCout() {
    const token = this.next();

    if (!this.isOp("<<")) {
      throw compileError("expected '<<' after 'cout'", token.line);
    }

    const parts = [];
    while (this.isOp("<<")) {
      this.next();
      const head = this.peek();

      if (head.type === "id" && head.value === "endl") {
        this.next();
        parts.push({ type: "endl" });
      } else {
        parts.push({ type: "expr", expr: this.parseAdditive() });
      }
    }

    this.expectSemicolon();

    return { type: "cout", parts, line: token.line };
  }

  parseTernary() {
    const cond = this.parseOr();

    if (this.isOp("?")) {
      const mark = this.next();
      const a = this.parseTernary();
      this.expectOp(":");
      const b = this.parseTernary();
      return { type: "ternary", cond, a, b, line: mark.line };
    }

    return cond;
  }

  parseBinaryLevel(operators, parseNext) {
    let left = parseNext();

    while (this.peek().type === "op" && operators.includes(this.peek().value)) {
      const operator = this.next();
      const right = parseNext();
      left = { type: "bin", op: operator.value, left, right, line: operator.line };
    }

    return left;
  }

  parseOr() {
    return this.parseBinaryLevel(["||"], () => this.parseAnd());
  }

  parseAnd() {
    return this.parseBinaryLevel(["&&"], () => this.parseEquality());
  }

  parseEquality() {
    return this.parseBinaryLevel(["==", "!="], () => this.parseRelational());
  }

  parseRelational() {
    return this.parseBinaryLevel(["<", ">", "<=", ">="], () => this.parseAdditive());
  }

  parseAdditive() {
    return this.parseBinaryLevel(["+", "-"], () => this.parseMultiplicative());
  }

  parseMultiplicative() {
    return this.parseBinaryLevel(["*", "/", "%"], () => this.parseUnary());
  }

  parseUnary() {
    const token = this.peek();

    if (token.type === "op" && (token.value === "-" || token.value === "+" || token.value === "!")) {
      this.next();
      return { type: "unary", op: token.value, expr: this.parseUnary(), line: token.line };
    }

    return this.parsePrimary();
  }

  parsePrimary() {
    const token = this.next();

    if (token.type === "num") {
      return { type: "num", value: token.value, isFloat: token.isFloat, line: token.line };
    }

    if (token.type === "str") {
      return { type: "str", value: token.value, line: token.line };
    }

    if (token.type === "op" && token.value === "(") {
      const inner = this.parseTernary();
      this.expectOp(")");
      return inner;
    }

    if (token.type === "id") {
      if (token.value === "true" || token.value === "false") {
        return { type: "bool", value: token.value === "true" ? 1 : 0, line: token.line };
      }

      if (BUILTIN_FUNCS[token.value] !== undefined && this.isOp("(")) {
        this.next();
        const args = [];

        if (!this.isOp(")")) {
          do {
            args.push(this.parseTernary());
          } while (this.isOp(",") && this.next());
        }

        this.expectOp(")");

        if (args.length !== BUILTIN_FUNCS[token.value]) {
          throw compileError(
            `${token.value}() needs ${BUILTIN_FUNCS[token.value]} value(s), but you gave ${args.length}`,
            token.line
          );
        }

        return { type: "call", name: token.value, args, line: token.line };
      }

      this.requireDeclared(token);
      return { type: "var", name: token.value, line: token.line };
    }

    throw compileError(`expected a value before '${token.value}'`, token.line);
  }
}

/* ------------------------------------------------------------------ */
/* Interpreter                                                         */
/* ------------------------------------------------------------------ */

const boolValue = (x) => ({ t: "bool", v: x ? 1 : 0 });

const truthy = (value) => (value.t === "string" ? value.v !== "" : value.v !== 0);

const defaultValue = (type) => (type === "string" ? { t: "string", v: "" } : { t: type, v: 0 });

function convert(value, type, line) {
  if (type === "string") {
    if (value.t !== "string") throw runtimeError("a number can't be stored in a string", line);
    return { t: "string", v: value.v };
  }

  if (value.t === "string") throw runtimeError("text can't be stored in a number", line);

  if (type === "int") return { t: "int", v: Math.trunc(value.v) };
  if (type === "double") return { t: "double", v: value.v };
  return { t: "bool", v: value.v !== 0 ? 1 : 0 };
}

function lookup(ctx, name) {
  for (let i = ctx.scopes.length - 1; i >= 0; i -= 1) {
    const cell = ctx.scopes[i].get(name);
    if (cell) return cell;
  }
  return null;
}

function tick(ctx, line) {
  ctx.budget -= 1;
  if (ctx.budget < 0) {
    throw runtimeError(
      "your program ran for too long. Check for an endless loop that never reads input",
      line
    );
  }
}

function applyBinary(op, l, r, line) {
  if (l.t === "string" || r.t === "string") {
    if (l.t !== r.t) throw runtimeError("you can't mix text and numbers here", line);

    switch (op) {
      case "+":
        return { t: "string", v: l.v + r.v };
      case "==":
        return boolValue(l.v === r.v);
      case "!=":
        return boolValue(l.v !== r.v);
      case "<":
        return boolValue(l.v < r.v);
      case "<=":
        return boolValue(l.v <= r.v);
      case ">":
        return boolValue(l.v > r.v);
      case ">=":
        return boolValue(l.v >= r.v);
      default:
        throw runtimeError(`operator '${op}' can't be used on text`, line);
    }
  }

  const useDouble = l.t === "double" || r.t === "double";
  const resultType = useDouble ? "double" : "int";
  const a = l.v;
  const b = r.v;

  switch (op) {
    case "+":
      return { t: resultType, v: a + b };
    case "-":
      return { t: resultType, v: a - b };
    case "*":
      return { t: resultType, v: a * b };
    case "/":
      if (!useDouble) {
        if (b === 0) throw runtimeError("division by zero", line);
        return { t: "int", v: Math.trunc(a / b) };
      }
      return { t: "double", v: a / b };
    case "%":
      if (useDouble) throw runtimeError("'%' only works with whole numbers", line);
      if (b === 0) throw runtimeError("division by zero", line);
      return { t: "int", v: a % b };
    case "<":
      return boolValue(a < b);
    case "<=":
      return boolValue(a <= b);
    case ">":
      return boolValue(a > b);
    case ">=":
      return boolValue(a >= b);
    case "==":
      return boolValue(a === b);
    case "!=":
      return boolValue(a !== b);
    default:
      throw runtimeError(`unknown operator '${op}'`, line);
  }
}

function evalExpr(node, ctx) {
  switch (node.type) {
    case "num":
      return { t: node.isFloat ? "double" : "int", v: node.value };

    case "str":
      return { t: "string", v: node.value };

    case "bool":
      return { t: "bool", v: node.value };

    case "var": {
      const cell = lookup(ctx, node.name);
      if (!cell) throw runtimeError(`'${node.name}' is not declared`, node.line);
      return { t: cell.type, v: cell.v };
    }

    case "unary": {
      const value = evalExpr(node.expr, ctx);

      if (node.op === "!") return boolValue(!truthy(value));

      if (value.t === "string") {
        throw runtimeError(`operator '${node.op}' can't be used on text`, node.line);
      }

      const type = value.t === "double" ? "double" : "int";
      return { t: type, v: node.op === "-" ? -value.v : value.v };
    }

    case "bin": {
      if (node.op === "&&") {
        const left = evalExpr(node.left, ctx);
        if (!truthy(left)) return boolValue(false);
        return boolValue(truthy(evalExpr(node.right, ctx)));
      }

      if (node.op === "||") {
        const left = evalExpr(node.left, ctx);
        if (truthy(left)) return boolValue(true);
        return boolValue(truthy(evalExpr(node.right, ctx)));
      }

      return applyBinary(node.op, evalExpr(node.left, ctx), evalExpr(node.right, ctx), node.line);
    }

    case "ternary":
      return truthy(evalExpr(node.cond, ctx)) ? evalExpr(node.a, ctx) : evalExpr(node.b, ctx);

    case "call": {
      const args = node.args.map((arg) => evalExpr(arg, ctx));

      if (args.some((arg) => arg.t === "string")) {
        throw runtimeError(`${node.name}() only works with numbers`, node.line);
      }

      const type = args.some((arg) => arg.t === "double") ? "double" : "int";

      if (node.name === "min") return { t: type, v: Math.min(args[0].v, args[1].v) };
      if (node.name === "max") return { t: type, v: Math.max(args[0].v, args[1].v) };
      return { t: type, v: Math.abs(args[0].v) };
    }

    default:
      throw runtimeError("this expression is not supported", node.line);
  }
}

function formatValue(value) {
  if (value.t === "string") return value.v;
  if (value.t === "double") return String(Number(value.v.toPrecision(6)));
  return String(value.v);
}

function readNumberToken(type, token, line) {
  if (type === "string") return token;

  if (type === "double") {
    const number = Number(token);
    if (Number.isNaN(number)) {
      throw runtimeError(`could not read a number from the input ("${token}")`, line);
    }
    return number;
  }

  if (!/^-?\d+$/.test(token)) {
    throw runtimeError(`could not read a whole number from the input ("${token}")`, line);
  }

  const number = Number.parseInt(token, 10);
  return type === "bool" ? (number !== 0 ? 1 : 0) : number;
}

function* readToken(ctx) {
  while (ctx.input.length === 0) {
    yield NEED_INPUT;
  }
  return ctx.input.shift();
}

function* execScoped(node, ctx) {
  ctx.scopes.push(new Map());
  try {
    return yield* execStatement(node, ctx);
  } finally {
    ctx.scopes.pop();
  }
}

function* execStatement(node, ctx) {
  tick(ctx, node.line);

  switch (node.type) {
    case "empty":
      return null;

    case "block": {
      ctx.scopes.push(new Map());
      try {
        for (const statement of node.body) {
          const signal = yield* execStatement(statement, ctx);
          if (signal) return signal;
        }
      } finally {
        ctx.scopes.pop();
      }
      return null;
    }

    case "decl": {
      for (const item of node.items) {
        const value = item.init
          ? convert(evalExpr(item.init, ctx), node.varType, item.line)
          : defaultValue(node.varType);
        ctx.scopes[ctx.scopes.length - 1].set(item.name, { type: node.varType, v: value.v });
      }
      return null;
    }

    case "assign": {
      const cell = lookup(ctx, node.name);
      let value = evalExpr(node.value, ctx);

      if (node.op !== "=") {
        value = applyBinary(node.op[0], { t: cell.type, v: cell.v }, value, node.line);
      }

      cell.v = convert(value, cell.type, node.line).v;
      return null;
    }

    case "incdec": {
      const cell = lookup(ctx, node.name);
      if (cell.type === "string") throw runtimeError("you can't use ++ or -- on text", node.line);
      cell.v += node.op === "++" ? 1 : -1;
      return null;
    }

    case "if": {
      if (truthy(evalExpr(node.cond, ctx))) return yield* execScoped(node.then, ctx);
      if (node.otherwise) return yield* execScoped(node.otherwise, ctx);
      return null;
    }

    case "while": {
      while (truthy(evalExpr(node.cond, ctx))) {
        tick(ctx, node.line);
        const signal = yield* execScoped(node.body, ctx);

        if (signal) {
          if (signal.type === "break") break;
          if (signal.type === "continue") continue;
          return signal;
        }
      }
      return null;
    }

    case "for": {
      ctx.scopes.push(new Map());
      try {
        if (node.init) yield* execStatement(node.init, ctx);

        while (node.cond === null || truthy(evalExpr(node.cond, ctx))) {
          tick(ctx, node.line);
          const signal = yield* execScoped(node.body, ctx);

          if (signal) {
            if (signal.type === "break") break;
            if (signal.type !== "continue") return signal;
          }

          if (node.step) yield* execStatement(node.step, ctx);
        }
      } finally {
        ctx.scopes.pop();
      }
      return null;
    }

    case "break":
      return { type: "break" };

    case "continue":
      return { type: "continue" };

    case "return":
      return { type: "return" };

    case "cin": {
      for (const target of node.targets) {
        const token = yield* readToken(ctx);
        const cell = lookup(ctx, target.name);
        cell.v = readNumberToken(cell.type, token, target.line);
      }
      return null;
    }

    case "ignore":
      return null;

    case "cout": {
      for (const part of node.parts) {
        if (part.type === "endl") ctx.output.push("\n");
        else ctx.output.push(formatValue(evalExpr(part.expr, ctx)));
      }
      return null;
    }

    default:
      throw runtimeError("this statement is not supported", node.line);
  }
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function compile(source) {
  try {
    const parser = new Parser(tokenize(source));
    return { ok: true, program: parser.parseProgram() };
  } catch (error) {
    if (error instanceof CppError) {
      return { ok: false, error: { line: error.line, message: error.message } };
    }
    throw error;
  }
}

export function createSession(program) {
  const ctx = { input: [], output: [], budget: STEP_LIMIT, scopes: [new Map()] };
  const generator = execStatement(program.main, ctx);

  let finished = false;
  let failure = null;

  return {
    turn(tokens) {
      if (finished) return { output: "", finished: true, error: failure };

      ctx.input.push(...tokens);
      ctx.output = [];
      ctx.budget = STEP_LIMIT;

      try {
        const step = generator.next();
        if (step.done) finished = true;
      } catch (error) {
        if (!(error instanceof CppError)) throw error;
        finished = true;
        failure = { line: error.line, message: error.message };
      }

      return { output: ctx.output.join(""), finished, error: failure };
    },
  };
}