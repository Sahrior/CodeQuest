export const WIDTH = 800;
export const HEIGHT = 450;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace';
const HEX = "0123456789ABCDEF";

const COLORS = {
  cyan: "#22d3ee",
  amber: "#fbbf24",
  green: "#34d399",
  red: "#f87171",
  orange: "#fb923c",
  dim: "#64748b",
  text: "#e2e8f0",
};

const DOOR = { x: 215, y: 226, r: 148 };
const TERMINAL = { x: 432, y: 24, w: 352, h: 170 };
const RANGE = { x: 432, y: 206, w: 352, h: 112 };
const ALARM = { x: 432, y: 330, w: 352, h: 96 };

const DIAL_IDLE = 0.35;
const DIAL_FAST = 14;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function resetState(scene, min, max) {
  scene.min = min;
  scene.max = max;
  scene.low = min;
  scene.high = max;
  scene.viewLow = min;
  scene.viewHigh = max;
  scene.viewLowTarget = min;
  scene.viewHighTarget = max;
  scene.guessText = "";
  scene.typed = 0;
  scene.response = null;
  scene.marker = null;
  scene.alarm = 0;
  scene.alarmTarget = 0;
  scene.floaters = [];
  scene.particles = [];
  scene.dialSpeed = DIAL_IDLE;
  scene.door = "locked";
  scene.doorOpen = 0;
  scene.bars = 1;
  scene.flash = 0;
  scene.shake = 0;
  scene.secretText = "???";
  scene.steps = [];
  scene.stepIndex = 0;
  scene.stepTime = 0;
  scene.events = [];
}

export function createScene() {
  const rain = [];
  for (let i = 0; i < 44; i += 1) {
    rain.push({
      x: 6 + i * 18,
      y: Math.random() * HEIGHT,
      speed: 28 + Math.random() * 60,
      len: 5 + Math.floor(Math.random() * 6),
      seed: Math.floor(Math.random() * 1000),
    });
  }

  const scene = { t: 0, rain, dial: 0, mode: "standby" };
  resetState(scene, 1, 128);
  return scene;
}

export function setPreview(scene, preview) {
  resetState(scene, preview ? preview.min : 1, preview ? preview.max : 128);
  scene.mode = "standby";
}

function burst(scene, x, y, color, count, power) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (40 + Math.random() * 240) * power;

    scene.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 0.6 + Math.random() * 0.9,
      size: 3 + Math.floor(Math.random() * 3) * 2,
      color: Math.random() < 0.35 ? "#d1fae5" : color,
    });
  }
}

function failLabel(turn) {
  switch (turn.status) {
    case "lockdown":
      return "!! LOCKDOWN !!";
    case "limit":
      return "NO ATTEMPTS LEFT";
    case "idle":
      return "NO INPUT";
    case "invalid":
      return "INVALID INPUT";
    default:
      return "SYSTEM ERROR";
  }
}

function pushFailure(steps, turn) {
  steps.push({
    dur: 0.9,
    start: (scene) => {
      scene.door = "lockdown";
      scene.flash = 1;
      scene.shake = 1;
      scene.response = { text: failLabel(turn), color: COLORS.red };
    },
  });
  steps.push({ dur: 1.1 });
  steps.push({
    dur: 0,
    start: (scene) => scene.events.push({ type: "finish", passed: false }),
  });
}

function pushSuccess(steps, turn) {
  steps.push({
    dur: 0.6,
    start: (scene) => {
      scene.response = { text: "ACCESS GRANTED", color: COLORS.green };
      scene.viewLowTarget = turn.guess;
      scene.viewHighTarget = turn.guess;
      scene.secretText = String(turn.guess);
      scene.events.push({ type: "resolved", index: turn.index, alarm: turn.alarmAfter });
      burst(scene, DOOR.x, DOOR.y, COLORS.green, 36, 1);
    },
  });

  steps.push({
    dur: 0.5,
    start: (scene) => {
      scene.door = "opening";
    },
    tick: (scene, p) => {
      scene.bars = 1 - easeOut(p);
    },
  });

  steps.push({
    dur: 1.3,
    tick: (scene, p) => {
      scene.doorOpen = easeInOut(p);
    },
    end: (scene) => {
      burst(scene, DOOR.x, DOOR.y, COLORS.green, 80, 1.5);
    },
  });

  steps.push({ dur: 1.0 });
  steps.push({
    dur: 0,
    start: (scene) => scene.events.push({ type: "finish", passed: true }),
  });
}

