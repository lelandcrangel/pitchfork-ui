import {
  RADAR_MINIMUM_AXES,
  pointsToAttribute,
  polarPoint,
  radarAxisAngles,
  radarGridPolygons,
  radarMax,
  radarValuePoints,
  usableRadarAxes,
} from '@pitchfork-ui/core';
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
  /*
   * All of the trigonometry is core's, so `<pf-radar-chart>` puts the same
   * numbers in the same places — the grid rings and the value polygon only
   * line up if both were built from the same centre, radius and angles.
   */
  const safeData = usableRadarAxes(data);
  const count = safeData.length;
  const safeSize = Math.max(size, 180);

  if (count < RADAR_MINIMUM_AXES) {
    return (
      <div ref={ref} className={cx('pf-radar-chart', className)} {...props}>
        <div className="pf-radar-chart__empty">RadarChart needs at least 3 data points.</div>
      </div>
    );
  }

  const center = safeSize / 2;
  const outerRadius = center - 36;
  const safeMax = radarMax(safeData, max);

  const angles = radarAxisAngles(count);
  const axes = safeData.map((item, index) => ({
    item,
    angle: angles[index],
    end: polarPoint(center, outerRadius, angles[index]),
  }));

  const gridPolygons = radarGridPolygons(angles, center, outerRadius, levels);
  const valuePoints = radarValuePoints(
    safeData.map((item) => item.value),
    safeMax,
    angles,
    center,
    outerRadius,
  );
  const valuePolygon = pointsToAttribute(valuePoints);

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
          const labelPoint = polarPoint(center, outerRadius + 18, axis.angle);

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
