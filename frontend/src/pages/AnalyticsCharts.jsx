import PropTypes from "prop-types";
import styled from "styled-components";

const ChartWrap = styled.div`
  width: 100%;
  height: 250px;
`;

const LineSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

const BarRow = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 200px;
  padding: 8px 0;
`;

const BarSeg = styled.div`
  flex: 1;
  min-width: 8px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  height: 100%;
`;

const BarStack = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  height: ${(p) => p.$pct}%;
  min-height: 4px;
`;

const BarFill = styled.div`
  flex: ${(p) => p.$flex};
  background: ${(p) => p.$color};
  min-height: 2px;
`;

const PieSvg = styled.svg`
  display: block;
  margin: 0 auto;
`;

function SuccessRateLineChart({ data }) {
  if (!data.length) {
    return null;
  }
  const w = 400;
  const h = 220;
  const pad = 24;
  const maxY = 100;
  const xs = data.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(1, data.length - 1));
  const ys = data.map((d) => h - pad - (d.successRate / maxY) * (h - 2 * pad));
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  return (
    <ChartWrap>
      <LineSvg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="Success rate over time">
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={points} />
        {data.map((d, i) => (
          <circle key={d.date} cx={xs[i]} cy={ys[i]} r="3" fill="#10b981" />
        ))}
      </LineSvg>
    </ChartWrap>
  );
}

SuccessRateLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      successRate: PropTypes.number,
    }),
  ).isRequired,
};

function AverageDurationLineChart({ data }) {
  if (!data.length) {
    return null;
  }
  const w = 400;
  const h = 220;
  const pad = 24;
  const maxV = Math.max(1, ...data.map((d) => d.avgDuration || 0));
  const xs = data.map((_, i) => pad + (i * (w - 2 * pad)) / Math.max(1, data.length - 1));
  const ys = data.map((d) => h - pad - ((d.avgDuration || 0) / maxV) * (h - 2 * pad));
  const points = xs.map((x, i) => `${x},${ys[i]}`).join(" ");
  return (
    <ChartWrap>
      <LineSvg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label="Average duration over time">
        <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points} />
        {data.map((d, i) => (
          <circle key={d.date} cx={xs[i]} cy={ys[i]} r="3" fill="#3b82f6" />
        ))}
      </LineSvg>
    </ChartWrap>
  );
}

AverageDurationLineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      avgDuration: PropTypes.number,
    }),
  ).isRequired,
};

const PIE_COLORS = {
  completed: "#10b981",
  failed: "#ef4444",
  running: "#3b82f6",
  pending: "#f59e0b",
  cancelled: "#6b7280",
};

function StatusPieChart({ data }) {
  if (!data.length) {
    return null;
  }
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const segs = data.map((d) => {
    const start = acc;
    const frac = d.value / total;
    acc += frac;
    return { ...d, start, frac };
  });
  const r = 70;
  const cx = 90;
  const cy = 90;
  const polarToCartesian = (angle) => ({
    x: cx + r * Math.cos(angle * Math.PI * 2 - Math.PI / 2),
    y: cy + r * Math.sin(angle * Math.PI * 2 - Math.PI / 2),
  });
  return (
    <ChartWrap>
      <PieSvg width={180} height={180} viewBox="0 0 180 180" aria-label="Status distribution">
        {segs.map((s, i) => {
          if (s.frac <= 0) {
            return null;
          }
          const a1 = s.start;
          const a2 = s.start + s.frac;
          const p1 = polarToCartesian(a1);
          const p2 = polarToCartesian(a2);
          const large = a2 - a1 > 0.5 ? 1 : 0;
          const fill = PIE_COLORS[s.name.toLowerCase()] || "#8884d8";
          const d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} Z`;
          return <path key={`${s.name}-${i}`} d={d} fill={fill} stroke="#fff" strokeWidth="1" />;
        })}
      </PieSvg>
    </ChartWrap>
  );
}

StatusPieChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      value: PropTypes.number,
    }),
  ).isRequired,
};

function ExecutionsBarChart({ data }) {
  if (!data.length) {
    return null;
  }
  const maxTotal = Math.max(1, ...data.map((d) => d.total || 0));
  return (
    <ChartWrap>
      <BarRow>
        {data.map((d) => {
          const pct = ((d.total || 0) / maxTotal) * 100;
          const completedPct = d.total ? ((d.completed || 0) / d.total) * 100 : 0;
          const failedPct = d.total ? ((d.failed || 0) / d.total) * 100 : 0;
          return (
            <BarSeg key={d.date} title={d.date}>
              <BarStack $pct={pct}>
                <BarFill $flex={completedPct || 0.001} $color="#10b981" />
                <BarFill $flex={failedPct || 0.001} $color="#ef4444" />
              </BarStack>
            </BarSeg>
          );
        })}
      </BarRow>
    </ChartWrap>
  );
}

ExecutionsBarChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      date: PropTypes.string,
      completed: PropTypes.number,
      failed: PropTypes.number,
      total: PropTypes.number,
    }),
  ).isRequired,
};

export { SuccessRateLineChart, AverageDurationLineChart, StatusPieChart, ExecutionsBarChart };
