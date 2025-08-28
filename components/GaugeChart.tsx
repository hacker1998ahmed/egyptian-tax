import React from 'react';

interface GaugeChartProps {
  value: number; // User's value (e.g., 0.15 for 15%)
  benchmark: number; // Benchmark value (e.g., 0.12 for 12%)
  label: string;
}

const GaugeChart: React.FC<GaugeChartProps> = ({ value, benchmark, label }) => {
  const max = Math.max(value, benchmark, 0) * 1.5 || 0.5; // Set a dynamic max or a default
  
  // Function to convert a percentage value to an angle in degrees (-90 to 90)
  const valueToAngle = (val: number) => {
    const percentage = Math.max(0, Math.min(1, val / max));
    return percentage * 180 - 90;
  };
  
  const needleAngle = valueToAngle(value);
  const benchmarkAngle = valueToAngle(benchmark);

  const angleToCoords = (angle: number) => {
      const radians = (angle * Math.PI) / 180;
      const x = 50 + 40 * Math.cos(radians);
      const y = 50 + 40 * Math.sin(radians);
      return {x, y};
  }
  
  const benchmarkPos = angleToCoords(benchmarkAngle);

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 100 60" className="w-full max-w-xs">
        {/* Arc background */}
        <path d="M10 50 A 40 40 0 0 1 90 50" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="10" fill="none" />
        
        {/* Color-coded arc sections */}
        <path d="M10 50 A 40 40 0 0 1 30 18" stroke="currentColor" className="text-red-500" strokeWidth="10" fill="none" />
        <path d="M30 18 A 40 40 0 0 1 70 18" stroke="currentColor" className="text-yellow-500" strokeWidth="10" fill="none" />
        <path d="M70 18 A 40 40 0 0 1 90 50" stroke="currentColor" className="text-green-500" strokeWidth="10" fill="none" />
        
        {/* Benchmark marker */}
        <g transform={`translate(${benchmarkPos.x} ${benchmarkPos.y})`}>
             <path d="M0 -5 L 5 0 L 0 5 L -5 0 Z" fill="currentColor" className="text-cyan-500 dark:text-cyan-400" />
        </g>

        {/* Needle */}
        <g transform={`rotate(${needleAngle} 50 50)`}>
          <path d="M 50 50 L 50 15" stroke="currentColor" className="text-gray-800 dark:text-white" strokeWidth="2" />
          <circle cx="50" cy="50" r="4" fill="currentColor" className="text-gray-800 dark:text-white" />
        </g>
        
        {/* Center Text */}
        <text x="50" y="45" textAnchor="middle" className="font-bold text-2xl fill-current text-gray-800 dark:text-white">
          {(value * 100).toFixed(1)}%
        </text>
      </svg>
      <p className="text-center font-semibold mt-2 text-cyan-800 dark:text-cyan-300">{label}</p>
    </div>
  );
};

export default GaugeChart;