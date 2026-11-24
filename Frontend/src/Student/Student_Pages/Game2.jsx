import { compile, createSession } from "../Student_Components/game/cppInterpreter";

export const STARTER_CODE = `#include <iostream>
#include <string>
using namespace std;

int main() {
    int low, high;
    cin >> low >> high; // the vault range, for example 1 and 128

    // game loop
    while (low <= high) {
        // TODO 1: pick mid, the middle of low and high.
        // Right now we always try the lowest number. Can you do better?
        int mid = low;

        cout << mid << endl; // try this password

        string hint;
        cin >> hint; // HIGHER, LOWER or CORRECT

        if (hint == "CORRECT") {
            break;
        }

        // TODO 2: use the hint to shrink the range
        // (change low or high so the useless half is thrown away).
    }
}
`;

export const HINTS = [
  "Binary search always tries the middle of the range. The middle of low and high is (low + high) / 2.",
  "If the vault says HIGHER, the password is bigger than mid, so every number up to mid is useless. Move low up to mid + 1.",
  "If the vault says LOWER, the password is smaller than mid. Move high down to mid - 1.",
  "Use if / else if on the hint inside the while loop: if (hint == \"HIGHER\") { low = mid + 1; } else if (hint == \"LOWER\") { high = mid - 1; }",
];

export const LEVELS = [
  {
    id: 1,
    name: "Bank Safe",
    description: "The password is between 1 and 128. Crack it in 7 attempts or fewer for 3 stars.",
    min: 1,
    max: 128,
    perfect: 7,
    maxAttempts: 12,
    alarmUp: 18,
    alarmDown: 12,
  },
  {
    id: 2,
    name: "Corporate Vault",
    description: "The password is between 1 and 1,024. Crack it in 10 attempts or fewer for 3 stars.",
    min: 1,
    max: 1024,
    perfect: 10,
    maxAttempts: 16,
    alarmUp: 18,
    alarmDown: 20,
  },
  {
    id: 3,
    name: "Central Reserve",
    description: "The password is between 1 and 1,000,000. Checking numbers one by one is hopeless, binary search needs 20 attempts at most.",
    min: 1,
    max: 1000000,
    perfect: 20,
    maxAttempts: 26,
    alarmUp: 18,
    alarmDown: 28,
  },
];

export const ALARM_LIMIT = 100;

export function starsFor(level, attempts) {
  if (attempts <= level.perfect) return 3;
  if (attempts <= level.perfect + 2) return 2;
  return 1;
}

// How many attempts a correct binary search needs to find this secret.
export function binarySteps(min, max, secret) {
  let low = min;
  let high = max;
  let steps = 0;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    steps += 1;
    if (mid === secret) return steps;
    if (mid < secret) low = mid + 1;
    else high = mid - 1;
  }

  return steps;
}

// A fresh password on every Submit, so printing a memorised answer never works.
// Only passwords that a perfect binary search finds within the 3 star limit are used.
export function pickSecret(level) {
  for (let tries = 0; tries < 500; tries += 1) {
    const secret = level.min + Math.floor(Math.random() * (level.max - level.min + 1));
    if (binarySteps(level.min, level.max, secret) <= level.perfect) return secret;
  }

  return Math.floor((level.min + level.max) / 2);
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const format = (value) => value.toLocaleString("en-US");

export function runLevel(source, level, secret) {
  const compiled = compile(source);

  if (!compiled.ok) {
    return { compileError: compiled.error };
  }

  const session = createSession(compiled.program);
  const turns = [];

  let low = level.min;
  let high = level.max;
  let alarm = 0;
  let tokens = [String(level.min), String(level.max)];

  for (let index = 0; index < level.maxAttempts; index += 1) {
    const result = session.turn(tokens);

    const lines = result.output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const turn = {
      index,
      low,
      high,
      newLow: low,
      newHigh: high,
      guess: null,
      hint: null,
      status: "idle",
      output: lines.join(" / "),
      alarmBefore: alarm,
      alarmAfter: alarm,
      alarmUp: 0,
      relief: 0,
      eliminated: 0,
      message: "",
    };

    turns.push(turn);

    if (result.error) {
      turn.status = "error";
      turn.message = `Runtime error${result.error.line ? ` on line ${result.error.line}` : ""}: ${result.error.message}`;
      break;
    }

    if (lines.length === 0) {
      turn.message = result.finished
        ? "Your program stopped before this attempt, so no password was tried."
        : "Your program printed nothing this attempt, so no password was tried.";
      break;
    }

    if (lines.length > 1) {
      turn.message = `Print exactly one number per attempt. You printed ${lines.length} lines.`;
      break;
    }

    if (!/^-?\d+$/.test(lines[0])) {
      turn.status = "invalid";
      turn.message = `You printed "${lines[0]}", which is not a whole number. Print only your mid.`;
      break;
    }

    const guess = Number(lines[0]);
    turn.guess = guess;

    if (guess === secret) {
      turn.status = "cracked";
      turn.hint = "CORRECT";
      turn.message = `${format(guess)} is the password! ACCESS GRANTED in ${index + 1} attempt${index === 0 ? "" : "s"}.`;
      break;
    }

    const before = high - low + 1;
    let newLow = low;
    let newHigh = high;

    if (guess < secret) {
      turn.hint = "HIGHER";
      newLow = Math.max(low, guess + 1);
    } else {
      turn.hint = "LOWER";
      newHigh = Math.min(high, guess - 1);
    }

    const eliminated = before - (newHigh - newLow + 1);
    const relief = Math.round((eliminated / before) * level.alarmDown);
    const alarmAfter = clamp(alarm + level.alarmUp - relief, 0, ALARM_LIMIT);

    turn.newLow = newLow;
    turn.newHigh = newHigh;
    turn.eliminated = eliminated;
    turn.alarmUp = level.alarmUp;
    turn.relief = relief;
    turn.alarmAfter = alarmAfter;

    const direction = guess < secret ? "too low" : "too high";
    let message = `${format(guess)} is ${direction}. The password is ${turn.hint}.`;
    message +=
      eliminated > 0
        ? ` ${format(eliminated)} number${eliminated === 1 ? "" : "s"} eliminated.`
        : " Nothing new was eliminated.";
    message += ` Alarm ${alarm}% to ${alarmAfter}%.`;

    if (alarmAfter >= ALARM_LIMIT) {
      turn.status = "lockdown";
      turn.message = `${message} The alarm hit 100% and the vault went into lockdown.`;
      break;
    }

    if (index + 1 >= level.maxAttempts) {
      turn.status = "limit";
      turn.message = `${message} You ran out of attempts (${level.maxAttempts}).`;
      break;
    }

    turn.status = "continue";
    turn.message = message;

    low = newLow;
    high = newHigh;
    alarm = alarmAfter;
    tokens = [turn.hint];
  }

  const last = turns[turns.length - 1];
  const passed = last.status === "cracked";
  const attempts = turns.length;

  return {
    turns,
    passed,
    secret,
    attempts,
    stars: passed ? starsFor(level, attempts) : 0,
  };
}