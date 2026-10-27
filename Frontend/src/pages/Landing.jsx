// Landing.jsx — Code Quest cinematic scroll landing page
// Requires: npm i three gsap   (react-router-dom + Tailwind already in your project)
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONTENT                                                            */
/* ------------------------------------------------------------------ */
const FEATURES = [
  { n: "01", title: "Play & Learn", icon: "🎮", text: "Learn coding while playing games. Every level is a real problem, every boss is a bug.", tag: "levels · XP · streaks" },
  { n: "02", title: "Compete in Contests", icon: "🏆", text: "Weekly contests and live leaderboards. Race other students and climb the ranks.", tag: "weekly · live · ranked" },
  { n: "03", title: "Apply for Jobs", icon: "💼", text: "Companies post real roles here. Your quest profile is your resume — apply in one click.", tag: "internships · full-time" },
  { n: "04", title: "Mock Interviews", icon: "🎤", text: "Practice technical interviews with timed rounds and honest, detailed feedback.", tag: "DSA · system design" },
  { n: "05", title: "Build Community", icon: "🤝", text: "Find study buddies, join squads, share solutions and grow together.", tag: "squads · forums · mentors" },
];

const REVIEWS = [
  { name: "Ayesha R.", text: "The daily challenges made me consistent. First internship in 3 months!", color: "#ffe680" },
  { name: "Tanvir H.", text: "The AI tutor explains my mistakes without giving away the answer.", color: "#ffb3c7" },
  { name: "Nusrat J.", text: "Competing on the weekly board is addictive in the best way.", color: "#a8e6ff" },
  { name: "Rafi K.", text: "Companies post real roles here. Applying takes one click.", color: "#b8f2a6" },
  { name: "Mehedi S.", text: "Mock interviews killed my nerves. Got the offer!", color: "#ffd1a1" },
];

const COMPANIES = ["Netflix", "Mindrise", "Walmart", "Rapid Care", "Amazon", "Zapro", "GeeksforGeeks"];

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */
const rand = (a, b) => a + Math.random() * (b - a);

function canvasTexture(w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  t.userData.redraw = () => {
    draw(ctx, w, h);
    t.needsUpdate = true;
  };
  return t;
}

function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, y);
      line = w + " ";
      y += lh;
    } else line = test;
  }
  ctx.fillText(line.trim(), x, y);
  return y;
}

function woodDraw(base, dark) {
  return (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      ctx.strokeStyle = `rgba(${dark},${rand(0.04, 0.18)})`;
      ctx.lineWidth = rand(0.5, 3);
      ctx.beginPath();
      const y = rand(0, h);
      ctx.moveTo(0, y);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * rand(1, 6));
      ctx.stroke();
    }
  };
}

function noiseDraw(base, amt = 14) {
  return (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * amt;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  };
}

