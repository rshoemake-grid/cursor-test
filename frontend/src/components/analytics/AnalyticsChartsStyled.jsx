import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Lightweight charts using styled-components (recharts removed).
 */ import styled from 'styled-components';
const ChartArea = styled.div`
  height: 250px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
const Row = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 200px;
  padding: 0 4px;
`;
const DayColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
`;
const ValueBar = styled.div`
  width: 100%;
  min-height: 2px;
  height: ${(p)=>Math.max(p.$pct, 2)}%;
  background: ${(p)=>p.$color};
  border-radius: 4px 4px 0 0;
`;
const DayLabel = styled.span`
  font-size: 11px;
  color: #6b7280;
  margin-top: 6px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const LineSvg = styled.svg`
  width: 100%;
  height: 200px;
`;
const PieWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 200px;
`;
const PieLegend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
`;
const LegendSwatch = styled.span`
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: ${(p)=>p.$color};
  margin-right: 8px;
`;
const StackedRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  height: 200px;
  justify-content: flex-end;
`;
const StackLayer = styled.div`
  width: 100%;
  height: ${(p)=>Math.max(p.$h, 2)}px;
  background: ${(p)=>p.$color};
  border-radius: 2px;
`;
export function SuccessRateBars({ data }) {
    if (!data.length) return null;
    return /*#__PURE__*/ _jsx(ChartArea, {
        children: /*#__PURE__*/ _jsx(Row, {
            children: data.map((d)=>/*#__PURE__*/ _jsxs(DayColumn, {
                    children: [
                        /*#__PURE__*/ _jsx(ValueBar, {
                            $color: "#10b981",
                            $pct: d.successRate
                        }),
                        /*#__PURE__*/ _jsx(DayLabel, {
                            title: d.date,
                            children: d.date
                        })
                    ]
                }, d.date))
        })
    });
}
export function AvgDurationBars({ data }) {
    if (!data.length) return null;
    const max = Math.max(...data.map((d)=>d.avgDuration), 1);
    return /*#__PURE__*/ _jsx(ChartArea, {
        children: /*#__PURE__*/ _jsx(Row, {
            children: data.map((d)=>{
                const pct = d.avgDuration / max * 100;
                return /*#__PURE__*/ _jsxs(DayColumn, {
                    children: [
                        /*#__PURE__*/ _jsx(ValueBar, {
                            $color: "#3b82f6",
                            $pct: pct
                        }),
                        /*#__PURE__*/ _jsx(DayLabel, {
                            children: d.date
                        })
                    ]
                }, d.date);
            })
        })
    });
}
export function SuccessRateLine({ data }) {
    if (!data.length) return null;
    const w = 300;
    const h = 200;
    const pts = data.map((d, i)=>{
        const x = i / Math.max(data.length - 1, 1) * w;
        const y = h - d.successRate / 100 * h;
        return `${x},${y}`;
    });
    return /*#__PURE__*/ _jsx(LineSvg, {
        viewBox: `0 0 ${w} ${h}`,
        preserveAspectRatio: "none",
        children: /*#__PURE__*/ _jsx("polyline", {
            fill: "none",
            stroke: "#10b981",
            strokeWidth: "2",
            points: pts.join(' ')
        })
    });
}
export function AvgDurationLine({ data }) {
    if (!data.length) return null;
    const w = 300;
    const h = 200;
    const max = Math.max(...data.map((d)=>d.avgDuration), 1);
    const pts = data.map((d, i)=>{
        const x = i / Math.max(data.length - 1, 1) * w;
        const y = h - d.avgDuration / max * h;
        return `${x},${y}`;
    });
    return /*#__PURE__*/ _jsx(LineSvg, {
        viewBox: `0 0 ${w} ${h}`,
        preserveAspectRatio: "none",
        children: /*#__PURE__*/ _jsx("polyline", {
            fill: "none",
            stroke: "#3b82f6",
            strokeWidth: "2",
            points: pts.join(' ')
        })
    });
}
const COLORS = {
    completed: '#10b981',
    failed: '#ef4444',
    running: '#3b82f6',
    pending: '#f59e0b',
    cancelled: '#6b7280'
};
export function StatusPieLegend({ data }) {
    const total = data.reduce((s, d)=>s + d.value, 0) || 1;
    let angle = 0;
    const segments = data.map((d)=>{
        const key = d.name.toLowerCase();
        const color = COLORS[key] || '#8884d8';
        const sweep = d.value / total * 360;
        const start = angle;
        angle += sweep;
        return `${color} ${start}deg ${angle}deg`;
    });
    const gradient = segments.join(', ');
    return /*#__PURE__*/ _jsxs(PieWrap, {
        children: [
            /*#__PURE__*/ _jsx("div", {
                style: {
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background: `conic-gradient(from 0deg, ${gradient})`
                }
            }),
            /*#__PURE__*/ _jsx(PieLegend, {
                children: data.map((d)=>{
                    const key = d.name.toLowerCase();
                    const color = COLORS[key] || '#8884d8';
                    const pct = (d.value / total * 100).toFixed(0);
                    return /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx(LegendSwatch, {
                                $color: color
                            }),
                            d.name,
                            ": ",
                            d.value,
                            " (",
                            pct,
                            "%)"
                        ]
                    }, d.name);
                })
            })
        ]
    });
}
export function ExecutionsStackedBars({ data }) {
    if (!data.length) return null;
    const max = Math.max(...data.map((d)=>d.total), 1);
    return /*#__PURE__*/ _jsx(ChartArea, {
        children: /*#__PURE__*/ _jsx(Row, {
            children: data.map((d)=>/*#__PURE__*/ _jsxs(DayColumn, {
                    children: [
                        /*#__PURE__*/ _jsxs(StackedRow, {
                            children: [
                                /*#__PURE__*/ _jsx(StackLayer, {
                                    $h: d.completed / max * 180,
                                    $color: "#10b981"
                                }),
                                /*#__PURE__*/ _jsx(StackLayer, {
                                    $h: d.failed / max * 180,
                                    $color: "#ef4444"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx(DayLabel, {
                            children: d.date
                        })
                    ]
                }, d.date))
        })
    });
}
