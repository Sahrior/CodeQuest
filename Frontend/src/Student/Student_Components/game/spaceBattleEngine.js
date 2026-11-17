export const WIDTH = 800;
export const HEIGHT = 450;

const PLAYER_X = 110;
const PLAYER_Y = 225;
const LANE_Y = [120, 330];
const ENEMY_COLORS = ["#f43f5e", "#a855f7"];
const ENEMY_BASE_X = 190;
const ENEMY_SCALE = 4.4;

export const distanceToX = (distance) => ENEMY_BASE_X + distance * ENEMY_SCALE;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;

function makeEnemy(lane) {
  return {
    lane,
    x: WIDTH + 90,
    y: LANE_Y[lane],
    startX: WIDTH + 90,
    startY: LANE_Y[lane],
    targetX: WIDTH + 90,
    dist: 0,
    alive: false,
    visible: false,
    alpha: 1,
  };
}

export function createScene() {
  const stars = [];
  for (let i = 0; i < 90; i += 1) {
    stars.push({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
      z: 0.25 + Math.random() * 0.9,
    });
  }

  return {
    t: 0,
    stars,
    player: { x: PLAYER_X, y: PLAYER_Y, alive: true, recoil: 0 },
    enemies: [makeEnemy(0), makeEnemy(1)],
    beam: null,
    aim: null,
    particles: [],
    rings: [],
    shake: 0,
    alert: 0,
    outputText: "",
    showDistances: false,
    mode: "standby",
    steps: [],
    stepIndex: 0,
    stepTime: 0,
    events: [],
  };
}

function resetActors(scene) {
  scene.player.alive = true;
  scene.player.recoil = 0;
  scene.beam = null;
  scene.aim = null;
  scene.particles = [];
  scene.rings = [];
  scene.shake = 0;
  scene.alert = 0;
  scene.outputText = "";
  scene.showDistances = false;
  scene.steps = [];
  scene.stepIndex = 0;
  scene.stepTime = 0;
  scene.events = [];
  scene.enemies = [makeEnemy(0), makeEnemy(1)];
}

export function setPreview(scene, preview) {
  resetActors(scene);
  scene.mode = "standby";

  if (!preview) return;

  [preview.d1, preview.d2].forEach((distance, lane) => {
    const enemy = scene.enemies[lane];
    enemy.dist = distance;
    enemy.x = distanceToX(distance);
    enemy.visible = true;
    enemy.alive = true;
  });

  scene.showDistances = true;
}

function explode(scene, x, y, color, count, power) {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (40 + Math.random() * 260) * power;

    scene.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      max: 0.5 + Math.random() * 0.7,
      size: 2 + Math.random() * 4 * power,
      color: Math.random() < 0.4 ? "#fde68a" : color,
    });
  }

  scene.rings.push({ x, y, max: 70 * power, life: 0, dur: 0.5 });
}

function outputLabel(turn) {
  if (turn.outcome === "error") return "> error";
  return turn.output ? `> ${turn.output}` : "> (nothing)";
}

function ramSteps(closestIndex) {
  return [
    {
      dur: 0.35,
      start: (scene) => {
        scene.aim = null;
        scene.alert = 1;
      },
    },
    {
      dur: 0.75,
      start: (scene) => {
        const enemy = scene.enemies[closestIndex];
        enemy.startX = enemy.x;
        enemy.startY = enemy.y;
      },
      tick: (scene, p) => {
        const enemy = scene.enemies[closestIndex];
        const k = easeIn(p);
        enemy.x = lerp(enemy.startX, scene.player.x + 30, k);
        enemy.y = lerp(enemy.startY, scene.player.y, k);
      },
      end: (scene) => {
        const enemy = scene.enemies[closestIndex];
        enemy.alive = false;
        enemy.visible = false;
        scene.player.alive = false;
        explode(scene, scene.player.x, scene.player.y, "#fb923c", 90, 1.5);
        explode(scene, scene.player.x + 20, scene.player.y, ENEMY_COLORS[closestIndex], 40, 1);
        scene.shake = 1;
      },
    },
    { dur: 1.1 },
    {
      dur: 0,
      start: (scene) => scene.events.push({ type: "finish", passed: false }),
    },
  ];
}

