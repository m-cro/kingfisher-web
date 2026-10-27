import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCourse, getCourseGrades } from '../api';
import GpaTrendChart from '../components/GpaTrendChart';
import CourseChartViewer from '../components/CourseChartViewer';
import CourseDescription from '../components/CourseDescription';
import ScheduledSections from '../components/ScheduledSections';
import { aggregateGrades, gradeGpa } from '../utils/gradeStats';

const FLAT_CARD_STYLE = {
  padding: '1.5rem',
  border: '1px solid var(--border-color)',
  borderRadius: '0.28571429rem',
  backgroundColor: 'var(--bg-card)',
  marginBottom: '1.5rem',
  fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif'
};

const TABLE_STYLES = {
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', border: '1px solid var(--border-color)', borderRadius: '0.28571429rem' },
  th: { padding: '0.92857143em 0.78571429em', fontWeight: '700', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', userSelect: 'none' },
  td: { padding: '0.78571429em', borderTop: '1px solid var(--border-color)', color: 'var(--text-primary)' },
  tdRight: { padding: '0.78571429em', borderTop: '1px solid var(--border-color)', textAlign: 'right', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }
};

// Custom Dropdown Component
function CustomDropdown({ options, value, onChange, placeholder, searchPlaceholder = "Search...", valueKey = "id", labelKey = "name" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedOption = options.find(o => o[valueKey] === value);
  
  // Filter options based on search, but ALWAYS keep the "placeholder/filter" option at the top if it matches or if search is empty
  const filteredOptions = useMemo(() => {
    if (!search) return options;
    const q = search.toLowerCase();
    // Keep the "0" ID option (Filter...) at the top always if it's there
    const first = options.find(o => o[valueKey] === 0);
    const rest = options.filter(o => o[valueKey] !== 0 && o[labelKey].toLowerCase().includes(q));
    return first ? [first, ...rest] : rest;
  }, [options, search, valueKey, labelKey]);

  return (
    <div ref={ref} style={{ flex: 1, position: 'relative', fontFamily: 'Lato, sans-serif' }}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.6em 1em',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          fontSize: '14px',
          color: 'var(--text-primary)',
          backgroundColor: 'var(--bg-card)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '38px',
          boxSizing: 'border-box'
        }}
      >
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          marginTop: '4px', borderRadius: '4px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxHeight: '300px', overflowY: 'auto'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
            <input 
              autoFocus
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: '2px', border: '1px solid var(--border-color)',
                fontSize: '13px', outline: 'none', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)',
                boxSizing: 'border-box'
              }}
            />
          </div>
          {filteredOptions.map((opt, idx) => (
            <div 
              key={opt[valueKey] || idx}
              onClick={() => {
                onChange(opt[valueKey]);
                setIsOpen(false);
                setSearch('');
              }}
              style={{
                padding: '8px 12px', cursor: 'pointer', fontSize: '14px',
                color: opt[valueKey] === value ? '#e94b26' : 'var(--text-primary)',
                fontWeight: opt[valueKey] === value ? '700' : '400',
                backgroundColor: opt[valueKey] === value ? 'var(--bg-secondary)' : 'transparent',
                borderBottom: opt[valueKey] === 0 ? '1px solid var(--border-color)' : 'none'
              }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseOut={e => {
                if (opt[valueKey] !== value) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {opt[labelKey]}
            </div>
          ))}
          {filteredOptions.length === 0 && (
            <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No matches found</div>
          )}
        </div>
      )}
    </div>
  );
}

