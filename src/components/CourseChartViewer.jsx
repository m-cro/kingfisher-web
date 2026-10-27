import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import useTheme from '../hooks/useTheme';
import { instructorGrades } from '../utils/gradeStats';

const GRADE_KEYS = ['aPlus', 'a', 'aMinus', 'bPlus', 'b', 'bMinus', 'cPlus', 'c', 'cMinus', 'dPlus', 'd', 'dMinus', 'f'];
const GRADE_LABELS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

function toPercent(grades) {
  const total = GRADE_KEYS.reduce((s, k) => s + (grades[k] || 0), 0);
  if (!total) return GRADE_KEYS.map(() => 0);
  return GRADE_KEYS.map(k => parseFloat(((grades[k] || 0) / total * 100).toFixed(1)));
}

function CourseChartViewer({ gradesData, selectedTermId, selectedInstructorId }) {
  const { theme } = useTheme();
  const cumulativeGrades = gradesData?.cumulative;
  const courseOfferings = useMemo(() => gradesData?.courseOfferings ?? [], [gradesData]);

  const isFiltered = selectedTermId !== 0 || selectedInstructorId !== 0;

  const filteredGrades = useMemo(() => {
    if (!isFiltered) return null;

    if (selectedTermId !== 0 && selectedInstructorId === 0) {
      const offering = courseOfferings.find(o => o.termId === selectedTermId);
      return offering?.cumulative ?? null;
    }

    return instructorGrades(courseOfferings, selectedInstructorId, selectedTermId);
  }, [selectedTermId, selectedInstructorId, courseOfferings, isFiltered]);

  const axisColor = theme === 'dark' ? '#eee' : '#333';

  const series = [];

  if (isFiltered && filteredGrades) {
    // Show both: course-wide (semi-transparent) and filtered (solid)
    series.push({
      name: 'Course Overall',
      type: 'bar',
      data: cumulativeGrades ? toPercent(cumulativeGrades) : [],
      itemStyle: { color: 'rgba(233,75,38,0.25)', borderColor: 'rgba(233,75,38,0.5)', borderWidth: 1 },
      barGap: '0%',
    });
    series.push({
      name: 'Selection',
      type: 'bar',
      data: toPercent(filteredGrades),
      itemStyle: { color: '#e94b26' },
      barGap: '0%',
    });
  } else {
    series.push({
      name: 'Count',
      type: 'bar',
      data: cumulativeGrades ? toPercent(cumulativeGrades) : [],
      itemStyle: { color: '#e94b26' },
    });
  }

  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const gradeLabel = params[0]?.axisValueLabel ?? params[0]?.name ?? '';
        if (params.length > 1) {
          const lines = params.map(p => `${p.seriesName}: ${p.value}%`);
          return [`<strong>${gradeLabel}</strong>`, ...lines].join('<br/>');
        }
        return `${gradeLabel}: ${params[0]?.value}%`;
      }
    },
    legend: series.length > 1 ? {
      data: ['Course Overall', 'Selection'],
      textStyle: { color: axisColor, fontSize: 12 },
      top: 0
    } : undefined,
    grid: {
      left: '3%', right: '4%',
      bottom: '3%', top: isFiltered ? '40px' : '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: GRADE_LABELS,
      axisLabel: { color: axisColor }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: axisColor, formatter: '{value}%' },
      max: 100
    },
    series,
    animation: false
  };

  const displayGrades = isFiltered ? filteredGrades : cumulativeGrades;
  const averageGrades = selectedTermId === 0 ? cumulativeGrades
    : courseOfferings.find(offering => offering.termId === selectedTermId)?.cumulative;
  const formatGpa = value => Number.isFinite(value) ? value.toFixed(2) : 'N/A';

  return (
    <div className="CourseChartViewer">
      <div className="chart-container">
        <ReactECharts
          option={option}
          notMerge
          style={{ height: '350px', width: '100%' }}
          theme={theme === 'dark' ? 'dark' : undefined}
        />
      </div>

      {cumulativeGrades && (
        <div className="grade-summary" aria-live="polite" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem 1.5rem', marginTop: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          <span>Total Grades: <strong style={{ color: 'var(--text-primary)' }}>{(displayGrades?.total ?? 0).toLocaleString()}</strong></span>
          <span title="Course average for the selected semester, or all semesters when none is selected">Average GPA: <strong style={{ color: '#e94b26' }}>{formatGpa(averageGrades?.gpa)}</strong></span>
          {selectedInstructorId !== 0 && <span title="Selected instructor’s GPA for this course and semester selection">Instructor GPA: <strong style={{ color: '#e94b26' }}>{formatGpa(filteredGrades?.gpa)}</strong></span>}
        </div>
      )}
    </div>
  );
}

export default CourseChartViewer;
