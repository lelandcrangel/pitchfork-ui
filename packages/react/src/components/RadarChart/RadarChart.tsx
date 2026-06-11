import { forwardRef } from 'react';
import { cx } from '../../utils/cx';
import './RadarChart.css';

export interface RadarChartDatum {
  label: React.ReactNode;
  value: number;
}

export interface RadarChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: RadarChartDatum[];
  size?: number;
  max?: number;
  levels?: number;
  showAxes?: boolean;
  showLegend?: boolean;
  strokeColor?: string;
  fillColor?: string;
}

function polarToCartesian(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

function toPointsString(points: Array<{ x: number; y: number }>): string {
  return points.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

export const RadarChart = forwardRef<HTMLDivElement, RadarChartProps>(function RadarChart(
  {
    className,
    data,
    size = 280,
    max,
    levels = 4,
    showAxes = true,
    showLegend = true,
    strokeColor = 'var(--pf-radar-stroke)',
    fillColor = 'var(--pf-radar-fill)',
    ...props
  },
  ref,
) {
  const safeData = data.filter((item) => item.value >= 0);
  const count = safeData.length;
  const safeSize = Math.max(size, 180);
  const safeLevels = Math.max(2, levels);

  if (count < 3) {
    return (
      <div ref={ref} className={cx('pf-radar-chart', className)} {...props}>
        <div className="pf-radar-chart__empty">RadarChart needs at least 3 data points.</div>
      </div>
    );
  }

  const center = safeSize / 2;
  const outerRadius = center - 36;
  const computedMax = max ?? Math.max(...safeData.map((item) => item.value), 1);
  const safeMax = computedMax > 0 ? computedMax : 1;

  const baseAngle = -Math.PI / 2;
  const angleStep = (2 * Math.PI) / count;

  const axes = safeData.map((item, index) => {
    const angle = baseAngle + index * angleStep;
    const end = polarToCartesian(center, center, outerRadius, angle);

    return {
      item,
      angle,
      end,
    };
  });

  const gridPolygons = Array.from({ length: safeLevels }, (_, levelIndex) => {
    const ratio = (levelIndex + 1) / safeLevels;

    const points = axes.map((axis) =>
      polarToCartesian(center, center, outerRadius * ratio, axis.angle),
    );

    return toPointsString(points);
  });

  const valuePoints = axes.map((axis) => {
    const ratio = Math.max(0, Math.min(1, axis.item.value / safeMax));

    return polarToCartesian(center, center, outerRadius * ratio, axis.angle);
  });

  const valuePolygon = toPointsString(valuePoints);

  return (
    <div ref={ref} className={cx('pf-radar-chart', className)} {...props}>
      <svg
        className="pf-radar-chart__svg"
        viewBox={`0 0 ${safeSize} ${safeSize}`}
        role="img"
        aria-label="Radar chart"
      >
        {gridPolygons.map((points, index) => (
          <polygon key={`grid-${index}`} className="pf-radar-chart__grid" points={points} />
        ))}

        {showAxes
          ? axes.map((axis, index) => (
              <line
                key={`axis-${index}`}
                className="pf-radar-chart__axis"
                x1={center}
                y1={center}
                x2={axis.end.x}
                y2={axis.end.y}
              />
            ))
          : null}

        <g
          className="pf-radar-chart__value"
          style={
            {
              transformBox: 'view-box',
              transformOrigin: `${center}px ${center}px`,
            } as React.CSSProperties
          }
        >
          <polygon
            className="pf-radar-chart__area"
            points={valuePolygon}
            style={{ fill: fillColor, stroke: strokeColor }}
          />

          {valuePoints.map((point, index) => (
            <circle
              key={`point-${index}`}
              className="pf-radar-chart__point"
              cx={point.x}
              cy={point.y}
              r={3}
              style={{ fill: strokeColor }}
            />
          ))}
        </g>

        {axes.map((axis, index) => {
          const labelPoint = polarToCartesian(center, center, outerRadius + 18, axis.angle);

          return (
            <text
              key={`label-${index}`}
              className="pf-radar-chart__label"
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {axis.item.label}
            </text>
          );
        })}
      </svg>

      {showLegend ? (
        <ul className="pf-radar-chart__legend">
          {safeData.map((item, index) => (
            <li className="pf-radar-chart__legend-item" key={`${index}-${item.value}`}>
              <span className="pf-radar-chart__legend-label">{item.label}</span>
              <span className="pf-radar-chart__legend-value">{item.value}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
});

RadarChart.displayName = 'RadarChart';