function Course() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [instructors, setInstructors] = useState([]);
  const [sortCol, setSortCol] = useState('totalStudents');
  const [sortOrder, setSortOrder] = useState('desc');
  const [instructorFilter, setInstructorFilter] = useState('');

  // Lifted state for charts
  const [selectedTermId, setSelectedTermId] = useState(0);
  const [selectedInstructorId, setSelectedInstructorId] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      getCourse(courseId),
      getCourseGrades(courseId)
    ])
    .then(([courseData, gradesData]) => {
      setCourse(courseData);
      setGrades(gradesData);
      document.title = `${courseData.subject?.code || courseData.subject} ${courseData.number} - Kingfisher`;
      
      // Aggregate instructors
      if (gradesData?.courseOfferings) {
        const instructorMap = {};
        gradesData.courseOfferings.forEach(offering => {
          if (offering.sections) {
            offering.sections.forEach(sec => {
              const name = sec.instructor?.name || 'Unknown Instructor';
              if (!instructorMap[name]) {
                instructorMap[name] = { name, distributions: [] };
              }
              const g = sec.grades;
              if (g) instructorMap[name].distributions.push(g);
            });
          }
        });
        const list = Object.values(instructorMap).map(inst => {
          const stats = aggregateGrades(inst.distributions);
          return { name: inst.name, totalStudents: stats.total, gpa: stats.gpa };
        });
        setInstructors(list);
      }
    })
    .catch(err => {
      console.error(err);
      setError('The server is currently unreachable. Please ensure the backend API is running.');
    })
    .finally(() => setLoading(false));
  }, [courseId]);

  // Compute options for chart dropdowns
  const courseOfferings = useMemo(() => grades?.courseOfferings ?? [], [grades]);
  
  const instructorOptions = useMemo(() => {
    const map = new Map();
    // ALWAYS set ID 0 at the start
    map.set(0, { id: 0, name: 'Filter instructors...' });
    
    courseOfferings.forEach(offering => {
      if (selectedTermId === 0 || offering.termId === selectedTermId) {
        offering.sections?.forEach(section => {
          if (section.instructor) map.set(section.instructor.id, section.instructor);
        });
      }
    });

    const list = Array.from(map.values());
    const filterOption = list.find(o => o.id === 0);
    const others = list.filter(o => o.id !== 0).sort((a, b) => a.name.localeCompare(b.name));
    
    return [filterOption, ...others];
  }, [courseOfferings, selectedTermId]);

  const termOptions = useMemo(() => {
    const opts = [{ termId: 0, label: 'Filter semesters...' }];
    courseOfferings.forEach(o => {
      const taughtBy = selectedInstructorId === 0 || o.sections?.some(s => s.instructor?.id === selectedInstructorId);
      if (taughtBy) opts.push({
        termId: o.termId,
        label: gradeGpa(o.cumulative) === null
          ? `${o.yearTerm} (${o.cumulative?.total > 0 ? 'no letter grades' : 'no grades yet'})`
          : o.yearTerm,
      });
    });
    return opts;
  }, [courseOfferings, selectedInstructorId]);

  useEffect(() => {
    if (selectedInstructorId !== 0 && !instructorOptions.some(i => i.id === selectedInstructorId)) setSelectedInstructorId(0);
  }, [instructorOptions, selectedInstructorId]);

  useEffect(() => {
    if (selectedTermId !== 0 && !termOptions.some(t => t.termId === selectedTermId)) setSelectedTermId(0);
  }, [termOptions, selectedTermId]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortCol(col);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui active centered inline loader large"></div>
          <p style={{ marginTop: '1rem' }}>Loading Course Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="Course">
        <div style={{ padding: '2rem', textAlign: 'center', color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', fontFamily: 'Lato, sans-serif' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>API Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
          <button className="ui secondary button" style={{ marginTop: '1rem', cursor: 'pointer', padding: '0.5em 1em', border: '1px solid #721c24', background: '#721c24', color: '#fff', borderRadius: '4px' }} onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="Course">
        <div className="ui segment" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="ui large header">Course not found</div>
          <button className="ui secondary button" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const cum = grades?.cumulative || {};
  const subjectCode = course.subject?.code || course.subject;

  const filteredInstructors = instructors.filter(i => i.name.toLowerCase().includes(instructorFilter.toLowerCase()));
  const sortedInstructors = [...filteredInstructors].sort((a, b) => {
    let valA = a[sortCol];
    let valB = b[sortCol];
    if (valA === null) valA = -1;
    if (valB === null) valB = -1;
    
    if (typeof valA === 'string') {
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    } else {
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    }
  });

  const renderTh = (label, column, isRight) => {
    const isSorted = sortCol === column;
    return (
      <th 
        onClick={() => handleSort(column)}
        style={{ ...TABLE_STYLES.th, textAlign: isRight ? 'right' : 'left' }}
      >
        {label}
        {isSorted && <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>{sortOrder === 'asc' ? '▲' : '▼'}</span>}
      </th>
    );
  };

  return (
    <div className="Course">
      <div className="breadcrumb" style={{ marginBottom: '1.5rem' }}>
        <a onClick={() => navigate('/')}>Home</a>
        <span className="divider">/</span>
        <a onClick={() => {
          const savedTerm = localStorage.getItem('selectedTerm');
          const termParam = (savedTerm && savedTerm !== 'all') ? `&term=${encodeURIComponent(savedTerm)}` : '';
          navigate(`/search?subject=${subjectCode}${termParam}`);
        }}>{subjectCode}</a>
        <span className="divider">/</span>
        <div className="active">{course.number}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1em', marginBottom: '1.5rem', flexWrap: 'wrap', fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
        <h1 style={{ margin: 0, fontSize: '28px', color: 'var(--text-primary)', fontWeight: '700' }}>
          {course.title || course.name}
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)', marginTop: '0.25rem', fontSize: '18px' }}>
            {subjectCode} {course.number}
          </div>
        </h1>
      </div>

      <div className="grid">
        <div className="col col-16" style={{ width: '100%' }}>
          {grades && (
            <>
              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <CustomDropdown 
                  options={instructorOptions}
                  value={selectedInstructorId}
                  onChange={setSelectedInstructorId}
                  placeholder="Filter instructors..."
                  searchPlaceholder="Search instructors..."
                />
                <CustomDropdown 
                  options={termOptions}
                  value={selectedTermId}
                  onChange={setSelectedTermId}
                  placeholder="Filter semesters..."
                  searchPlaceholder="Search semesters..."
                  valueKey="termId"
                  labelKey="label"
                />
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ ...FLAT_CARD_STYLE, flex: '1 1 45%', minWidth: '400px', marginBottom: 0 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: 0 }}>Grade Distribution</h2>
                  <CourseChartViewer 
                    gradesData={grades} 
                    selectedTermId={selectedTermId} 
                    selectedInstructorId={selectedInstructorId} 
                  />
                </div>
                <div style={{ ...FLAT_CARD_STYLE, flex: '1 1 45%', minWidth: '400px', marginBottom: 0 }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1.5rem', marginTop: 0 }}>GPA Trend</h2>
                  <GpaTrendChart 
                    courseOfferings={courseOfferings} 
                    selectedInstructorId={selectedInstructorId}
                    courseAverage={cum.gpa}
                  />
                </div>
              </div>
              
              <div style={FLAT_CARD_STYLE}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>Instructors</h2>
                  <input 
                    type="text" 
                    placeholder="Search instructors..." 
                    value={instructorFilter}
                    onChange={(e) => setInstructorFilter(e.target.value)}
                    style={{
                      padding: '0.4em 0.8em',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)',
                      fontSize: '13px',
                      fontFamily: 'inherit',
                      backgroundColor: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                </div>
                
                {sortedInstructors.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={TABLE_STYLES.table}>
                      <thead>
                        <tr>
                          {renderTh('Instructor', 'name', false)}
                          {renderTh('Total # Grades', 'totalStudents', true)}
                          {renderTh('Avg. GPA', 'gpa', true)}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedInstructors.map((inst, idx) => (
                          <tr key={idx} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                            <td style={TABLE_STYLES.td}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{inst.name}</span>
                            </td>
                            <td style={TABLE_STYLES.tdRight}>{inst.totalStudents.toLocaleString()}</td>
                            <td style={TABLE_STYLES.tdRight}>{inst.gpa !== null ? inst.gpa.toFixed(2) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{instructors.length === 0 ? 'No instructor grade data available yet.' : 'No instructors found matching your filter.'}</p>
                )}
              </div>
            </>
          )}

          {/* Course Description below Instructors */}
          <div style={FLAT_CARD_STYLE}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', marginTop: 0 }}>Course Description</h2>
            <p style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
              <CourseDescription description={course.description} />
            </p>
          </div>

          {/* Scheduled Sections below Course Description */}
          <ScheduledSections courseId={courseId} />
        </div>
      </div>


    </div>
  );
}

export default Course;