function buildSteps(turns) {
  const steps = [];

  for (let i = 0; i < turns.length; i += 1) {
    const turn = turns[i];
    const shown = turn.output.length > 14 ? `${turn.output.slice(0, 13)}…` : turn.output;

    steps.push({
      dur: 0.7,
      start: (scene) => {
        scene.events.push({ type: "attempt", index: i });
        scene.low = turn.low;
        scene.high = turn.high;
        scene.viewLowTarget = turn.low;
        scene.viewHighTarget = turn.high;
        scene.guessText = "";
        scene.typed = 0;
        scene.response = null;
        scene.marker = null;
      },
    });

    steps.push({
      dur: Math.max(0.5, shown.length * 0.13),
      start: (scene) => {
        scene.guessText = shown;
        scene.typed = 0;
      },
      tick: (scene, p) => {
        scene.typed = Math.round(shown.length * p);
      },
      end: (scene) => {
        scene.typed = shown.length;
      },
    });

    if (!turn.hint) {
      pushFailure(steps, turn);
      return steps;
    }

    steps.push({
      dur: 0.5,
      start: (scene) => {
        scene.dialSpeed = DIAL_FAST;
        scene.marker = {
          value: turn.guess,
          outside: turn.guess < scene.min || turn.guess > scene.max,
          alpha: 0,
        };
      },
      tick: (scene, p) => {
        if (scene.marker) scene.marker.alpha = p;
      },
      end: (scene) => {
        scene.dialSpeed = DIAL_IDLE;
      },
    });

    if (turn.status === "cracked") {
      pushSuccess(steps, turn);
      return steps;
    }

    steps.push({
      dur: 1.0,
      start: (scene) => {
        const higher = turn.hint === "HIGHER";
        scene.response = {
          text: higher ? "▲ PASSWORD IS HIGHER" : "▼ PASSWORD IS LOWER",
          color: higher ? COLORS.cyan : COLORS.amber,
        };
        scene.viewLowTarget = turn.newLow;
        scene.viewHighTarget = turn.newHigh;
        scene.alarmTarget = turn.alarmAfter;

        const fx = ALARM.x + ALARM.w - 110;
        const fy = ALARM.y + 34;
        scene.floaters.push({ text: `+${turn.alarmUp}`, color: COLORS.red, x: fx - 52, y: fy, life: 0, dur: 1.3 });
        if (turn.relief > 0) {
          scene.floaters.push({ text: `-${turn.relief}`, color: COLORS.green, x: fx, y: fy, life: 0, dur: 1.3 });
        }

        scene.events.push({ type: "resolved", index: i, alarm: turn.alarmAfter });
      },
    });

    if (turn.status === "continue") {
      steps.push({ dur: 0.3 });
    } else {
      pushFailure(steps, turn);
      return steps;
    }
  }

  return steps;
}

export function startScript(scene, turns, preview) {
  resetState(scene, preview ? preview.min : 1, preview ? preview.max : 128);
  scene.mode = "playing";
  scene.steps = buildSteps(turns);
}

