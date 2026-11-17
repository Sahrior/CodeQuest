import { compile, createSession } from "./cppInterpreter";

export const STARTER_CODE = `#include <iostream>
using namespace std;

int main() {
    // game loop
    while (1) {
        int d1; // distance to enemy ship 1
        cin >> d1;
        int d2; // distance to enemy ship 2
        cin >> d2;

        // Write your logic here.
        // Print d1 to shoot enemy ship 1, or d2 to shoot enemy ship 2.
        // This line always shoots ship 1. Can you do better?
        cout << d1 << endl;
    }
}
`;

export const HINTS = [
  "Each turn you get two distances. The closest ship is the one with the smaller distance, and that is the one you must shoot.",
  "Compare the two distances with if / else, for example: if (d1 < d2) { ... } else { ... }",
  "Inside the if, print d1 because it is the closest. Inside the else, print d2.",
];

function makeWaves(seed, count) {
  let state = seed;
  const random = () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };

  const waves = [];

  while (waves.length < count) {
    const d1 = 5 + Math.floor(random() * 120);
    const d2 = 5 + Math.floor(random() * 120);
    if (d1 !== d2) waves.push([d1, d2]);
  }

  return waves;
}

export const LEVELS = [
  {
    id: 1,
    name: "Warm-up",
    description: "Five waves with clear gaps between the ships.",
    waves: [
      [34, 81],
      [92, 47],
      [58, 23],
      [15, 66],
      [71, 99],
    ],
  },
  {
    id: 2,
    name: "Close calls",
    description: "Eight waves where the ships are almost side by side.",
    waves: [
      [50, 49],
      [77, 78],
      [31, 33],
      [96, 95],
      [12, 13],
      [64, 60],
      [45, 48],
      [88, 85],
    ],
  },
  {
    id: 3,
    name: "Full assault",
    description: "Twelve waves with ships at random distances.",
    waves: makeWaves(20260, 12),
  },
];

export function runLevel(source, level) {
  const compiled = compile(source);

  if (!compiled.ok) {
    return { compileError: compiled.error };
  }

  const session = createSession(compiled.program);
  const turns = [];

  for (let index = 0; index < level.waves.length; index += 1) {
    const [d1, d2] = level.waves[index];
    const closest = d1 < d2 ? 1 : 2;
    const result = session.turn([String(d1), String(d2)]);

    const lines = result.output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    let outcome = "idle";
    let shot = null;
    let message = "";

    if (result.error) {
      outcome = "error";
      message = `Runtime error${result.error.line ? ` on line ${result.error.line}` : ""}: ${result.error.message}`;
    } else if (lines.length === 0) {
      outcome = "idle";
      message = result.finished
        ? "Your program stopped before this turn, so nothing was fired."
        : "Your program printed nothing this turn, so nothing was fired.";
    } else if (lines.length > 1) {
      outcome = "idle";
      message = `Print exactly one value per turn. You printed ${lines.length} lines.`;
    } else if (lines[0] === String(d1)) {
      shot = 1;
    } else if (lines[0] === String(d2)) {
      shot = 2;
    } else {
      outcome = "miss";
      message = `You printed "${lines[0]}", which is not the distance of either ship. The shot missed.`;
    }

    if (shot !== null) {
      if (shot === closest) {
        outcome = "clear";
        message = `Ship ${shot} was the closest. Destroyed!`;
      } else {
        outcome = "wrong";
        message = `You shot ship ${shot}, but ship ${closest} was closer. It crashed into your ship.`;
      }
    }

    turns.push({
      index,
      d1,
      d2,
      closest,
      shot,
      outcome,
      output: lines.join(" / "),
      message,
    });

    if (outcome !== "clear") break;
  }

  const passed = turns.length === level.waves.length && turns.every((turn) => turn.outcome === "clear");

  return { turns, passed };
}