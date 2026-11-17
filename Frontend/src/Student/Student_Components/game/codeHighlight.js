const TOKEN_PATTERN = new RegExp(
  [
    "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?(?:\\*\\/|$))",
    "(#[^\\n]*)",
    "(\"(?:[^\"\\\\\\n]|\\\\.)*\"?|'(?:[^'\\\\\\n]|\\\\.)*'?)",
    "\\b(\\d+(?:\\.\\d+)?)\\b",
    "\\b(int|long|double|float|bool|string|char|void|auto|short|unsigned)\\b",
    "\\b(if|else|while|for|return|break|continue|true|false|using|namespace|do|switch|case|const)\\b",
    "\\b(cin|cout|endl|min|max|abs|main|std)\\b",
  ].join("|"),
  "g"
);

const GROUP_TYPES = [null, "comment", "preprocessor", "string", "number", "type", "keyword", "builtin"];

export function tokenizeCode(code) {
  const tokens = [];
  let last = 0;

  TOKEN_PATTERN.lastIndex = 0;

  let match = TOKEN_PATTERN.exec(code);
  while (match !== null) {
    if (match[0] === "") {
      TOKEN_PATTERN.lastIndex += 1;
      match = TOKEN_PATTERN.exec(code);
      continue;
    }

    if (match.index > last) {
      tokens.push({ text: code.slice(last, match.index), type: "plain" });
    }

    let type = "plain";
    for (let group = 1; group < GROUP_TYPES.length; group += 1) {
      if (match[group] !== undefined) {
        type = GROUP_TYPES[group];
        break;
      }
    }

    tokens.push({ text: match[0], type });
    last = match.index + match[0].length;
    match = TOKEN_PATTERN.exec(code);
  }

  if (last < code.length) {
    tokens.push({ text: code.slice(last), type: "plain" });
  }

  return tokens;
}

export function highlightLines(code) {
  const lines = [[]];

  tokenizeCode(code).forEach((token) => {
    const pieces = token.text.split("\n");

    pieces.forEach((piece, index) => {
      if (index > 0) lines.push([]);
      if (piece !== "") lines[lines.length - 1].push({ text: piece, type: token.type });
    });
  });

  return lines;
}