export function updateScene(scene, dt) {
  scene.t += dt;
  scene.dial += scene.dialSpeed * dt;

  scene.rain.forEach((column) => {
    column.y += column.speed * dt;
    if (column.y - column.len * 14 > HEIGHT) {
      column.y = -10;
      column.seed = Math.floor(Math.random() * 1000);
    }
  });

  const follow = 1 - Math.exp(-dt * 9);
  scene.viewLow += (scene.viewLowTarget - scene.viewLow) * follow;
  scene.viewHigh += (scene.viewHighTarget - scene.viewHigh) * follow;

  const alarmFollow = 1 - Math.exp(-dt * 5);
  scene.alarm += (scene.alarmTarget - scene.alarm) * alarmFollow;
  if (Math.abs(scene.alarmTarget - scene.alarm) < 0.05) scene.alarm = scene.alarmTarget;

  scene.particles = scene.particles.filter((particle) => {
    particle.life += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vy += 160 * dt;
    const drag = Math.max(0, 1 - 1.8 * dt);
    particle.vx *= drag;
    particle.vy *= drag;
    return particle.life < particle.max;
  });

  scene.floaters = scene.floaters.filter((floater) => {
    floater.life += dt;
    return floater.life < floater.dur;
  });

  scene.flash = Math.max(0, scene.flash - dt * 0.5);
  scene.shake = Math.max(0, scene.shake - dt * 1.6);

  if (scene.mode !== "playing") return;

  let remaining = dt;

  while (scene.stepIndex < scene.steps.length && remaining >= 0) {
    const step = scene.steps[scene.stepIndex];

    if (!step.started) {
      step.started = true;
      if (step.start) step.start(scene);
    }

    const left = step.dur - scene.stepTime;
    const used = Math.min(left, remaining);
    scene.stepTime += used;
    remaining -= used;

    const p = step.dur === 0 ? 1 : clamp(scene.stepTime / step.dur);
    if (step.tick) step.tick(scene, p);

    if (scene.stepTime >= step.dur - 1e-9) {
      if (step.end) step.end(scene);
      scene.stepIndex += 1;
      scene.stepTime = 0;
    } else {
      break;
    }
  }

  if (scene.stepIndex >= scene.steps.length) scene.mode = "done";
}

/* ------------------------------------------------------------------ */
/* Drawing                                                             */
/* ------------------------------------------------------------------ */

function circle(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
}

