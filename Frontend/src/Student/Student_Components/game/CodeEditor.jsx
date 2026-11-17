import { useLayoutEffect, useRef } from "react";
import { highlightLines } from "./codeHighlight";

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const INDENT = "    ";

const TYPE_CLASS = {
  plain: "text-slate-200",
  comment: "italic text-slate-500",
  preprocessor: "text-violet-300",
  string: "text-emerald-300",
  number: "text-amber-300",
  type: "text-sky-300",
  keyword: "text-orange-400",
  builtin: "text-yellow-200",
};

export default function CodeEditor({ value, onChange, readOnly = false, errorLine = null }) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const gutterRef = useRef(null);
  const pendingCaret = useRef(null);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && textareaRef.current) {
      textareaRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  });

  const lines = highlightLines(value);

  const syncScroll = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (highlightRef.current) {
      highlightRef.current.scrollTop = textarea.scrollTop;
      highlightRef.current.scrollLeft = textarea.scrollLeft;
    }

    if (gutterRef.current) {
      gutterRef.current.scrollTop = textarea.scrollTop;
    }
  };

  const insertText = (text, caretOffset = text.length) => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    pendingCaret.current = start + caretOffset;
    onChange(value.slice(0, start) + text + value.slice(end));
  };

  const onKeyDown = (e) => {
    if (readOnly) return;

    if (e.key === "Tab" && !e.shiftKey) {
      e.preventDefault();
      insertText(INDENT);
      return;
    }

    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();

      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const indent = value.slice(lineStart, start).match(/^[ \t]*/)[0];
      const before = value[start - 1];
      const after = value[textarea.selectionEnd];

      if (before === "{" && after === "}") {
        insertText(`\n${indent}${INDENT}\n${indent}`, 1 + indent.length + INDENT.length);
      } else if (before === "{") {
        insertText(`\n${indent}${INDENT}`);
      } else {
        insertText(`\n${indent}`);
      }
    }
  };

  return (
    <div
      className="relative flex h-[420px] overflow-hidden rounded-xl border border-orange-500/25 bg-[#0b1020] text-[13px] leading-6"
      style={{ fontFamily: MONO }}
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="w-12 shrink-0 select-none overflow-hidden border-r border-white/5 bg-[#0d1328] py-3 pr-3 text-right text-slate-600"
      >
        {lines.map((_, index) => (
          <div key={index} className={`h-6 ${errorLine === index + 1 ? "font-bold text-red-400" : ""}`}>
            {index + 1}
          </div>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div
          ref={highlightRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden px-4 py-3"
        >
          {lines.map((tokens, index) => (
            <div key={index} className={`h-6 whitespace-pre ${errorLine === index + 1 ? "bg-red-500/15" : ""}`}>
              {tokens.length === 0
                ? " "
                : tokens.map((token, tokenIndex) => (
                    <span key={tokenIndex} className={TYPE_CLASS[token.type]}>
                      {token.text}
                    </span>
                  ))}
            </div>
          ))}
        </div>

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={syncScroll}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          wrap="off"
          aria-label="C++ code editor"
          style={{ fontFamily: MONO }}
          className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent px-4 py-3 text-[13px] leading-6 text-transparent caret-orange-300 outline-none selection:bg-orange-500/30"
        />
      </div>
    </div>
  );
}