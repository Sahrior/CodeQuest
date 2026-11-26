import { useId } from "react";
import { fmt } from "./graphAlgos";

const R = 22;

const NODE_KINDS = {
  default: { fill: "#1b2547", stroke: "#3d4d82", text: "#e2e8f0" },
  start: { fill: "#9a3412", stroke: "#fb923c", text: "#fff7ed" },
  current: { fill: "#b45309", stroke: "#fde68a", text: "#fffbeb" },
  stack: { fill: "#0e7490", stroke: "#67e8f9", text: "#ecfeff" },
  visited: { fill: "#202842", stroke: "#475569", text: "#94a3b8" },
  queued: { fill: "#075985", stroke: "#38bdf8", text: "#f0f9ff" },
  done: { fill: "#065f46", stroke: "#34d399", text: "#ecfdf5" },
  danger: { fill: "#7f1d1d", stroke: "#f87171", text: "#fef2f2" },
  selected: { fill: "#155e75", stroke: "#22d3ee", text: "#ecfeff" },
};

const EDGE_KINDS = {
  default: { stroke: "#3d4d82", width: 2 },
  dim: { stroke: "#26315a", width: 1.5 },
  path: { stroke: "#34d399", width: 4.5 },
  active: { stroke: "#fbbf24", width: 4 },
  relaxed: { stroke: "#22d3ee", width: 3 },
  danger: { stroke: "#f87171", width: 3.5 },
};

const STARS = [
  [20, 24], [96, 340], [150, 12], [262, 360], [330, 18], [384, 330], [470, 14], [575, 40],
  [585, 350], [40, 250], [510, 360], [220, 15], [350, 372], [20, 150], [580, 200],
];

export default function GalaxyMap({
  graph,
  nodeKinds = {},
  nodeSubs = {},
  nodeTags = {},
  edgeKinds = {},
  showWeights = false,
  onNodeClick,
  pulse = [],
}) {
  const markerId = useId().replace(/:/g, "");
  const byId = Object.fromEntries(graph.nodes.map((node) => [node.id, node]));
  const hasReverse = (edge) => graph.directed && graph.edges.some((o) => o.from === edge.to && o.to === edge.from);

  const edgeKind = (edge) =>
    edgeKinds[`${edge.from}>${edge.to}`] || (!graph.directed && edgeKinds[`${edge.to}>${edge.from}`]) || "default";

  return (
    <svg viewBox="0 0 600 380" className="block h-auto w-full rounded-lg bg-[#060913]" role="img" aria-label="Galaxy map">
      <defs>
        <radialGradient id={`${markerId}glow`} cx="0.5" cy="0.5" r="0.7">
          <stop offset="0" stopColor="#1e3a8a" stopOpacity="0.28" />
          <stop offset="1" stopColor="#060913" stopOpacity="0" />
        </radialGradient>
        {Object.entries(EDGE_KINDS).map(([kind, style]) => (
          <marker
            key={kind}
            id={`${markerId}${kind}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 5 L0 10 z" fill={style.stroke} />
          </marker>
        ))}
      </defs>

      <rect width="600" height="380" fill={`url(#${markerId}glow)`} />

      {STARS.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="2" height="2" fill="#fed7aa" opacity="0.5" />
      ))}

      {graph.edges.map((edge) => {
        const a = byId[edge.from];
        const b = byId[edge.to];
        const kind = edgeKind(edge);
        const style = EDGE_KINDS[kind];

        let dx = b.x - a.x;
        let dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        dx /= len;
        dy /= len;

        const bend = hasReverse(edge) ? 9 : 0;
        const ox = -dy * bend;
        const oy = dx * bend;
        const x1 = a.x + dx * (R + 2) + ox;
        const y1 = a.y + dy * (R + 2) + oy;
        const x2 = b.x - dx * (R + (graph.directed ? 7 : 2)) + ox;
        const y2 = b.y - dy * (R + (graph.directed ? 7 : 2)) + oy;

        const mx = (a.x + b.x) / 2 + ox;
        const my = (a.y + b.y) / 2 + oy;
        const label = String(edge.w);
        const negative = edge.w < 0;

        return (
          <g key={`${edge.from}>${edge.to}`}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={style.stroke}
              strokeWidth={style.width}
              strokeLinecap="round"
              markerEnd={graph.directed ? `url(#${markerId}${kind})` : undefined}
            />
            {showWeights && (
              <g>
                <rect
                  x={mx - 14}
                  y={my - 10}
                  width="28"
                  height="20"
                  rx="6"
                  fill="#0b1226"
                  stroke={negative ? "#34d399" : "#475569"}
                />
                <text
                  x={mx}
                  y={my + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="12"
                  fontWeight="700"
                  fontFamily="monospace"
                  fill={negative ? "#6ee7b7" : "#fdba74"}
                >
                  {label}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {graph.nodes.map((node) => {
        const style = NODE_KINDS[nodeKinds[node.id] || "default"];
        const sub = nodeSubs[node.id];
        const tag = nodeTags[node.id];
        const clickable = Boolean(onNodeClick);

        return (
          <g
            key={node.id}
            onClick={clickable ? () => onNodeClick(node.id) : undefined}
            style={{ cursor: clickable ? "pointer" : "default" }}
          >
            {pulse.includes(node.id) && (
              <circle cx={node.x} cy={node.y} r={R + 5} fill="none" stroke="#22d3ee" strokeWidth="3" opacity="0.8">
                <animate attributeName="r" from={R + 3} to={R + 16} dur="0.9s" repeatCount="2" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.9s" repeatCount="2" />
              </circle>
            )}
            <circle cx={node.x} cy={node.y} r={R} fill={style.fill} stroke={style.stroke} strokeWidth="3" />
            <ellipse cx={node.x - 7} cy={node.y - 9} rx="8" ry="4" fill="#fff" opacity="0.1" />
            <text
              x={node.x}
              y={node.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="17"
              fontWeight="800"
              fontFamily="monospace"
              fill={style.text}
            >
              {node.id}
            </text>

            {sub && (
              <g>
                <rect x={node.x - 22} y={node.y + R + 4} width="44" height="17" rx="5" fill="#0b1226" opacity="0.92" />
                <text
                  x={node.x}
                  y={node.y + R + 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="700"
                  fontFamily="monospace"
                  fill={sub.color || "#67e8f9"}
                >
                  {sub.text}
                </text>
              </g>
            )}

            {tag && (
              <g>
                <rect x={node.x - 20} y={node.y - R - 21} width="40" height="15" rx="4" fill={tag.color} />
                <text
                  x={node.x}
                  y={node.y - R - 13}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontWeight="800"
                  fontFamily="monospace"
                  fill="#0b1226"
                >
                  {tag.text}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export const distSub = (value, color) => ({ text: fmt(value), color: color || (value === Infinity ? "#64748b" : "#67e8f9") });