// capsule limb between two points
function limb(a, b, r, mat) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(len - r * 2, 0.001), 8, 16), mat);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------ */
/*  COMPONENT                                                          */
/* ------------------------------------------------------------------ */
export default function Landing() {
  const mountRef = useRef(null);
  const scrollRef = useRef(null);
  const overlay = useRef({});

  useEffect(() => {
    // fonts
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap";
    document.head.appendChild(link);

    const mount = mountRef.current;
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    /* ---------------- renderer / scene ---------------- */
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W(), H());
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#050816");
    scene.fog = new THREE.FogExp2("#0a1028", 0.006);

    const camera = new THREE.PerspectiveCamera(45, W() / H(), 0.02, 900);
    const cam = { px: 2.4, py: 1.9, pz: 2.2, tx: -0.1, ty: 1.0, tz: -1.6 };

    const disposables = [];
    const track = (o) => (disposables.push(o), o);

    /* ---------------- materials ---------------- */
    const woodTex = track(canvasTexture(1024, 512, woodDraw("#6b4429", "40,20,8"), { repeat: [1, 1] }));
    const floorTex = track(canvasTexture(1024, 1024, (ctx, w, h) => {
      woodDraw("#5a3a24", "30,15,5")(ctx, w, h);
      ctx.strokeStyle = "rgba(20,10,4,.55)";
      ctx.lineWidth = 3;
      for (let y = 0; y < h; y += 128) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        const off = (y / 128) % 2 ? 300 : 700;
        ctx.beginPath(); ctx.moveTo(off, y); ctx.lineTo(off, y + 128); ctx.stroke();
      }
    }, { repeat: [3, 3] }));
    const wallTex = track(canvasTexture(512, 512, noiseDraw("#3d4a5c", 10), { repeat: [4, 2] }));

    const M = {
      wood: new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.55, metalness: 0.05 }),
      floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }),
      wall: new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.95 }),
      ceiling: new THREE.MeshStandardMaterial({ color: "#2a3140", roughness: 1 }),
      metalDark: new THREE.MeshStandardMaterial({ color: "#2b2d33", roughness: 0.35, metalness: 0.8 }),
      alu: new THREE.MeshStandardMaterial({ color: "#b9bcc4", roughness: 0.28, metalness: 0.9 }),
      black: new THREE.MeshStandardMaterial({ color: "#111214", roughness: 0.6 }),
      fabric: new THREE.MeshStandardMaterial({ color: "#1d2433", roughness: 0.95 }),
      skin: new THREE.MeshStandardMaterial({ color: "#c98d63", roughness: 0.62 }),
      hoodie: new THREE.MeshStandardMaterial({ color: "#d4562a", roughness: 0.9 }),
      jeans: new THREE.MeshStandardMaterial({ color: "#26354f", roughness: 0.85 }),
      hair: new THREE.MeshStandardMaterial({ color: "#14100d", roughness: 0.75 }),
      shoe: new THREE.MeshStandardMaterial({ color: "#f1f1f1", roughness: 0.6 }),
      sole: new THREE.MeshStandardMaterial({ color: "#222", roughness: 0.8 }),
      ceramic: new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.25 }),
      coffee: new THREE.MeshStandardMaterial({ color: "#2b160a", roughness: 0.15 }),
      leather: new THREE.MeshStandardMaterial({ color: "#5c1f1a", roughness: 0.7 }),
      paper: new THREE.MeshStandardMaterial({ color: "#f3ead6", roughness: 0.9 }),
      frame: new THREE.MeshStandardMaterial({ color: "#d9d6cf", roughness: 0.6 }),
      facade: null,
    };

    /* ---------------- sky / stars / moon ---------------- */
    const skyTex = track(canvasTexture(16, 512, (ctx, w, h) => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, "#02030a");
      g.addColorStop(0.45, "#0a1230");
      g.addColorStop(0.62, "#1b2550");
      g.addColorStop(0.75, "#2b2a4a");
      g.addColorStop(1, "#090b14");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }));
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 32),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false })
    );
    scene.add(sky);

    const starGeo = new THREE.BufferGeometry();
    const starPos = [];
    for (let i = 0; i < 2500; i++) {
      const v = new THREE.Vector3().randomDirection();
      if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
      v.multiplyScalar(450);
      starPos.push(v.x, v.y, v.z);
    }
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: "#ffffff", size: 1.4, sizeAttenuation: true, fog: false, transparent: true, opacity: 0.9 })
    );
    scene.add(stars);

    const moonTex = track(canvasTexture(512, 512, (ctx, w, h) => {
      ctx.fillStyle = "#e9e6da";
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) {
        const r = rand(4, 46);
        const x = rand(0, w), y = rand(0, h);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(120,115,105,${rand(0.15, 0.4)})`);
        g.addColorStop(1, "rgba(120,115,105,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      }
    }));
    const MOON_POS = new THREE.Vector3(30, 95, -15);
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(7, 48, 48),
      new THREE.MeshBasicMaterial({ map: moonTex, fog: false })
    );
    moon.position.copy(MOON_POS);
    scene.add(moon);
    const glowTex = track(canvasTexture(256, 256, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, "rgba(220,230,255,0.9)");
      g.addColorStop(0.25, "rgba(160,180,255,0.35)");
      g.addColorStop(1, "rgba(120,140,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    }));
    const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    moonGlow.scale.set(60, 60, 1);
    moonGlow.position.copy(MOON_POS);
    scene.add(moonGlow);

    /* ---------------- lights ---------------- */
    scene.add(new THREE.HemisphereLight("#6f86c9", "#1a1410", 0.35));

    const moonLight = new THREE.DirectionalLight("#9fb4ff", 1.1);
    moonLight.position.set(-18, 22, 6);
    moonLight.target.position.set(0, 0, -0.5);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.set(2048, 2048);
    Object.assign(moonLight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 60 });
    moonLight.shadow.bias = -0.0005;
    scene.add(moonLight, moonLight.target);

    const roomFill = new THREE.PointLight("#ffb27a", 2.2, 9, 2);
    roomFill.position.set(1.5, 2.7, 0.8);
    scene.add(roomFill);

    /* ---------------- ROOM ---------------- */
    // room: x -3..3, y 0..3, z -2.5..3   window on left wall (x=-3) z -1.3..0.3, y 1.0..2.4
    const room = new THREE.Group();
    scene.add(room);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 5.5), M.floor);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0.25);
    floor.receiveShadow = true;
    room.add(floor);

    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(6, 5.5), M.ceiling);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(0, 3, 0.25);
    room.add(ceil);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), M.wall);
    back.position.set(0, 1.5, -2.5);
    back.receiveShadow = true;
    room.add(back);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 3), M.wall);
    right.rotation.y = -Math.PI / 2;
    right.position.set(3, 1.5, 0.25);
    right.receiveShadow = true;
    room.add(right);

    const front = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), M.wall);
    front.rotation.y = Math.PI;
    front.position.set(0, 1.5, 3);
    room.add(front);

    // left wall with window hole (interior side, faces +x)
    // rotation.y = +PI/2  => local x maps to world z = -x
    {
      const s = new THREE.Shape();
      s.moveTo(-3, 0); s.lineTo(2.5, 0); s.lineTo(2.5, 3); s.lineTo(-3, 3); s.lineTo(-3, 0);
      const hole = new THREE.Path();
      hole.moveTo(-0.3, 1.0); hole.lineTo(1.3, 1.0); hole.lineTo(1.3, 2.4); hole.lineTo(-0.3, 2.4); hole.lineTo(-0.3, 1.0);
      s.holes.push(hole);
      const g = new THREE.ShapeGeometry(s);
      const m = new THREE.Mesh(g, M.wall);
      m.rotation.y = Math.PI / 2;
      m.position.set(-3, 0, 0);
      m.receiveShadow = true;
      room.add(m);
    }

    // skirting
    room.add(box(6, 0.1, 0.02, M.frame, 0, 0.05, -2.49));
    room.add(box(0.02, 0.1, 5.5, M.frame, 2.99, 0.05, 0.25));

    // window frame, sill, glass
    {
      const wz = -0.5, wy = 1.7;
      const fr = M.frame;
      room.add(box(0.14, 0.06, 1.7, fr, -3, 1.0, wz));
      room.add(box(0.14, 0.06, 1.7, fr, -3, 2.4, wz));
      room.add(box(0.14, 1.46, 0.06, fr, -3, wy, -1.3));
      room.add(box(0.14, 1.46, 0.06, fr, -3, wy, 0.3));
      room.add(box(0.1, 1.4, 0.04, fr, -3, wy, wz));
      room.add(box(0.1, 0.04, 1.6, fr, -3, wy, wz));
      room.add(box(0.28, 0.04, 1.8, M.wood, -2.88, 0.98, wz)); // sill
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(1.6, 1.4),
        new THREE.MeshPhysicalMaterial({ color: "#9fb6d8", transparent: true, opacity: 0.12, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false })
      );
      glass.rotation.y = Math.PI / 2;
      glass.position.set(-3.0, wy, wz);
      room.add(glass);
      // curtains
      const curtainMat = new THREE.MeshStandardMaterial({ color: "#3f5a7a", roughness: 1, side: THREE.DoubleSide });
      [-1.55, 0.55].forEach((z) => {
        const cg = new THREE.PlaneGeometry(0.4, 2.1, 24, 1);
        const p = cg.attributes.position;
        for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 40) * 0.03);
        cg.computeVertexNormals();
        const c = new THREE.Mesh(cg, curtainMat);
        c.rotation.y = Math.PI / 2;
        c.position.set(-2.88, 1.6, z);
        c.castShadow = true;
        room.add(c);
      });
      room.add(limb(new THREE.Vector3(-2.86, 2.66, -1.9), new THREE.Vector3(-2.86, 2.66, 0.9), 0.012, M.metalDark));
      // plant on sill
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.12, 24), new THREE.MeshStandardMaterial({ color: "#a3553a", roughness: 0.8 }));
      pot.position.set(-2.86, 1.06, 0.05);
      room.add(pot);
      const leafMat = new THREE.MeshStandardMaterial({ color: "#2f6b34", roughness: 0.6, side: THREE.DoubleSide });
      for (let i = 0; i < 9; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), leafMat);
        leaf.scale.set(0.35, 1.4, 0.12);
        const a = (i / 9) * Math.PI * 2;
        leaf.position.set(-2.86 + Math.cos(a) * 0.035, 1.2, 0.05 + Math.sin(a) * 0.035);
        leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
        room.add(leaf);
      }
    }

    // rug
    {
      const rugTex = track(canvasTexture(512, 512, (ctx, w, h) => {
        ctx.fillStyle = "#2e3b55"; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "#c9a96a"; ctx.lineWidth = 10; ctx.strokeRect(30, 30, w - 60, h - 60);
        ctx.strokeStyle = "#8a3c2d"; ctx.lineWidth = 6; ctx.strokeRect(60, 60, w - 120, h - 120);
      }));
      const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), new THREE.MeshStandardMaterial({ map: rugTex, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2;
      rug.position.set(0.1, 0.004, -0.6);
      rug.receiveShadow = true;
      room.add(rug);
    }

    // bookshelf on right wall
    {
      const shelf = new THREE.Group();
      shelf.position.set(2.8, 0, -1.3);
      for (let i = 0; i < 4; i++) shelf.add(box(0.35, 0.03, 1.0, M.wood, 0, 0.4 + i * 0.45, 0));
      shelf.add(box(0.35, 1.8, 0.03, M.wood, 0, 0.9, -0.5));
      shelf.add(box(0.35, 1.8, 0.03, M.wood, 0, 0.9, 0.5));
      const cols = ["#7a2e2e", "#2e4a7a", "#c9a23a", "#2e6b4f", "#5b3a7a", "#d0d0d0", "#a0522d"];
      for (let s = 0; s < 3; s++) {
        let z = -0.45;
        while (z < 0.42) {
          const t = rand(0.03, 0.06), hgt = rand(0.24, 0.36);
          const b = box(0.24, hgt, t, new THREE.MeshStandardMaterial({ color: cols[(Math.random() * cols.length) | 0], roughness: 0.8 }), -0.02, 0.415 + s * 0.45 + hgt / 2, z + t / 2);
          shelf.add(b);
          z += t + 0.005;
        }
      }
      room.add(shelf);
    }

    // poster
    {
      const pTex = track(canvasTexture(512, 720, (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, "#0f1b3a"); g.addColorStop(1, "#d4562a");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = "#f8f1e3"; ctx.font = "bold 78px 'JetBrains Mono', monospace";
        ctx.fillText("</>", 150, 320);
        ctx.font = "bold 44px 'Space Grotesk', sans-serif"; ctx.fillText("HELLO, WORLD", 95, 450);
        ctx.font = "26px 'JetBrains Mono', monospace"; ctx.fillText("while(alive) learn();", 100, 520);
      }));
      const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.85), new THREE.MeshStandardMaterial({ map: pTex, roughness: 0.6 }));
      poster.rotation.y = -Math.PI / 2;
      poster.position.set(2.985, 1.9, 0.9);
      room.add(poster);
    }

    /* ---------------- DESK ---------------- */
    const DESK_Y = 0.75;
    const desk = new THREE.Group();
    desk.add(box(1.8, 0.045, 0.85, M.wood, 0, DESK_Y - 0.022, -1.75));
    [[-0.85, -2.12], [0.85, -2.12], [-0.85, -1.38], [0.85, -1.38]].forEach(([x, z]) =>
      desk.add(box(0.05, DESK_Y - 0.045, 0.05, M.metalDark, x, (DESK_Y - 0.045) / 2, z))
    );
    desk.add(box(0.5, 0.18, 0.75, M.wood, 0.6, DESK_Y - 0.14, -1.75)); // drawer
    desk.add(box(0.1, 0.015, 0.015, M.alu, 0.6, DESK_Y - 0.14, -1.37));
    room.add(desk);

    /* ---------------- LAPTOP ---------------- */
    const laptop = new THREE.Group();
    laptop.position.set(0.05, DESK_Y, -1.72);
    laptop.add(box(0.36, 0.014, 0.25, M.alu, 0, 0.007, 0));
    const kbTex = track(canvasTexture(512, 360, (ctx, w, h) => {
      ctx.fillStyle = "#c7cad1"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#1a1b1f";
      for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) ctx.fillRect(18 + c * 37, 22 + r * 37, 31, 31);
      ctx.fillRect(130, 22 + 5 * 37, 250, 31);
      ctx.fillStyle = "#b5b8bf"; ctx.fillRect(170, 250, 170, 100);
    }));
    const kb = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.235), new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.5, metalness: 0.4 }));
    kb.rotation.x = -Math.PI / 2;
    kb.position.y = 0.0145;
    laptop.add(kb);
    const lid = new THREE.Group();
    lid.position.set(0, 0.014, -0.125);
    lid.rotation.x = -0.22;
    const lidBack = box(0.36, 0.24, 0.008, M.alu, 0, 0.12, -0.004);
    lid.add(lidBack);
    // code screen
    const codeLines = [
      ["#c792ea", "function ", "#82aaff", "solveQuest", "#d6deeb", "(level) {"],
      ["#d6deeb", "  ", "#c792ea", "const ", "#d6deeb", "xp = level * ", "#f78c6c", "42", "#d6deeb", ";"],
      ["#d6deeb", "  ", "#c792ea", "for ", "#d6deeb", "(let i = 0; i < n; i++) {"],
      ["#d6deeb", "    dp[i] = Math.max(dp[i-1], a[i]);"],
      ["#d6deeb", "  }"],
      ["#637777", "  // boss fight: binary search"],
      ["#d6deeb", "  ", "#c792ea", "while ", "#d6deeb", "(lo <= hi) {"],
      ["#d6deeb", "    ", "#c792ea", "const ", "#d6deeb", "mid = (lo + hi) >> ", "#f78c6c", "1", "#d6deeb", ";"],
      ["#d6deeb", "    ", "#c792ea", "if ", "#d6deeb", "(ok(mid)) hi = mid - ", "#f78c6c", "1", "#d6deeb", ";"],
      ["#d6deeb", "    ", "#c792ea", "else ", "#d6deeb", "lo = mid + ", "#f78c6c", "1", "#d6deeb", ";"],
      ["#d6deeb", "  }"],
      ["#d6deeb", "  ", "#c792ea", "return ", "#ecc48d", "`Level up! +${xp}xp`", "#d6deeb", ";"],
      ["#d6deeb", "}"],
      [""],
      ["#82aaff", "console", "#d6deeb", ".log(solveQuest(", "#f78c6c", "7", "#d6deeb", "));"],
    ];
    let typed = 0;
    const screenTex = track(canvasTexture(1024, 680, (ctx, w, h) => {
      ctx.fillStyle = "#011627"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = "#0b2942"; ctx.fillRect(0, 0, w, 44);
      ["#ff5f56", "#ffbd2e", "#27c93f"].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(26 + i * 26, 22, 8, 0, 7); ctx.fill(); });
      ctx.fillStyle = "#8aa"; ctx.font = "20px 'JetBrains Mono', monospace"; ctx.fillText("quest.js — Code Quest", 380, 29);
      ctx.fillStyle = "#01111d"; ctx.fillRect(0, 44, 60, h);
      ctx.font = "24px 'JetBrains Mono', monospace";
      let budget = typed;
      codeLines.forEach((parts, li) => {
        const y = 86 + li * 38;
        ctx.fillStyle = "#3b5a70"; ctx.fillText(String(li + 1).padStart(2, " "), 12, y);
        let x = 78;
        for (let p = 0; p < parts.length; p += 2) {
          if (!parts[p + 1]) continue;
          ctx.fillStyle = parts[p];
          let txt = parts[p + 1];
          if (budget <= 0) return;
          if (txt.length > budget) txt = txt.slice(0, budget);
          budget -= txt.length;
          ctx.fillText(txt, x, y);
          x += ctx.measureText(txt).width;
          if (budget <= 0 && Math.floor(performance.now() / 400) % 2) { ctx.fillStyle = "#80a4c2"; ctx.fillRect(x + 2, y - 22, 12, 28); }
        }
        budget -= 1;
      });
    }));
    const totalChars = codeLines.reduce((s, l) => s + l.filter((_, i) => i % 2).join("").length + 1, 0);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.335, 0.215), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }));
    screen.position.set(0, 0.122, 0.0005);
    lid.add(screen);
    laptop.add(lid);
    room.add(laptop);
    const screenLight = new THREE.PointLight("#6fa8ff", 0.9, 2.2, 2);
    screenLight.position.set(0.05, DESK_Y + 0.2, -1.5);
    room.add(screenLight);

    /* ---------------- LAMP ---------------- */
    {
      const lamp = new THREE.Group();
      lamp.position.set(0.72, DESK_Y, -2.0);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.02, 32), M.metalDark);
      base.position.y = 0.01; base.castShadow = true; lamp.add(base);
      const j1 = new THREE.Vector3(0, 0.02, 0), j2 = new THREE.Vector3(0.02, 0.38, 0.05), j3 = new THREE.Vector3(-0.18, 0.5, 0.2);
      lamp.add(limb(j1, j2, 0.008, M.metalDark), limb(j2, j3, 0.008, M.metalDark));
      const shade = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.11, 32, 1, true), new THREE.MeshStandardMaterial({ color: "#1d4d3c", roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }));
      shade.position.copy(j3); shade.rotation.x = 0.35; shade.castShadow = true; lamp.add(shade);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 16, 16), new THREE.MeshBasicMaterial({ color: "#fff1c9", toneMapped: false }));
      bulb.position.copy(j3).add(new THREE.Vector3(0, -0.04, 0.01)); lamp.add(bulb);
      room.add(lamp);
      const spot = new THREE.SpotLight("#ffcf8a", 6, 4, 0.95, 0.6, 2);
      spot.position.set(0.72 - 0.18, DESK_Y + 0.46, -1.8);
      spot.target.position.set(0.2, DESK_Y, -1.55);
      spot.castShadow = true;
      spot.shadow.mapSize.set(1024, 1024);
      spot.shadow.bias = -0.0004;
      room.add(spot, spot.target);
    }

    /* ---------------- MUG + STEAM ---------------- */
    const steam = [];
    {
      const mug = new THREE.Group();
      mug.position.set(0.42, DESK_Y, -1.45);
      const pts = [];
      for (let i = 0; i <= 10; i++) pts.push(new THREE.Vector2(0.042 + Math.sin(i / 10) * 0.002, i * 0.0105));
      pts.push(new THREE.Vector2(0.038, 0.105), new THREE.Vector2(0.038, 0.008));
      const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 48), new THREE.MeshStandardMaterial({ color: "#d4562a", roughness: 0.3, side: THREE.DoubleSide }));
      body.castShadow = true; mug.add(body);
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.028, 0.007, 12, 32, Math.PI), body.material);
      handle.position.set(0.045, 0.055, 0); handle.rotation.z = -Math.PI / 2; mug.add(handle);
      const cof = new THREE.Mesh(new THREE.CircleGeometry(0.038, 32), M.coffee);
      cof.rotation.x = -Math.PI / 2; cof.position.y = 0.09; mug.add(cof);
      room.add(mug);
      const sTex = track(canvasTexture(128, 128, (ctx, w) => {
        const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
        g.addColorStop(0, "rgba(255,255,255,0.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, w);
      }));
      for (let i = 0; i < 14; i++) {
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sTex, transparent: true, depthWrite: false, opacity: 0 }));
        s.userData.t = i / 14;
        room.add(s);
        steam.push(s);
      }
    }

    /* ---------------- DESK PROPS ---------------- */
    {
      // pen
      const pen = limb(new THREE.Vector3(-0.2, DESK_Y + 0.006, -1.42), new THREE.Vector3(-0.08, DESK_Y + 0.006, -1.36), 0.005, new THREE.MeshStandardMaterial({ color: "#1f3d8a", metalness: 0.5, roughness: 0.3 }));
      room.add(pen);
      // book stack
      [["#2b4f7a", 0.03], ["#7a2b2b", 0.025], ["#c9a23a", 0.03]].forEach(([c, t], i) => {
        const b = box(0.24, t, 0.17, new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }), -0.7, DESK_Y + 0.016 + i * 0.03, -2.0);
        b.rotation.y = i * 0.15 - 0.1; room.add(b);
      });
      // phone
      room.add(box(0.07, 0.008, 0.14, M.black, 0.32, DESK_Y + 0.004, -1.95));
      // headphones on desk? skip — on head
    }

    /* ---------------- DIARY (flippable) ---------------- */
    const DIARY = new THREE.Vector3(-0.5, DESK_Y, -1.58);
    const PW = 0.25, PD = 0.34;
    const leaves = [];
    {
      const d = new THREE.Group();
      d.position.copy(DIARY);
      d.rotation.y = 0.06;
      room.add(d);
      const cover = box(PW * 2 + 0.025, 0.012, PD + 0.02, M.leather, 0, 0.006, 0);
      d.add(cover);
      const block = (x) => box(PW - 0.004, 0.012, PD - 0.004, M.paper, x, 0.018, 0);
      d.add(block(-PW / 2), block(PW / 2));
      // ribbon
      d.add(box(0.008, 0.001, 0.2, new THREE.MeshStandardMaterial({ color: "#b8212a" }), 0.01, 0.0245, PD / 2 + 0.05));

      const pageBg = (ctx, w, h) => {
        ctx.fillStyle = "#f6eedb"; ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(90,130,190,.28)"; ctx.lineWidth = 2;
        for (let y = 120; y < h - 30; y += 44) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(w - 30, y); ctx.stroke(); }
        ctx.strokeStyle = "rgba(210,80,80,.4)"; ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(70, h); ctx.stroke();
        const g = ctx.createLinearGradient(0, 0, 40, 0);
        g.addColorStop(0, "rgba(0,0,0,.18)"); g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g; ctx.fillRect(0, 0, 40, h);
      };
      const mirrorBg = (draw) => (ctx, w, h) => { ctx.save(); ctx.translate(w, 0); ctx.scale(-1, 1); pageBg(ctx, w, h); ctx.restore(); draw(ctx, w, h); };
      const ink = "#1d2a4a";
      const pageTex = (draw, back) => track(canvasTexture(512, 700, (ctx, w, h) => {
        if (back) {
          ctx.save(); ctx.translate(w, h); ctx.rotate(Math.PI);
          mirrorBg(draw)(ctx, w, h);
          ctx.restore();
        } else { pageBg(ctx, w, h); draw(ctx, w, h); }
      }));
      const featureDraw = (f) => (ctx, w) => {
        ctx.fillStyle = "#d4562a"; ctx.font = "700 40px 'Caveat', cursive"; ctx.fillText(`Feature ${f.n}`, 90, 80);
        ctx.font = "120px serif"; ctx.fillText(f.icon, 90, 250);
        ctx.fillStyle = ink; ctx.font = "700 62px 'Caveat', cursive"; wrapText(ctx, f.title, 90, 340, w - 120, 58);
        ctx.font = "500 38px 'Caveat', cursive"; ctx.fillStyle = "#33415f";
        const y = wrapText(ctx, f.text, 90, 430, w - 130, 44);
        ctx.fillStyle = "#2e6b4f"; ctx.font = "600 32px 'Caveat', cursive"; ctx.fillText("✓ " + f.tag, 90, y + 70);
        ctx.strokeStyle = "#d4562a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(90, 360); ctx.quadraticCurveTo(250, 372, 420, 356); ctx.stroke();
      };
      const backDraw = (i) => (ctx, w) => {
        ctx.fillStyle = "#33415f"; ctx.font = "600 40px 'Caveat', cursive";
        ctx.fillText("notes —", 90, 100);
        ctx.font = "500 34px 'Caveat', cursive";
        const doodles = ["levels unlocked: ∞", "rank #1 or bust", "dream job → applied", "nailed it. no nerves.", "found my squad <3"];
        ctx.fillText(doodles[i], 90, 200);
        ctx.strokeStyle = "#d4562a"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w / 2, 420, 90, 0, Math.PI * 2); ctx.stroke();
        ctx.font = "700 110px 'Caveat', cursive"; ctx.fillStyle = "#d4562a"; ctx.fillText(String(i + 1), w / 2 - 25, 455);
        ctx.font = "500 32px 'Caveat', cursive"; ctx.fillStyle = "#33415f"; ctx.fillText("keep flipping →", 150, 620);
      };
      const leftBase = pageTex((ctx) => {
        ctx.fillStyle = ink; ctx.font = "700 64px 'Caveat', cursive"; ctx.fillText("Code Quest", 100, 220);
        ctx.font = "500 40px 'Caveat', cursive"; ctx.fillStyle = "#33415f"; ctx.fillText("field notes of a", 100, 300); ctx.fillText("future engineer", 100, 345);
        ctx.font = "60px 'JetBrains Mono'"; ctx.fillStyle = "#d4562a"; ctx.fillText("{ }", 160, 500);
      });
      const rightBase = pageTex((ctx) => {
        ctx.fillStyle = ink; ctx.font = "700 60px 'Caveat', cursive"; ctx.fillText("Your turn.", 100, 300);
        ctx.font = "500 40px 'Caveat', cursive"; ctx.fillStyle = "#d4562a"; ctx.fillText("start the quest →", 100, 380);
      });
      const flatPage = (tex, x) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.006, PD - 0.006), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
        m.rotation.x = -Math.PI / 2; m.position.set(x, 0.0245, 0); m.receiveShadow = true; d.add(m);
      };
      flatPage(leftBase, -PW / 2);
      flatPage(rightBase, PW / 2);

      FEATURES.forEach((f, i) => {
        const pivot = new THREE.Group();
        pivot.position.set(0, 0.025 + (FEATURES.length - i) * 0.0012, 0);
        const fg = new THREE.PlaneGeometry(PW - 0.006, PD - 0.006, 12, 1);
        fg.translate((PW - 0.006) / 2, 0, 0);
        const front = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: pageTex(featureDraw(f)), roughness: 0.9 }));
        front.rotation.x = -Math.PI / 2;
        front.receiveShadow = true;
        front.castShadow = true;
        const backM = new THREE.Mesh(fg, new THREE.MeshStandardMaterial({ map: pageTex(backDraw(i), true), roughness: 0.9 }));
        backM.rotation.x = Math.PI / 2;
        backM.position.y = -0.0003;
        pivot.add(front, backM);
        d.add(pivot);
        leaves.push(pivot);
      });
    }

    /* ---------------- STICKY NOTES ---------------- */
    const noteTextures = [];
    {
      const positions = [[-0.85, 1.95], [-0.35, 1.6], [0.15, 2.0], [0.62, 1.58], [1.05, 1.98]];
      REVIEWS.forEach((r, i) => {
        const tex = track(canvasTexture(512, 512, (ctx, w, h) => {
          ctx.fillStyle = r.color; ctx.fillRect(0, 0, w, h);
          const g = ctx.createLinearGradient(0, 0, 0, h);
          g.addColorStop(0, "rgba(0,0,0,.1)"); g.addColorStop(0.15, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.08)");
          ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = "#c9a23a"; ctx.font = "44px serif"; ctx.fillText("★★★★★", 40, 80);
          ctx.fillStyle = "#1d2433"; ctx.font = "600 48px 'Caveat', cursive";
          wrapText(ctx, `“${r.text}”`, 40, 160, w - 80, 52);
          ctx.font = "700 46px 'Caveat', cursive"; ctx.fillStyle = "#8a2d1a"; ctx.fillText("— " + r.name, 40, 470);
        }));
        noteTextures.push(tex);
        const g = new THREE.PlaneGeometry(0.4, 0.4, 8, 8);
        const p = g.attributes.position;
        for (let k = 0; k < p.count; k++) { const yy = p.getY(k); if (yy < 0) p.setZ(k, (yy * yy) * 0.25); }
        g.computeVertexNormals();
        const n = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide }));
        n.position.set(positions[i][0], positions[i][1], -2.495);
        n.rotation.z = rand(-0.09, 0.09);
        n.castShadow = true;
        room.add(n);
        const pin = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 16), new THREE.MeshStandardMaterial({ color: ["#d33", "#36c", "#2a2", "#d90", "#a3c"][i], roughness: 0.3 }));
        pin.position.set(positions[i][0], positions[i][1] + 0.17, -2.48);
        room.add(pin);
      });
      // small decorative notes
      [["TODO: ship it", "#ffe680", -1.3, 1.45], ["O(n log n)", "#a8e6ff", 1.45, 1.6]].forEach(([t, c, x, y]) => {
        const tex = track(canvasTexture(256, 256, (ctx) => { ctx.fillStyle = c; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = "#1d2433"; ctx.font = "700 44px 'Caveat', cursive"; wrapText(ctx, t, 24, 110, 210, 48); }));
        noteTextures.push(tex);
        const n = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 }));
        n.position.set(x, y, -2.494); n.rotation.z = rand(-0.15, 0.15); room.add(n);
      });
    }

    /* ---------------- CHAIR ---------------- */
    const BOY = new THREE.Vector3(0.05, 0, -0.95);
    {
      const chair = new THREE.Group();
      chair.position.copy(BOY);
      const seatMat = new THREE.MeshStandardMaterial({ color: "#1b1d22", roughness: 0.7 });
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.07, 0.46), seatMat);
      seat.position.set(0, 0.45, 0.02); seat.castShadow = true; chair.add(seat);
      const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.58, 0.06), seatMat);
      backrest.position.set(0, 0.86, 0.27); backrest.rotation.x = -0.12; backrest.castShadow = true; chair.add(backrest);
      chair.add(limb(new THREE.Vector3(0, 0.42, 0.02), new THREE.Vector3(0, 0.1, 0.02), 0.025, M.alu));
      chair.add(limb(new THREE.Vector3(0, 0.5, 0.22), new THREE.Vector3(0, 0.62, 0.27), 0.02, M.metalDark));
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        const end = new THREE.Vector3(Math.cos(a) * 0.3, 0.06, 0.02 + Math.sin(a) * 0.3);
        chair.add(limb(new THREE.Vector3(0, 0.09, 0.02), end, 0.018, M.metalDark));
        const wheel = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 12), M.black);
        wheel.position.set(end.x, 0.03, end.z); chair.add(wheel);
      }
      room.add(chair);
    }

    /* ---------------- STUDENT ---------------- */
    // faces -z (toward laptop). local origin at chair.
    const boy = new THREE.Group();
    boy.position.copy(BOY);
    room.add(boy);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);
    const upper = new THREE.Group(); // torso+head+arms (breathing / lean)
    upper.position.set(0, 0.52, 0.1);
    boy.add(upper);
    const head = new THREE.Group();
    const handL = new THREE.Group(), handR = new THREE.Group();
    {
      // legs
      [-1, 1].forEach((s) => {
        const hip = V(0.1 * s, 0.53, 0.08), knee = V(0.12 * s, 0.53, -0.34), ankle = V(0.13 * s, 0.08, -0.4);
        boy.add(limb(hip, knee, 0.068, M.jeans), limb(knee, ankle, 0.055, M.jeans));
        const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.12, 6, 12), M.shoe);
        shoe.rotation.x = Math.PI / 2; shoe.position.set(0.13 * s, 0.045, -0.46); shoe.scale.set(1.15, 1, 0.8); shoe.castShadow = true; boy.add(shoe);
        const sole = box(0.1, 0.015, 0.22, M.sole, 0.13 * s, 0.008, -0.46); boy.add(sole);
      });
      const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), M.jeans);
      pelvis.scale.set(1.05, 0.55, 0.9); pelvis.position.set(0, 0.55, 0.1); pelvis.castShadow = true; boy.add(pelvis);

      // torso (hoodie) — local to upper, lean forward
      upper.rotation.x = -0.18;
      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.26, 10, 24), M.hoodie);
      torso.scale.set(1.12, 1, 0.78); torso.position.set(0, 0.24, 0); torso.castShadow = true; upper.add(torso);
      // hoodie pocket + strings
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: "#b8461f", roughness: 0.95 }));
      pocket.position.set(0, 0.1, -0.12); upper.add(pocket);
      [-0.035, 0.035].forEach((x) => upper.add(limb(V(x, 0.46, -0.11), V(x * 1.2, 0.33, -0.13), 0.004, M.ceramic)));
      // hood
      const hood = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.045, 12, 24), M.hoodie);
      hood.rotation.x = Math.PI / 2 - 0.4; hood.position.set(0, 0.5, 0.04); hood.scale.set(1.1, 1.2, 1); hood.castShadow = true; upper.add(hood);
      // neck
      upper.add(limb(V(0, 0.48, 0), V(0, 0.58, -0.02), 0.045, M.skin));

      // head
      head.position.set(0, 0.68, -0.04);
      upper.add(head);
      const skull = new THREE.Mesh(new THREE.SphereGeometry(0.1, 32, 32), M.skin);
      skull.scale.set(0.92, 1.08, 1); skull.castShadow = true; head.add(skull);
      const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.075, 24, 16), M.skin);
      jaw.position.set(0, -0.05, -0.02); jaw.scale.set(1, 0.8, 1); head.add(jaw);
      const nose = new THREE.Mesh(new THREE.SphereGeometry(0.016, 12, 12), M.skin);
      nose.position.set(0, -0.005, -0.1); nose.scale.set(0.8, 1, 1.2); head.add(nose);
      [-1, 1].forEach((s) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 12), M.skin);
        ear.scale.set(0.5, 1, 0.8); ear.position.set(0.092 * s, 0, 0.005); head.add(ear);
        const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.013, 12, 12), M.ceramic);
        eyeW.position.set(0.034 * s, 0.015, -0.087); head.add(eyeW);
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.007, 10, 10), M.hair);
        pupil.position.set(0.034 * s, 0.013, -0.098); head.add(pupil);
        const brow = box(0.032, 0.006, 0.01, M.hair, 0.034 * s, 0.04, -0.09); brow.rotation.z = -0.1 * s; head.add(brow);
        // glasses
        const lens = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.003, 8, 24), M.black);
        lens.position.set(0.035 * s, 0.014, -0.1); head.add(lens);
        head.add(limb(V(0.056 * s, 0.018, -0.098), V(0.09 * s, 0.02, -0.01), 0.0025, M.black));
      });
      head.add(limb(V(-0.013, 0.016, -0.104), V(0.013, 0.016, -0.104), 0.0025, M.black));
      // hair: cap + messy tufts
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.106, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), M.hair);
      cap.scale.set(0.95, 1.1, 1.04); cap.position.y = 0.01; cap.rotation.x = 0.25; cap.castShadow = true; head.add(cap);
      for (let i = 0; i < 16; i++) {
        const tuft = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.06, 6), M.hair);
        const a = rand(0, Math.PI * 2), r = rand(0.03, 0.09);
        tuft.position.set(Math.cos(a) * r * 0.9, 0.1 - r * 0.3, Math.sin(a) * r);
        tuft.rotation.set(Math.sin(a) * 0.9 + 0.3, 0, -Math.cos(a) * 0.9);
        head.add(tuft);
      }
      // headphones
      const hpMat = new THREE.MeshStandardMaterial({ color: "#1c1f26", roughness: 0.4, metalness: 0.3 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.01, 10, 32, Math.PI), hpMat);
      band.position.set(0, 0.0, 0.01); head.add(band);
      [-1, 1].forEach((s) => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 24), hpMat);
        cup.rotation.z = Math.PI / 2; cup.position.set(0.105 * s, -0.005, 0.01); head.add(cup);
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.004, 8, 24), new THREE.MeshStandardMaterial({ color: "#d4562a", emissive: "#d4562a", emissiveIntensity: 0.6 }));
        ring.rotation.y = Math.PI / 2; ring.position.set(0.121 * s, -0.005, 0.01); head.add(ring);
      });
      head.rotation.x = 0.22;

      // arms: shoulder -> elbow -> wrist (in upper's local space; upper is leaned)
      [-1, 1].forEach((s) => {
        const sh = V(0.2 * s, 0.42, 0), el = V(0.24 * s, 0.16, -0.18), wr = V(0.1 * s, 0.24, -0.46);
        const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), M.hoodie);
        shoulder.position.copy(sh); upper.add(shoulder);
        upper.add(limb(sh, el, 0.058, M.hoodie), limb(el, wr, 0.05, M.hoodie));
        const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), new THREE.MeshStandardMaterial({ color: "#b8461f", roughness: 0.95 }));
        cuff.position.copy(wr); cuff.quaternion.setFromUnitVectors(V(0, 1, 0), new THREE.Vector3().subVectors(wr, el).normalize()); upper.add(cuff);
        const hand = s < 0 ? handL : handR;
        hand.position.copy(wr).add(V(-0.01 * s, -0.01, -0.04));
        const palm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.025, 0.08), M.skin);
        palm.position.z = -0.02; palm.castShadow = true; hand.add(palm);
        for (let f = 0; f < 4; f++) {
          const fing = new THREE.Mesh(new THREE.CapsuleGeometry(0.008, 0.03, 4, 8), M.skin);
          fing.rotation.x = Math.PI / 2 + 0.5; fing.position.set(-0.026 + f * 0.017, -0.012, -0.075); hand.add(fing);
          hand.userData["f" + f] = fing;
        }
        const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.025, 4, 8), M.skin);
        thumb.rotation.set(Math.PI / 2, 0, 0.6 * s); thumb.position.set(-0.04 * s, -0.008, -0.04); hand.add(thumb);
        upper.add(hand);
      });
    }

    /* ---------------- BUILDING EXTERIOR ---------------- */
    const winTex = track(canvasTexture(256, 256, (ctx, w, h) => {
      ctx.fillStyle = "#3a3f4a"; ctx.fillRect(0, 0, w, h);
      noiseDraw("rgba(0,0,0,0)", 20);
      for (let i = 0; i < 2; i++) {
        const lit = Math.random() < 0.45;
        const x = 30 + i * 128;
        ctx.fillStyle = lit ? (Math.random() < 0.5 ? "#ffcf7a" : "#ffe3b0") : "#10141c";
        ctx.fillRect(x, 60, 80, 120);
        ctx.fillStyle = "#c9c4b8"; ctx.fillRect(x - 6, 180, 92, 8);
      }
    }, { repeat: [1, 1] }));
    const buildingTex = (seed) => {
      const t = track(canvasTexture(512, 1024, (ctx, w, h) => {
        ctx.fillStyle = ["#2a2f3a", "#33302c", "#262b36"][seed % 3]; ctx.fillRect(0, 0, w, h);
        for (let y = 20; y < h; y += 64) for (let x = 16; x < w; x += 48) {
          const lit = Math.random() < 0.28;
          ctx.fillStyle = lit ? ["#ffcf7a", "#ffe8b5", "#9fd0ff"][(Math.random() * 3) | 0] : "#0c0f16";
          ctx.fillRect(x, y, 26, 38);
        }
      }, { repeat: [1, 1] }));
      return t;
    };

    // main building facade (faces -x) with our window hole
    {
      const s = new THREE.Shape();
      s.moveTo(-8, -12); s.lineTo(8, -12); s.lineTo(8, 20); s.lineTo(-8, 20); s.lineTo(-8, -12);
      const hole = new THREE.Path();
      hole.moveTo(-1.3, 1.0); hole.lineTo(0.3, 1.0); hole.lineTo(0.3, 2.4); hole.lineTo(-1.3, 2.4); hole.lineTo(-1.3, 1.0);
      s.holes.push(hole);
      const g = new THREE.ShapeGeometry(s);
      // uv per 4m x 3m tile — windows land on each floor
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + 1.7) / 4, (uv.getY(i) + 0.0) / 3);
      const facadeMat = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: "#ffffff", emissiveIntensity: 0.35, roughness: 0.9 });
      const facade = new THREE.Mesh(g, facadeMat);
      facade.rotation.y = -Math.PI / 2;
      facade.position.set(-3.03, 0, 0);
      facade.receiveShadow = true;
      scene.add(facade);
      // ledges per floor
      for (let y = -12; y <= 20; y += 3) {
        const l = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 16.2), new THREE.MeshStandardMaterial({ color: "#555a63", roughness: 0.9 }));
        l.position.set(-3.1, y + 0.94, 0); scene.add(l);
      }
      // body: box with hidden -x face, culled from inside
      const bt = buildingTex(0);
      bt.repeat.set(2, 3);
      const sideMat = new THREE.MeshStandardMaterial({ map: bt, emissiveMap: bt, emissive: "#ffffff", emissiveIntensity: 0.3, roughness: 0.9 });
      const hidden = new THREE.MeshBasicMaterial({ visible: false });
      const body = new THREE.Mesh(new THREE.BoxGeometry(13, 32, 16), [sideMat, hidden, new THREE.MeshStandardMaterial({ color: "#2a2d33" }), hidden, sideMat, sideMat]);
      body.position.set(3.5 - 0.03, 4, 0);
      scene.add(body);
      // rooftop: water tank + antenna
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2, 24), new THREE.MeshStandardMaterial({ color: "#5b4636", roughness: 0.9 }));
      tank.position.set(3, 21.2, 3); scene.add(tank);
      const ant = limb(V(1, 20, -4), V(1, 26, -4), 0.05, M.metalDark); scene.add(ant);
      const blink = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), new THREE.MeshBasicMaterial({ color: "#ff3b3b", toneMapped: false }));
      blink.position.set(1, 26.1, -4); blink.name = "blink"; scene.add(blink);
    }

    // ground, street, lamps
    {
      const groundTex = track(canvasTexture(512, 512, noiseDraw("#1b1e24", 18), { repeat: [40, 40] }));
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 }));
      ground.rotation.x = -Math.PI / 2; ground.position.y = -12; ground.receiveShadow = true; scene.add(ground);
      const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 400), new THREE.MeshStandardMaterial({ color: "#121418", roughness: 0.6, metalness: 0.2 }));
      road.rotation.x = -Math.PI / 2; road.position.set(-12, -11.98, 0); scene.add(road);
      for (let z = -100; z < 100; z += 6) {
        const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 2.5), new THREE.MeshBasicMaterial({ color: "#d9c27a" }));
        dash.rotation.x = -Math.PI / 2; dash.position.set(-12, -11.97, z); scene.add(dash);
      }
      for (let z = -40; z <= 40; z += 16) {
        const pole = limb(V(-6.5, -12, z), V(-6.5, -6.5, z), 0.08, M.metalDark); scene.add(pole);
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 16, 16), new THREE.MeshBasicMaterial({ color: "#ffd9a0", toneMapped: false }));
        head.position.set(-6.8, -6.5, z); scene.add(head);
        const pl = new THREE.PointLight("#ffb866", 18, 18, 2); pl.position.set(-6.8, -6.8, z); scene.add(pl);
      }
    }

    // city skyline
    {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mats = [0, 1, 2, 3].map((i) => {
        const t = buildingTex(i);
        return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 0.9 });
      });
      const place = (x, z) => {
        const w = rand(6, 14), d = rand(6, 14), h = rand(15, 70);
        const m = new THREE.Mesh(geo, mats[(Math.random() * 4) | 0]);
        m.scale.set(w, h, d); m.position.set(x, -12 + h / 2, z);
        scene.add(m);
      };
      for (let z = -130; z <= 130; z += 18) {
        if (Math.abs(z) > 14) place(rand(-2, 12), z);
        place(rand(-40, -26), z);
        place(rand(-75, -55), z + 6);
        place(rand(25, 45), z);
        place(rand(60, 90), z + 7);
      }
    }

    /* ---------------- RESIZE ---------------- */
    const onResize = () => {
      camera.aspect = W() / H();
      camera.updateProjectionMatrix();
      renderer.setSize(W(), H());
    };
    window.addEventListener("resize", onResize);

    /* ---------------- SCROLL TIMELINE ---------------- */
    const O = overlay.current;
    const K = {
      home: { px: 2.4, py: 1.9, pz: 2.2, tx: -0.1, ty: 1.0, tz: -1.6 },
      diary: { px: DIARY.x + 0.01, py: DIARY.y + 0.62, pz: DIARY.z + 0.32, tx: DIARY.x + 0.01, ty: DIARY.y, tz: DIARY.z - 0.02 },
      notes: { px: 0.1, py: 1.8, pz: -1.05, tx: 0.1, ty: 1.78, tz: -2.5 },
      win1: { px: -2.3, py: 1.7, pz: -0.5, tx: -6, ty: 1.6, tz: -0.5 },
      win2: { px: -5.5, py: 1.9, pz: -0.4, tx: -10, ty: 1.6, tz: 0.5 },
      outside: { px: -11.5, py: 2.6, pz: 4.5, tx: -3, ty: 1.5, tz: -0.6 },
      moon: { px: -16, py: 6, pz: 7, tx: MOON_POS.x, ty: MOON_POS.y, tz: MOON_POS.z },
    };
    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: { trigger: scrollRef.current, start: "top top", end: "bottom bottom", scrub: 1.2 },
    });
    const fadeIn = (el, at, d = 0.4) => tl.fromTo(el, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: d, ease: "power2.out" }, at);
    const fadeOut = (el, at, d = 0.4) => tl.to(el, { autoAlpha: 0, y: -30, duration: d, ease: "power2.in" }, at);

    tl.to({}, { duration: 0.4 }, 0); // hold
    fadeOut(O.hero, 0.3, 0.5);
    tl.to(cam, { ...K.diary, duration: 1.3 }, 0.6);
    fadeIn(O.diary, 1.6);
    leaves.forEach((leaf, i) => {
      const at = 2.1 + i * 0.6;
      tl.to(leaf.rotation, { z: Math.PI - 0.004 * i, duration: 0.55, ease: "power1.inOut" }, at);
      tl.to(leaf.position, { y: 0.025 + (i + 1) * 0.0012, duration: 0.55, ease: "none" }, at);
    });
    fadeOut(O.diary, 5.1);
    tl.to(cam, { ...K.home, duration: 1 }, 5.2);
    tl.to(cam, { ...K.notes, duration: 1.1 }, 6.3);
    fadeIn(O.notes, 7.0);
    tl.to({}, { duration: 0.9 }, 7.4);
    fadeOut(O.notes, 8.2);
    tl.to(cam, { ...K.home, duration: 1 }, 8.3);
    tl.to(cam, { ...K.win1, duration: 0.9, ease: "power2.in" }, 9.4);
    tl.to(cam, { ...K.win2, duration: 0.6, ease: "none" }, 10.3);
    tl.to(cam, { ...K.outside, duration: 1.1, ease: "power2.out" }, 10.9);
    fadeIn(O.companies, 11.7);
    tl.to({}, { duration: 0.8 }, 12.1);
    fadeOut(O.companies, 12.9);
    tl.to(cam, { ...K.moon, duration: 1.6 }, 13.0);
    fadeIn(O.cta, 14.2, 0.5);
    tl.to({}, { duration: 0.5 }, 14.7);

    /* ---------------- LOOP ---------------- */
    const clock = new THREE.Clock();
    let lastType = 0, raf;
    const blink = scene.getObjectByName("blink");
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const t = clock.getElapsedTime();

      // typing
      if (t - lastType > 0.07) {
        lastType = t;
        typed = (typed + 1) % (totalChars + 40);
        screenTex.userData.redraw();
      }
      [handL, handR].forEach((h, i) => {
        h.position.y = 0.23 + Math.max(0, Math.sin(t * 18 + i * 1.7)) * 0.012;
        for (let f = 0; f < 4; f++) h.userData["f" + f].rotation.x = Math.PI / 2 + 0.5 + Math.max(0, Math.sin(t * 22 + f * 1.3 + i)) * 0.35;
      });
      upper.scale.y = 1 + Math.sin(t * 1.6) * 0.008; // breathing
      head.rotation.y = Math.sin(t * 0.4) * 0.08;
      head.rotation.x = 0.22 + Math.sin(t * 0.7) * 0.03;

      // steam
      steam.forEach((s) => {
        s.userData.t = (s.userData.t + 0.0035) % 1;
        const k = s.userData.t;
        s.position.set(0.42 + Math.sin(k * 8 + t) * 0.02 * k, DESK_Y + 0.1 + k * 0.3, -1.45 + Math.cos(k * 6) * 0.01);
        const sc = 0.04 + k * 0.1;
        s.scale.set(sc, sc, 1);
        s.material.opacity = Math.sin(k * Math.PI) * 0.35;
      });

      screenLight.intensity = 0.8 + Math.sin(t * 9) * 0.05;
      if (blink) blink.visible = Math.sin(t * 3) > 0;
      stars.rotation.y = t * 0.002;

      camera.position.set(cam.px, cam.py, cam.pz);
      camera.lookAt(cam.tx, cam.ty, cam.tz);
      renderer.render(scene, camera);
    };
    loop();

    // re-draw handwritten textures once fonts arrive
    document.fonts?.ready.then(() =>
      disposables.forEach((tx) => tx.userData?.redraw && tx !== screenTex && tx.userData.redraw())
    );
    void noteTextures;

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      tl.scrollTrigger?.kill();
      tl.kill();
      scene.traverse((o) => {
        o.geometry?.dispose();
        const m = o.material;
        (Array.isArray(m) ? m : m ? [m] : []).forEach((mm) => mm.dispose());
      });
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      link.remove();
    };
  }, []);

  const set = (k) => (el) => (overlay.current[k] = el);
  const display = { fontFamily: "'Space Grotesk', sans-serif" };

  return (
    <div className="relative bg-[#050816] text-white" style={display}>
      {/* 3D canvas */}
      <div ref={mountRef} className="fixed inset-0 z-0" />
      {/* vignette */}
      <div className="pointer-events-none fixed inset-0 z-10" style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,.55) 100%)" }} />

      {/* corner UI */}
      <div className="fixed left-6 top-5 z-30 flex items-center gap-2 text-lg font-bold tracking-tight">
        <span className="rounded-md bg-[#d4562a] px-2 py-0.5 font-mono text-sm">{"</>"}</span> Code Quest
      </div>
      <Link to="/signup" className="fixed right-6 top-5 z-30 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold backdrop-blur-md ring-1 ring-white/25 transition hover:bg-[#d4562a] hover:ring-[#d4562a]">
        Get Started →
      </Link>

      {/* overlays */}
      <div className="pointer-events-none fixed inset-0 z-20">
        {/* HERO */}
        <section ref={set("hero")} className="absolute inset-0 flex flex-col items-start justify-center px-8 md:px-20">
          <p className="mb-3 text-sm uppercase tracking-[0.3em] text-white/70 md:text-base">Master Programming with Code Quest</p>
          <h1 className="max-w-2xl text-5xl font-bold leading-[1.02] md:text-7xl">
            Bored of Theory?
            <br />
            <span className="text-[#ff7a45]">Let's Code for Real</span>
          </h1>
          <div className="pointer-events-auto mt-9 flex gap-4">
            <Link to="/signup" className="rounded-full bg-[#d4562a] px-8 py-3 font-semibold shadow-[0_10px_40px_-10px_#d4562a] transition hover:scale-105">Sign Up</Link>
            <button onClick={() => window.scrollTo({ top: window.innerHeight * 3, behavior: "smooth" })} className="rounded-full border border-white/40 px-8 py-3 font-semibold backdrop-blur-sm transition hover:bg-white/10">Explore</button>
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-xs uppercase tracking-[0.3em] text-white/60">Scroll ↓</div>
        </section>

        {/* DIARY caption */}
        <section ref={set("diary")} className="invisible absolute bottom-10 left-0 right-0 flex flex-col items-center text-center opacity-0">
          <p className="text-xs uppercase tracking-[0.35em] text-[#ff7a45]">What you get</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Flip through the quest log</h2>
          <p className="mt-1 text-white/60">Keep scrolling to turn the pages</p>
        </section>

        {/* NOTES caption */}
        <section ref={set("notes")} className="invisible absolute bottom-10 left-0 right-0 flex flex-col items-center text-center opacity-0">
          <p className="text-xs uppercase tracking-[0.35em] text-[#ff7a45]">Wall of love</p>
          <h2 className="mt-2 text-3xl font-bold md:text-4xl">Notes from fellow questers</h2>
        </section>

        {/* COMPANIES */}
        <section ref={set("companies")} className="invisible absolute inset-x-0 bottom-14 flex flex-col items-center px-6 text-center opacity-0">
          <p className="text-xs uppercase tracking-[0.35em] text-[#ff7a45]">Somewhere, right now, someone is getting hired</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">Companies we work with</h2>
          <div className="mt-8 flex max-w-4xl flex-wrap justify-center gap-3">
            {COMPANIES.map((c) => (
              <span key={c} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-lg font-semibold backdrop-blur-md">{c}</span>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section ref={set("cta")} className="invisible absolute inset-0 flex flex-col items-center justify-center px-6 text-center opacity-0">
          <p className="text-xs uppercase tracking-[0.35em] text-white/60">The night is young</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Every legend started with a single line of code.
            <br />
            <span className="text-[#ff7a45]">Write yours tonight.</span>
          </h2>
          <Link to="/signup" className="pointer-events-auto mt-10 rounded-full bg-[#d4562a] px-10 py-4 text-lg font-semibold shadow-[0_10px_60px_-10px_#d4562a] transition hover:scale-105">
            Start your quest →
          </Link>
        </section>
      </div>

      {/* scroll spacer drives the whole film */}
      <div ref={scrollRef} style={{ height: "1600vh" }} />
    </div>
  );
}