function aimStep(targetIndex) {
  return {
    dur: 0.4,
    start: (scene) => {
      scene.aim = { index: targetIndex, alpha: 0 };
    },
    tick: (scene, p) => {
      if (scene.aim) scene.aim.alpha = p;
    },
  };
}

function fireStep(targetIndex) {
  return {
    dur: 0.28,
    start: (scene) => {
      const enemy = scene.enemies[targetIndex];
      scene.player.recoil = 1;
      scene.beam = {
        x1: scene.player.x + 36,
        y1: scene.player.y,
        x2: enemy.x,
        y2: enemy.y,
        progress: 0,
      };
    },
    tick: (scene, p) => {
      if (scene.beam) scene.beam.progress = p;
    },
    end: (scene) => {
      const enemy = scene.enemies[targetIndex];
      scene.beam = null;
      scene.aim = null;
      enemy.alive = false;
      enemy.visible = false;
      explode(scene, enemy.x, enemy.y, ENEMY_COLORS[targetIndex], 46, 1);
      scene.shake = Math.max(scene.shake, 0.4);
    },
  };
}

function missStep() {
  return {
    dur: 0.45,
    start: (scene) => {
      scene.player.recoil = 1;
      scene.beam = {
        x1: scene.player.x + 36,
        y1: scene.player.y,
        x2: WIDTH + 20,
        y2: scene.player.y,
        progress: 0,
      };
    },
    tick: (scene, p) => {
      if (scene.beam) scene.beam.progress = p;
    },
    end: (scene) => {
      scene.beam = null;
    },
  };
}

function buildSteps(turns) {
  const steps = [];
  let failed = false;

  for (let i = 0; i < turns.length && !failed; i += 1) {
    const turn = turns[i];
    const targets = [distanceToX(turn.d1), distanceToX(turn.d2)];
    const distances = [turn.d1, turn.d2];
    const closestIndex = turn.closest - 1;
    const shotIndex = turn.shot ? turn.shot - 1 : null;

    steps.push({
      dur: 0.9,
      start: (scene) => {
        scene.events.push({ type: "wave", index: i });
        scene.beam = null;
        scene.aim = null;
        scene.outputText = "";
        scene.showDistances = false;

        scene.enemies.forEach((enemy, lane) => {
          enemy.dist = distances[lane];
          enemy.x = WIDTH + 90;
          enemy.y = LANE_Y[lane];
          enemy.startX = enemy.x;
          enemy.targetX = targets[lane];
          enemy.alive = true;
          enemy.visible = true;
          enemy.alpha = 1;
        });
      },
      tick: (scene, p) => {
        const k = easeOut(p);
        scene.enemies.forEach((enemy) => {
          enemy.x = lerp(enemy.startX, enemy.targetX, k);
        });
      },
      end: (scene) => {
        scene.showDistances = true;
      },
    });

    steps.push({
      dur: 0.55,
      start: (scene) => {
        scene.outputText = outputLabel(turn);
      },
    });

    if (turn.outcome === "clear" || turn.outcome === "wrong") {
      steps.push(aimStep(shotIndex));
      steps.push(fireStep(shotIndex));
    } else if (turn.outcome === "miss") {
      steps.push(missStep());
    } else {
      steps.push({ dur: 0.45 });
    }

    if (turn.outcome === "clear") {
      const otherIndex = 1 - shotIndex;

      steps.push({
        dur: 0.8,
        start: (scene) => {
          scene.enemies[otherIndex].startX = scene.enemies[otherIndex].x;
        },
        tick: (scene, p) => {
          const enemy = scene.enemies[otherIndex];
          enemy.x = lerp(enemy.startX, WIDTH + 120, easeIn(p));
          enemy.alpha = 1 - p;
        },
        end: (scene) => {
          scene.enemies[otherIndex].visible = false;
          scene.enemies[otherIndex].alive = false;
          scene.events.push({ type: "cleared", index: i });
        },
      });
    } else {
      ramSteps(closestIndex).forEach((step) => steps.push(step));
      failed = true;
    }
  }

  if (!failed) {
    steps.push({ dur: 0.9 });
    steps.push({
      dur: 0,
      start: (scene) => scene.events.push({ type: "finish", passed: true }),
    });
  }

  return steps;
}

export function startScript(scene, turns) {
  resetActors(scene);
  scene.mode = "playing";
  scene.steps = buildSteps(turns);
}

