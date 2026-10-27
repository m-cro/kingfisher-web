import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useTheme from '../hooks/useTheme';
import { instructorGrades } from '../utils/gradeStats';

const SEASON_ORDER = { 'wi': 1, 'sp': 2, 'su': 3, 'fa': 4 };

function sortOfferings(offerings) {
  return [...offerings].sort((a, b) => {
    const [yearA, seasonA] = a.yearTerm.split('-');
    const [yearB, seasonB] = b.yearTerm.split('-');
    if (yearA !== yearB) return parseInt(yearA) - parseInt(yearB);
    return (SEASON_ORDER[seasonA] || 0) - (SEASON_ORDER[seasonB] || 0);
  });
}

function calcInstructorGpa(offering, instructorId) {
  const gpa = instructorGrades([offering], instructorId)?.gpa;
  return Number.isFinite(gpa) ? parseFloat(gpa.toFixed(2)) : null;
}

function GpaTrendChart({ courseOfferings, selectedInstructorId }) {
  const { theme } = useTheme();

  const isFiltered = selectedInstructorId && selectedInstructorId !== 0;

  const sorted = useMemo(() => sortOfferings(courseOfferings), [courseOfferings]);

  const categories = sorted.map(o => o.yearTerm);

  // Course-wide GPA for every term (always shown)
  const courseGpaData = sorted.map(o =>
    Number.isFinite(o.cumulative?.gpa) ? parseFloat(o.cumulative.gpa.toFixed(2)) : null
  );

  // Instructor-specific GPA (only for terms that instructor taught, null otherwise)
  const instructorGpaData = isFiltered
    ? sorted.map(o => {
        const taught = o.sections?.some(s => s.instructor?.id === selectedInstructorId);
        if (!taught) return null;
        return calcInstructorGpa(o, selectedInstructorId);
      })
    : null;

  const axisLabelColor = theme === 'dark' ? '#ccc' : '#666';
  const splitLineColor = theme === 'dark' ? '#444' : '#eee';

  const makeAreaStyle = (colorHex, opacity) => ({
    color: {
      type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
      colorStops: [
        { offset: 0, color: `${colorHex}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` },
        { offset: 1, color: `${colorHex}00` }
      ]
    }
  });

  const series = [];

  if (isFiltered) {
    // Course-wide as light background series
    series.push({
      name: 'Course Overall',
      type: 'line',
      data: courseGpaData,
      smooth: true,
      symbolSize: 5,
      itemStyle: { color: 'rgba(233,75,38,0.35)' },
      lineStyle: { width: 2, color: 'rgba(233,75,38,0.35)', type: 'dashed' },
      areaStyle: makeAreaStyle('#e94b26', 0.08),
      connectNulls: true,
    });
    // Instructor line as primary, only where they taught
    series.push({
      name: 'Instructor',
      type: 'line',
      data: instructorGpaData,
      smooth: true,
      symbolSize: 8,
      itemStyle: { color: '#13294B' },
      lineStyle: { width: 3, color: '#13294B' },
      areaStyle: makeAreaStyle('#13294B', 0.18),
      connectNulls: false,
    });
  } else {
    // Single series: course average
    series.push({
      name: 'Course Average GPA',
      type: 'line',
      data: courseGpaData,
      smooth: true,
      symbolSize: 8,
      itemStyle: { color: '#e94b26' },
      lineStyle: { width: 3 },
      areaStyle: makeAreaStyle('#e94b26', 0.30),
      connectNulls: true,
    });
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const semester = params[0]?.axisValueLabel ?? params[0]?.name ?? '';
        const lines = params.map(p => `${p.seriesName}: ${p.value !== null ? p.value : 'N/A'}`);
        return [`<strong>${semester}</strong>`, ...lines].join('<br/>');
      }
    },
    legend: isFiltered ? {
      data: ['Course Overall', 'Instructor'],
      textStyle: { color: axisLabelColor, fontSize: 12 },
      top: 0
    } : undefined,
    grid: {
      left: '3%', right: '10%',
      bottom: '3%', top: isFiltered ? '40px' : '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLabel: { color: axisLabelColor, rotate: 45 }
    },
    yAxis: {
      type: 'value',
      min: (value) => Math.max(0, Math.floor(value.min * 10) / 10 || 0),
      max: 4.0,
      axisLabel: { color: axisLabelColor },
      splitLine: { lineStyle: { color: splitLineColor } }
    },
    series,
    animation: false
  };

  return (
    <div className="GpaTrendChart">
      <ReactECharts
        option={option}
        notMerge
        style={{ height: '350px', width: '100%' }}
        theme={theme === 'dark' ? 'dark' : undefined}
      />
    </div>
  );
}

export default GpaTrendChart;
