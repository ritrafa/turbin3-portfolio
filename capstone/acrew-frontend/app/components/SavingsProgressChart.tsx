'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface SavingsProgressChartProps {
  currentAmount: number;
  targetAmount: number;
}

const SavingsProgressChart: React.FC<SavingsProgressChartProps> = ({ currentAmount, targetAmount }) => {
  const chartRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      const svg = d3.select(chartRef.current);
      const width = 200;
      const height = 200;
      const radius = Math.min(width, height) / 2;

      svg.attr('width', width).attr('height', height);

      const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

      const arc = d3.arc()
        .innerRadius(radius * 0.8)
        .outerRadius(radius);

      const pie = d3.pie()
        .value((d: any) => d.value)
        .sort(null);

      const data = [
        { name: 'Saved', value: currentAmount },
        { name: 'Remaining', value: Math.max(targetAmount - currentAmount, 0) },
      ];

      const path = g.selectAll('path')
        .data(pie(data as any))
        .enter()
        .append('path')
        .attr('d', arc as any)
        .attr('fill', (d: any, i: number) => (i === 0 ? '#4a90e2' : '#f39c12'));

      const text = g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .text(`${Math.round((currentAmount / targetAmount) * 100)}%`);
    }
  }, [currentAmount, targetAmount]);

  return <svg ref={chartRef}></svg>;
};

export default SavingsProgressChart;