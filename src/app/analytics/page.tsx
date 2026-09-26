"use client";
import { useAnalytics } from '@/hooks/useAnalytics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RadarChart = ({ data }: { data: any }) => {
  const size = 200;
  const center = size / 2;
  const maxRadius = size / 2 - 20;

  const clamp = (val: any) => Math.min(100, Math.max(0, Number(val) || 0));

  const points = [
    { label: 'Consistency', value: clamp(data.consistency), angle: -Math.PI / 2 },
    { label: 'Accuracy', value: clamp(data.accuracy), angle: 0 },
    { label: 'Speed', value: clamp(data.speed), angle: Math.PI / 2 },
    { label: 'Homework', value: clamp(data.homework), angle: Math.PI }
  ];

  const getCoordinates = (value: number, angle: number) => {
    const radius = (value / 100) * maxRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  const pts = points.map(p => getCoordinates(p.value, p.angle));
  
  // Clean SVG curves (Catmull-Rom spline)
  const k = 0.2;
  const len = pts.length;
  let pathD = `M ${pts[0].x} ${pts[0].y} `;
  for (let i = 0; i < len; i++) {
    const p0 = pts[(i - 1 + len) % len];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % len];
    const p3 = pts[(i + 2) % len];
    
    const cp1x = p1.x + (p2.x - p0.x) * k;
    const cp1y = p1.y + (p2.y - p0.y) * k;
    const cp2x = p2.x - (p3.x - p1.x) * k;
    const cp2y = p2.y - (p3.y - p1.y) * k;
    
    pathD += `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y} `;
  }
  pathD += "Z";

  const axisLines = points.map((p, i) => {
    const { x, y } = getCoordinates(100, p.angle);
    return (
      <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
    );
  });

  const labels = points.map((p, i) => {
    const { x, y } = getCoordinates(120, p.angle);
    return (
      <text key={i} x={x} y={y} fontSize="10" fill="#64748b" textAnchor="middle" dominantBaseline="middle">
        {p.label}
      </text>
    );
  });

  const gridRadii = [25, 50, 75, 100];
  const gridPolygons = gridRadii.map((r, i) => {
    const rPts = points.map(p => {
      const { x, y } = getCoordinates(r, p.angle);
      return `${x},${y}`;
    }).join(' ');
    return <polygon key={i} points={rPts} fill="none" stroke="#f1f5f9" strokeWidth="1" />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {gridPolygons}
      {axisLines}
      <path d={pathD} fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="2" />
      {labels}
    </svg>
  );
};

export default function AnalyticsPage() {
  const { analytics } = useAnalytics();

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Performance Analytics</h1>
      <Card className="shadow-soft">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-4">Performance Radar Charts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {analytics.map(a => (
              <div key={a.studentId} className="flex flex-col items-center p-6 border rounded-xl bg-white shadow-sm">
                <div className="w-full flex justify-between items-start mb-4">
                  <div>
                    <div className="font-bold text-lg">{a.studentId}</div>
                    <div className="text-sm text-slate-500">Attendance: {a.attendance}%</div>
                  </div>
                  {a.atRisk && <Badge variant="destructive" className="animate-pulse">At-Risk Warning</Badge>}
                </div>
                <div className="mt-4 mb-4">
                  <RadarChart data={a} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