export function updateScene(scene, dt) {
  scene.t += dt;

  scene.stars.forEach((star) => {
    star.x -= 14 * star.z * dt;
    if (star.x < -2) {
      star.x = WIDTH + 2;
      star.y = Math.random() * HEIGHT;
    }
  });

  scene.particles = scene.particles.filter((particle) => {
    particle.life += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    const drag = Math.max(0, 1 - 2.2 * dt);
    particle.vx *= drag;
    particle.vy *= drag;
    return particle.life < particle.max;
  });

  scene.rings = scene.rings.filter((ring) => {
    ring.life += dt;
    return ring.life < ring.dur;
  });

  scene.shake = Math.max(0, scene.shake - dt * 1.6);
  scene.alert = Math.max(0, scene.alert - dt * 0.9);
  scene.player.recoil = Math.max(0, scene.player.recoil - dt * 5);

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

function drawBackground(ctx, scene) {
  const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  sky.addColorStop(0, "#0a1024");
  sky.addColorStop(1, "#060913");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  [
    { x: 520, y: 150, r: 190, a: 0.16 },
    { x: 330, y: 340, r: 170, a: 0.12 },
    { x: 700, y: 360, r: 150, a: 0.1 },
  ].forEach((glow) => {
    const gradient = ctx.createRadialGradient(glow.x, glow.y, 0, glow.x, glow.y, glow.r);
    gradient.addColorStop(0, `rgba(249, 115, 22, ${glow.a})`);
    gradient.addColorStop(1, "rgba(249, 115, 22, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  });

  scene.stars.forEach((star) => {
    ctx.globalAlpha = 0.25 + star.z * 0.5;
    ctx.fillStyle = "#fed7aa";
    ctx.fillRect(star.x, star.y, star.z > 0.8 ? 2 : 1, star.z > 0.8 ? 2 : 1);
  });
  ctx.globalAlpha = 1;
}

function drawArena(ctx) {
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(251, 146, 60, 0.22)";
  ctx.beginPath();
  ctx.ellipse(WIDTH / 2 + 40, HEIGHT / 2, 360, 190, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([4, 8]);
  ctx.strokeStyle = "rgba(251, 146, 60, 0.12)";
  ctx.beginPath();
  ctx.ellipse(WIDTH / 2 + 40, HEIGHT / 2, 250, 130, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlayer(ctx, scene) {
  const player = scene.player;
  if (!player.alive) return;

  const x = player.x - player.recoil * 8;
  const y = player.y + Math.sin(scene.t * 2) * 3;

  const flame = 14 + Math.sin(scene.t * 30) * 4;
  ctx.fillStyle = "#fb923c";
  ctx.beginPath();
  ctx.moveTo(x - 16, y - 6);
  ctx.lineTo(x - 16 - flame, y);
  ctx.lineTo(x - 16, y + 6);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = "#f97316";
  ctx.shadowBlur = 18;
  ctx.fillStyle = "#fed7aa";
  ctx.strokeStyle = "#f97316";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 38, y);
  ctx.lineTo(x - 6, y - 24);
  ctx.lineTo(x - 22, y - 12);
  ctx.lineTo(x - 14, y);
  ctx.lineTo(x - 22, y + 12);
  ctx.lineTo(x - 6, y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#38bdf8";
  ctx.beginPath();
  ctx.ellipse(x + 8, y, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawEnemy(ctx, scene, enemy) {
  if (!enemy.visible) return;

  const color = ENEMY_COLORS[enemy.lane];
  const x = enemy.x;
  const y = enemy.y + Math.sin(scene.t * 2 + enemy.lane * 2) * 4;

  ctx.globalAlpha = clamp(enemy.alpha);
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  ctx.strokeStyle = "#fff7ed";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 34, y);
  ctx.lineTo(x + 4, y - 22);
  ctx.lineTo(x + 26, y - 9);
  ctx.lineTo(x + 16, y);
  ctx.lineTo(x + 26, y + 9);
  ctx.lineTo(x + 4, y + 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "#fff7ed";
  ctx.beginPath();
  ctx.arc(x - 10, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawLabel(ctx, text, x, y, color) {
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(7, 11, 23, 0.85)";
  ctx.fillRect(x - 42, y - 12, 84, 24);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 42, y - 12, 84, 24);
  ctx.fillStyle = "#ffedd5";
  ctx.fillText(text, x, y + 1);
}

function drawDistances(ctx, scene) {
  if (!scene.showDistances) return;

  scene.enemies.forEach((enemy, lane) => {
    if (!enemy.visible || !enemy.alive) return;

    const y = enemy.y + Math.sin(scene.t * 2 + lane * 2) * 4;

    ctx.setLineDash([5, 7]);
    ctx.strokeStyle = "rgba(253, 186, 116, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(scene.player.x + 40, scene.player.y);
    ctx.lineTo(enemy.x - 36, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelY = lane === 0 ? y - 44 : y + 44;
    drawLabel(ctx, `d${lane + 1} = ${enemy.dist}`, enemy.x, labelY, ENEMY_COLORS[lane]);
  });
}

function drawAim(ctx, scene) {
  if (!scene.aim) return;

  const enemy = scene.enemies[scene.aim.index];
  if (!enemy.visible) return;

  const y = enemy.y + Math.sin(scene.t * 2 + enemy.lane * 2) * 4;
  ctx.globalAlpha = clamp(scene.aim.alpha);
  ctx.strokeStyle = "#fde68a";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(enemy.x - 4, y, 34, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(enemy.x - 4 - 44, y);
  ctx.lineTo(enemy.x - 4 - 24, y);
  ctx.moveTo(enemy.x - 4 + 24, y);
  ctx.lineTo(enemy.x - 4 + 44, y);
  ctx.moveTo(enemy.x - 4, y - 44);
  ctx.lineTo(enemy.x - 4, y - 24);
  ctx.moveTo(enemy.x - 4, y + 24);
  ctx.lineTo(enemy.x - 4, y + 44);
  ctx.stroke();

  ctx.globalAlpha = 1;
}

function drawBeam(ctx, scene) {
  const beam = scene.beam;
  if (!beam) return;

  const endX = lerp(beam.x1, beam.x2, easeOut(beam.progress));
  const endY = lerp(beam.y1, beam.y2, easeOut(beam.progress));

  ctx.shadowColor = "#fb923c";
  ctx.shadowBlur = 20;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = "#fff7ed";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(beam.x1, beam.y1);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.lineCap = "butt";
}

function drawEffects(ctx, scene) {
  scene.rings.forEach((ring) => {
    const k = ring.life / ring.dur;
    ctx.globalAlpha = clamp(1 - k);
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, 6 + ring.max * easeOut(k), 0, Math.PI * 2);
    ctx.stroke();
  });

  scene.particles.forEach((particle) => {
    ctx.globalAlpha = clamp(1 - particle.life / particle.max);
    ctx.fillStyle = particle.color;
    ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
  });

  ctx.globalAlpha = 1;
}

function drawOutput(ctx, scene) {
  if (!scene.outputText || !scene.player.alive) return;

  ctx.font = "bold 14px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(7, 11, 23, 0.88)";
  ctx.fillRect(scene.player.x - 44, scene.player.y - 74, 120, 26);
  ctx.strokeStyle = "#fb923c";
  ctx.lineWidth = 1;
  ctx.strokeRect(scene.player.x - 44, scene.player.y - 74, 120, 26);
  ctx.fillStyle = "#fdba74";
  ctx.fillText(scene.outputText, scene.player.x - 36, scene.player.y - 60);
}

function drawAlert(ctx, scene) {
  if (scene.alert <= 0) return;

  const pulse = 0.5 + 0.5 * Math.sin(scene.t * 22);
  ctx.fillStyle = `rgba(239, 68, 68, ${0.18 * scene.alert * pulse})`;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

export function drawScene(ctx, scene) {
  ctx.save();

  drawBackground(ctx, scene);

  if (scene.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 14 * scene.shake, (Math.random() - 0.5) * 14 * scene.shake);
  }

  drawArena(ctx);
  drawDistances(ctx, scene);
  scene.enemies.forEach((enemy) => drawEnemy(ctx, scene, enemy));
  drawAim(ctx, scene);
  drawBeam(ctx, scene);
  drawPlayer(ctx, scene);
  drawEffects(ctx, scene);
  drawOutput(ctx, scene);

  ctx.restore();

  drawAlert(ctx, scene);
}