function drawBackground(ctx, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#0a1024");
  sky.addColorStop(1, "#050810");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  [
    { x: DOOR.x, y: DOOR.y, r: 280, color: "34, 211, 238", a: 0.14 },
    { x: 620, y: 110, r: 240, color: "168, 85, 247", a: 0.12 },
    { x: 650, y: 400, r: 200, color: "249, 115, 22", a: 0.08 },
  ].forEach((glow) => {
    const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.r);
    gradient.addColorStop(0, `rgba(${glow.color}, ${glow.a})`);
    gradient.addColorStop(1, `rgba(${glow.color}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  });

  ctx.font = `11px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const tick = Math.floor(scene.t * 2.5);
  scene.rain.forEach((column) => {
    for (let k = 0; k < column.len; k += 1) {
      const y = column.y - k * 14;
      if (y < -10 || y > HEIGHT + 10) continue;

      ctx.globalAlpha = (k === 0 ? 0.55 : 0.22) * (1 - k / column.len);
      ctx.fillStyle = k === 0 ? "#a5f3fc" : COLORS.cyan;
      ctx.fillText(HEX[(column.seed + k * 5 + tick) % 16], column.x, y);
    }
  });
  ctx.globalAlpha = 1;
}

function drawPanel(ctx, panel, title, accent, rightText, rightColor) {
  ctx.fillStyle = "rgba(7, 11, 26, 0.9)";
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);

  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(panel.x + 0.75, panel.y + 0.75, panel.w - 1.5, panel.h - 1.5);
  ctx.globalAlpha = 1;

  ctx.fillStyle = accent;
  ctx.fillRect(panel.x, panel.y, 4, 16);

  ctx.font = `bold 11px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(title, panel.x + 14, panel.y + 9);

  if (rightText) {
    ctx.textAlign = "right";
    ctx.fillStyle = rightColor || accent;
    ctx.fillText(rightText, panel.x + panel.w - 14, panel.y + 9);
    ctx.textAlign = "left";
  }
}

function drawKeyValue(ctx, x, y, key, value, color) {
  ctx.font = `bold 17px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  const label = `${key.padEnd(4)} = `;
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(label, x, y);

  ctx.fillStyle = color;
  ctx.fillText(Number(value).toLocaleString("en-US"), x + ctx.measureText(label).width, y);
}

function drawTerminal(ctx, scene) {
  const p = TERMINAL;
  drawPanel(ctx, p, "VAULT TERMINAL", COLORS.cyan, "CONNECTED", COLORS.green);

  const x = p.x + 18;

  drawKeyValue(ctx, x, p.y + 50, "LOW", scene.low, COLORS.cyan);
  drawKeyValue(ctx, x, p.y + 78, "HIGH", scene.high, COLORS.cyan);

  ctx.font = `bold 17px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const label = "Enter your MID: ";
  ctx.fillStyle = COLORS.text;
  ctx.fillText(label, x, p.y + 116);

  const labelWidth = ctx.measureText(label).width;
  const typed = scene.guessText.slice(0, scene.typed);
  ctx.fillStyle = COLORS.amber;
  ctx.fillText(typed, x + labelWidth, p.y + 116);

  if (Math.floor(scene.t * 2) % 2 === 0) {
    ctx.fillRect(x + labelWidth + ctx.measureText(typed).width + 2, p.y + 107, 9, 18);
  }

  ctx.font = `bold 15px ${MONO}`;
  if (scene.response) {
    ctx.fillStyle = scene.response.color;
    ctx.fillText(scene.response.text, x, p.y + 148);
  } else {
    ctx.fillStyle = COLORS.dim;
    ctx.fillText(scene.mode === "standby" ? "AWAITING PROGRAM..." : "...", x, p.y + 148);
  }
}

function drawRange(ctx, scene) {
  const p = RANGE;
  const total = scene.max - scene.min + 1;
  const left = Math.max(1, Math.round(scene.viewHighTarget - scene.viewLowTarget + 1));

  drawPanel(ctx, p, "SEARCH RANGE", COLORS.cyan, `${left.toLocaleString("en-US")} LEFT`, COLORS.amber);

  const bx = p.x + 18;
  const bw = p.w - 36;
  const by = p.y + 52;
  const bh = 24;
  const xOf = (value) => bx + ((value - scene.min) / total) * bw;

  ctx.fillStyle = "#0b1226";
  ctx.fillRect(bx, by, bw, bh);

  ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
  for (let i = 0; i < bw; i += 6) {
    ctx.fillRect(bx + i, by, 3, bh);
  }

  const x1 = clamp(xOf(scene.viewLow), bx, bx + bw);
  const x2 = clamp(xOf(scene.viewHigh + 1), bx, bx + bw);
  const width = Math.max(3, x2 - x1);
  const wx = Math.min(x1, bx + bw - width);

  ctx.fillStyle = "rgba(34, 211, 238, 0.55)";
  ctx.fillRect(wx, by, width, bh);
  ctx.fillStyle = COLORS.cyan;
  ctx.fillRect(wx, by, width, 3);

  ctx.strokeStyle = "rgba(34, 211, 238, 0.5)";
  ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);

  ctx.font = `10px ${MONO}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.dim;
  ctx.textAlign = "left";
  ctx.fillText(scene.min.toLocaleString("en-US"), bx, by + bh + 14);
  ctx.textAlign = "right";
  ctx.fillText(scene.max.toLocaleString("en-US"), bx + bw, by + bh + 14);
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(34, 211, 238, 0.7)";
  ctx.fillText("search window", bx + bw / 2, by + bh + 14);

  if (scene.marker) {
    const marker = scene.marker;
    const mx = clamp(xOf(marker.value + 0.5), bx, bx + bw);
    const color = marker.outside ? COLORS.red : COLORS.amber;

    ctx.globalAlpha = clamp(marker.alpha);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(mx - 6, by - 10);
    ctx.lineTo(mx + 6, by - 10);
    ctx.lineTo(mx, by - 1);
    ctx.closePath();
    ctx.fill();

    ctx.fillRect(mx - 1, by, 2, bh);

    ctx.font = `bold 12px ${MONO}`;
    ctx.textAlign = "center";
    ctx.fillText(marker.value.toLocaleString("en-US"), clamp(mx, bx + 30, bx + bw - 30), by - 20);
    ctx.globalAlpha = 1;
  }

  ctx.textAlign = "left";
}

function drawAlarm(ctx, scene) {
  const p = ALARM;
  const level = scene.alarm;
  const danger = level >= 70;
  const accent = level >= 70 ? COLORS.red : level >= 40 ? COLORS.amber : COLORS.green;

  drawPanel(ctx, p, "SECURITY ALARM", accent, `${Math.round(level)}%`, accent);

  if (danger) {
    ctx.strokeStyle = COLORS.red;
    ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(scene.t * 10));
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x + 1.5, p.y + 1.5, p.w - 3, p.h - 3);
    ctx.globalAlpha = 1;
  }

  const segments = 25;
  const bx = p.x + 18;
  const bw = p.w - 36;
  const by = p.y + 36;
  const bh = 26;
  const segW = bw / segments;

  for (let i = 0; i < segments; i += 1) {
    const fill = clamp((level / 100) * segments - i);
    const color = i < 10 ? COLORS.green : i < 17 ? COLORS.amber : COLORS.red;

    ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
    ctx.fillRect(bx + i * segW, by, segW - 2, bh);

    if (fill > 0) {
      ctx.globalAlpha = 0.35 + 0.65 * fill;
      ctx.fillStyle = color;
      ctx.fillRect(bx + i * segW, by, segW - 2, bh);
      ctx.globalAlpha = 1;
    }
  }

  ctx.font = `10px ${MONO}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.dim;
  ctx.fillText("wrong guess = alarm up   big elimination = alarm down", bx, p.y + p.h - 14);
}

function drawFloaters(ctx, scene) {
  ctx.font = `bold 15px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  scene.floaters.forEach((floater) => {
    const k = floater.life / floater.dur;
    ctx.globalAlpha = clamp(1 - k * k);
    ctx.fillStyle = floater.color;
    ctx.fillText(floater.text, floater.x, floater.y - k * 22);
  });

  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawDoor(ctx, scene) {
  const { x: cx, y: cy, r: R } = DOOR;
  const accent = scene.door === "lockdown" ? COLORS.red : scene.door === "locked" ? COLORS.cyan : COLORS.green;

  ctx.fillStyle = "#141b36";
  circle(ctx, cx, cy, R + 16);
  ctx.fill();
  ctx.strokeStyle = "#2c3a66";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#04060e";
  circle(ctx, cx, cy, R + 2);
  ctx.fill();

  if (scene.doorOpen > 0) {
    ctx.save();
    circle(ctx, cx, cy, R);
    ctx.clip();

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    glow.addColorStop(0, "rgba(52, 211, 153, 0.75)");
    glow.addColorStop(1, "rgba(16, 185, 129, 0.12)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    ctx.fillStyle = "rgba(209, 250, 229, 0.55)";
    for (let row = 0; row < 11; row += 1) {
      const y = cy - R + 24 + row * 25;
      for (let col = 0; col < 8; col += 1) {
        const w = 8 + ((row * 7 + col * 13) % 5) * 5;
        ctx.fillRect(cx - R + 30 + col * 34, y, w, 8);
      }
    }
    ctx.restore();
  }

  const hingeX = cx - R;
  const sx = 1 - 0.88 * scene.doorOpen;

  ctx.save();
  ctx.translate(hingeX, 0);
  ctx.scale(sx, 1);
  ctx.translate(-hingeX, 0);

  ctx.fillStyle = "#3a4466";
  circle(ctx, cx, cy, R);
  ctx.fill();
  ctx.strokeStyle = "#5a6a99";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#2d3556";
  circle(ctx, cx, cy, R - 30);
  ctx.fill();
  ctx.strokeStyle = "#4a5784";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.setLineDash([3, 8]);
  ctx.strokeStyle = "rgba(148, 163, 184, 0.45)";
  circle(ctx, cx, cy, R - 52);
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2 + Math.PI / 12;
    const rx = cx + Math.cos(angle) * (R - 15);
    const ry = cy + Math.sin(angle) * (R - 15);
    ctx.fillStyle = "#1c2441";
    circle(ctx, rx, ry, 5.5);
    ctx.fill();
    ctx.fillStyle = "#7683ad";
    circle(ctx, rx - 1.2, ry - 1.2, 2);
    ctx.fill();
  }

  [Math.PI, 0, -Math.PI / 2].forEach((angle) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const dist = lerp(R - 62, R - 6, scene.bars);
    ctx.fillStyle = "#8d99c4";
    ctx.fillRect(dist - 22, -12, 44, 24);
    ctx.fillStyle = "#5b6794";
    ctx.fillRect(dist - 22, -12, 44, 6);
    ctx.fillStyle = accent;
    ctx.fillRect(dist + 8, -4, 8, 8);
    ctx.restore();
  });

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(scene.dial);
  for (let k = 0; k < 3; k += 1) {
    ctx.save();
    ctx.rotate((k * Math.PI * 2) / 3);
    ctx.strokeStyle = "#9aa6cf";
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -66);
    ctx.stroke();
    ctx.fillStyle = "#c7d0f0";
    circle(ctx, 0, -66, 11);
    ctx.fill();
    ctx.fillStyle = accent;
    circle(ctx, 0, -66, 4);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  ctx.lineCap = "butt";

  ctx.fillStyle = "#0b1020";
  circle(ctx, cx, cy, 30);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();

  const unlocked = scene.door === "opening" || scene.doorOpen > 0;
  ctx.fillStyle = accent;
  ctx.fillRect(cx - 10, cy - 1, 20, 14);
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (unlocked) {
    ctx.arc(cx + 7, cy - 1, 7, Math.PI, Math.PI * 2);
    ctx.moveTo(cx + 14, cy - 1);
    ctx.lineTo(cx + 14, cy - 6);
  } else {
    ctx.arc(cx, cy - 1, 7, Math.PI, Math.PI * 2);
  }
  ctx.strokeStyle = accent;
  ctx.stroke();

  if (scene.door === "lockdown") {
    const pulse = 0.5 + 0.5 * Math.sin(scene.t * 14);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + 0.16 * pulse})`;
    circle(ctx, cx, cy, R);
    ctx.fill();
  }

  if (scene.doorOpen > 0) {
    ctx.fillStyle = `rgba(0, 0, 0, ${0.4 * scene.doorOpen})`;
    circle(ctx, cx, cy, R);
    ctx.fill();
  }

  ctx.restore();

  ctx.fillStyle = "rgba(7, 11, 26, 0.92)";
  ctx.fillRect(cx - 104, 400, 208, 28);
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cx - 103.25, 400.75, 206.5, 26.5);
  ctx.globalAlpha = 1;

  ctx.font = `bold 14px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = scene.secretText === "???" ? COLORS.dim : COLORS.green;
  ctx.fillText(`PASSWORD  ${scene.secretText}`, cx, 415);
  ctx.textAlign = "left";
}

function drawParticles(ctx, scene) {
  scene.particles.forEach((particle) => {
    ctx.globalAlpha = clamp(1 - particle.life / particle.max);
    ctx.fillStyle = particle.color;
    ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
  });
  ctx.globalAlpha = 1;
}

function drawFlash(ctx, scene) {
  if (scene.flash <= 0) return;

  const pulse = 0.5 + 0.5 * Math.sin(scene.t * 18);
  ctx.fillStyle = `rgba(239, 68, 68, ${0.22 * scene.flash * pulse})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawScanlines(ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  for (let y = 0; y < HEIGHT; y += 4) {
    ctx.fillRect(0, y, WIDTH, 1);
  }
}

export function drawScene(ctx, scene) {
  ctx.save();

  drawBackground(ctx, scene);

  if (scene.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 12 * scene.shake, (Math.random() - 0.5) * 12 * scene.shake);
  }

  drawDoor(ctx, scene);
  drawTerminal(ctx, scene);
  drawRange(ctx, scene);
  drawAlarm(ctx, scene);
  drawFloaters(ctx, scene);
  drawParticles(ctx, scene);

  ctx.restore();

  drawFlash(ctx, scene);
  drawScanlines(ctx);
}