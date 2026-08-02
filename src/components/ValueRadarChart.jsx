import React from 'react';
import { VALUES_LIST } from '../data/domains';

export default function ValueRadarChart({ valueRatings = {}, size = 260 }) {
  const center = size / 2;
  const radius = center - 35; // margin for text
  const totalAxes = VALUES_LIST.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Compute point coordinates for a score (0 to 100)
  const getCoordinates = (index, score) => {
    const angle = index * angleStep - Math.PI / 2; // start from top
    const r = (score / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate grid circles (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Polygon points string
  const polygonPoints = VALUES_LIST.map((v, i) => {
    const valObj = valueRatings[v.key] || { score: 50 };
    const { x, y } = getCoordinates(i, valObj.score);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg width={size} height={size} className="overflow-visible">
        {/* Background Grid Circles */}
        {gridLevels.map((lvl, idx) => (
          <circle
            key={idx}
            cx={center}
            cy={center}
            r={radius * lvl}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeDasharray={idx === 3 ? "none" : "3,3"}
            strokeWidth="1"
          />
        ))}

        {/* Radar Axes Lines */}
        {VALUES_LIST.map((v, i) => {
          const { x, y } = getCoordinates(i, 100);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon Fill & Stroke */}
        <polygon
          points={polygonPoints}
          fill="rgba(59, 130, 246, 0.25)"
          stroke="#3b82f6"
          strokeWidth="2.5"
          className="transition-all duration-500 ease-out"
        />

        {/* Data Points */}
        {VALUES_LIST.map((v, i) => {
          const valObj = valueRatings[v.key] || { score: 50 };
          const { x, y } = getCoordinates(i, valObj.score);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="4"
              fill="#06b6d4"
              stroke="#ffffff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Axis Labels */}
        {VALUES_LIST.map((v, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const labelR = radius + 18;
          const lx = center + labelR * Math.cos(angle);
          const ly = center + labelR * Math.sin(angle);

          let anchor = "middle";
          if (Math.cos(angle) > 0.3) anchor = "start";
          if (Math.cos(angle) < -0.3) anchor = "end";

          return (
            <text
              key={i}
              x={lx}
              y={ly + 4}
              textAnchor={anchor}
              fill="#94a3b8"
              fontSize="9"
              fontWeight="600"
              fontFamily="Heebo, sans-serif"
            >
              {v.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
