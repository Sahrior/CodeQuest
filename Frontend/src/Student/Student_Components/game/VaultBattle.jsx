import { useEffect, useRef } from "react";
import { HEIGHT, WIDTH, createScene, drawScene, setPreview, startScript, updateScene } from "./vaultBattleEngine";

export default function VaultBattle({ turns, runId, speed, preview, onAttempt, onResolved, onFinish }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const speedRef = useRef(speed);
  const handlersRef = useRef({ onAttempt, onResolved, onFinish });

  useEffect(() => {
    speedRef.current = speed;
    handlersRef.current = { onAttempt, onResolved, onFinish };
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;

    canvas.width = WIDTH * ratio;
    canvas.height = HEIGHT * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const scene = createScene();
    sceneRef.current = scene;

    let last = performance.now();
    let frameId = 0;

    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      updateScene(scene, dt * speedRef.current);

      scene.events.splice(0).forEach((event) => {
        const handlers = handlersRef.current;
        if (event.type === "attempt" && handlers.onAttempt) handlers.onAttempt(event.index);
        if (event.type === "resolved" && handlers.onResolved) handlers.onResolved(event.index, event.alarm);
        if (event.type === "finish" && handlers.onFinish) handlers.onFinish(event.passed);
      });

      drawScene(context, scene);
      frameId = requestAnimationFrame(frame);
    };

    frameId = requestAnimationFrame(frame);

    return () => cancelAnimationFrame(frameId);
  }, []);

  const previewKey = preview ? `${preview.min}-${preview.max}` : "none";

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (turns) {
      startScript(scene, turns, preview);
    } else {
      setPreview(scene, preview);
    }
    // preview is tracked through previewKey so a new object with the same values does not restart the scene
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turns, runId, previewKey]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      aria-label="Cyber vault view"
      className="block h-auto w-full rounded-lg bg-[#060913]"
    />
  );
}