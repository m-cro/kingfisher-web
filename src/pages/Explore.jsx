import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { exploreSubjects, exploreCourses, exploreInstructors } from '../api';
import Pagination from '../components/Pagination';
import subjectMap from '../utils/subjectMap';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Build a sorted list of subject entries for autocomplete
const SUBJECT_ENTRIES = Object.entries(subjectMap).map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.code.localeCompare(b.code));

function fuzzyFilterSubjects(input) {
  if (!input) return [];
  const q = input.toLowerCase().trim();
  return SUBJECT_ENTRIES.filter(({ code, name }) =>
    code.toLowerCase().includes(q) ||
    name.toLowerCase().includes(q)
  ).slice(0, 10);
}

const TABLE_STYLES = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
    fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif',
    border: '1px solid rgba(34,36,38,.15)',
    borderRadius: '0.28571429rem'
  },
  th: {
    padding: '0.92857143em 0.78571429em',
    fontWeight: '700',
    color: 'var(--text-primary)',
    backgroundColor: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border-color)',
    cursor: 'pointer',
    userSelect: 'none'
  },
  td: {
    padding: '0.78571429em',
    borderTop: '1px solid var(--border-color)',
    color: 'var(--text-primary)'
  },
  tdRight: {
    padding: '0.78571429em',
    borderTop: '1px solid var(--border-color)',
    textAlign: 'right',
    color: 'var(--text-primary)',
    fontVariantNumeric: 'tabular-nums'
  },
  link: {
    textDecoration: 'none',
    color: 'var(--text-primary)'
  },
  pill: {
    display: 'inline-block',
    padding: '0.2em 0.5em',
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: '3px',
    fontSize: '11px',
    marginTop: '4px',
    color: 'var(--text-secondary)',
    fontWeight: '700',
    textTransform: 'uppercase'
  }
};

// Sort option configs: { value, label, column, direction }
const SORT_OPTIONS = [
  { value: 'totalStudents-desc', label: 'Total Grades ↓', column: 'totalStudents', direction: 'desc' },
  { value: 'totalStudents-asc',  label: 'Total Grades ↑', column: 'totalStudents', direction: 'asc' },
  { value: 'avgStudents-desc',   label: 'Avg Grades ↓',   column: 'avgStudents',   direction: 'desc' },
  { value: 'avgStudents-asc',    label: 'Avg Grades ↑',   column: 'avgStudents',   direction: 'asc' },
  { value: 'gpa-desc',           label: 'Avg GPA ↓',      column: 'gpa',           direction: 'desc' },
  { value: 'gpa-asc',            label: 'Avg GPA ↑',      column: 'gpa',           direction: 'asc' },
];

const SORT_SUBJECTS = [
  { value: 'subjectCode-asc',    label: 'Subject Code A→Z', column: 'subjectCode', direction: 'asc' },
  { value: 'subjectCode-desc',   label: 'Subject Code Z→A', column: 'subjectCode', direction: 'desc' },
  ...SORT_OPTIONS,
];

// Gen Ed category ids as returned by the UIUC Course Explorer
const GEN_ED_OPTIONS = [
  { value: 'ACP', label: 'Advanced Composition' },
  { value: 'COMP1', label: 'Composition I' },
  { value: 'CS', label: 'Cultural Studies' },
  { value: 'HUM', label: 'Humanities & the Arts' },
  { value: 'NAT', label: 'Natural Sciences & Technology' },
  { value: 'QR', label: 'Quantitative Reasoning' },
  { value: 'SBS', label: 'Social & Behavioral Sciences' },
];

function Explore() {
  const navigate = useNavigate();
  const queryParams = useQuery();

  const activeTab = queryParams.get('tab') || 'subjects';
  const currentPage = parseInt(queryParams.get('page') || '1', 10);
  const sort = queryParams.get('sort') || 'totalStudents';
  const order = queryParams.get('order') || 'desc';
  const filterSubject = queryParams.get('subject') || '';
  const filterGenEd = queryParams.get('genEd') || '';

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Subject autocomplete for courses/instructors filter
  const [subjectInput, setSubjectInput] = useState(
    filterSubject ? (subjectMap[filterSubject] ? `${filterSubject} — ${subjectMap[filterSubject]}` : filterSubject) : ''
  );
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectRef = useRef(null);
  const subjectSuggestions = useMemo(() => fuzzyFilterSubjects(subjectInput), [subjectInput]);

  useEffect(() => {
    const handler = (e) => {
      if (subjectRef.current && !subjectRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync subject input when URL changes externally
  useEffect(() => {
    if (filterSubject) {
      setSubjectInput(subjectMap[filterSubject] ? `${filterSubject} — ${subjectMap[filterSubject]}` : filterSubject);
    } else {
      setSubjectInput('');
    }
  }, [filterSubject]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setData([]);

    const params = { page: currentPage, perPage: 25, sort, order };
    if (filterSubject && (activeTab === 'courses' || activeTab === 'instructors')) {
      params.subject = filterSubject;
    }
    if (filterGenEd && activeTab === 'courses') {
      params.genEd = filterGenEd;
    }

    const fetcher =
      activeTab === 'subjects' ? exploreSubjects :
      activeTab === 'courses' ? exploreCourses :
      exploreInstructors;

    fetcher(params)
      .then(res => {
        setData(res.results || []);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.totalCount || 0);
      })
      .catch(err => {
        console.error(err);
        setError('The server is currently unreachable. Please ensure the backend API is running.');
      })
      .finally(() => setLoading(false));
  }, [activeTab, currentPage, sort, order, filterSubject, filterGenEd]);

  const buildUrl = (tab, page, col, dir, subj, genEd = filterGenEd) =>
    `/explore?tab=${tab}&page=${page}&sort=${col}&order=${dir}${subj ? `&subject=${subj}` : ''}${genEd ? `&genEd=${genEd}` : ''}`;

  const handleTabChange = (tab) => navigate(`/explore?tab=${tab}&page=1`);
  const handlePageChange = (page) => navigate(buildUrl(activeTab, page, sort, order, filterSubject));

  const handleSortChange = (e) => {
    const opt = (activeTab === 'subjects' ? SORT_SUBJECTS : SORT_OPTIONS).find(o => o.value === e.target.value);
    if (opt) navigate(buildUrl(activeTab, 1, opt.column, opt.direction, filterSubject));
  };

  const handleSubjectSelect = (code) => {
    setSubjectInput(subjectMap[code] ? `${code} — ${subjectMap[code]}` : code);
    setSubjectDropdownOpen(false);
    navigate(buildUrl(activeTab, 1, sort, order, code));
  };

  const handleGenEdChange = (e) => {
    navigate(buildUrl(activeTab, 1, sort, order, filterSubject, e.target.value));
  };

  const handleSubjectClear = () => {
    setSubjectInput('');
    setSubjectDropdownOpen(false);
    navigate(buildUrl(activeTab, 1, sort, order, ''));
  };

  const currentSortValue = `${sort}-${order}`;
  const sortOptions = activeTab === 'subjects' ? SORT_SUBJECTS : SORT_OPTIONS;

  const renderTh = (label, column, isRight) => {
    const isSorted = sort === column;
    const newOrder = isSorted && order === 'desc' ? 'asc' : 'desc';
    return (
      <th
        onClick={() => navigate(buildUrl(activeTab, 1, column, newOrder, filterSubject))}
        style={{
          ...TABLE_STYLES.th,
          textAlign: isRight ? 'right' : 'left'
        }}
      >
        {label}
        {isSorted && (
          <span style={{ marginLeft: '4px', fontSize: '0.8em' }}>
            {order === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </th>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="loader"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#721c24', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>API Error</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      );
    }

    if (data.length === 0) {
      return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No results found.</div>;
    }

    if (activeTab === 'subjects') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Subject', 'subjectCode', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const code = item.subject?.code || '';
              const fullName = subjectMap[code] || code;
              return (
                <tr key={code} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={TABLE_STYLES.td}>
                    <Link to={`/search?subject=${code}`} style={TABLE_STYLES.link}>{fullName}</Link>
                  </td>
                  <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'courses') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Course', 'courseNumber', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map(item => {
              const c = item.course;
              const courseCode = `${c?.subject?.code || ''} ${c?.number || ''}`.trim();
              return (
                <tr key={c?.id} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...TABLE_STYLES.td, width: '40%' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Link to={`/courses/${c?.id}`} style={{ ...TABLE_STYLES.link, fontWeight: '500' }}>
                        {c?.title || '-'}
                      </Link>
                      <span style={TABLE_STYLES.pill}>{courseCode}</span>
                    </div>
                  </td>
                  <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                  <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      );
    }

    if (activeTab === 'instructors') {
      return (
        <table style={TABLE_STYLES.table}>
          <thead>
            <tr>
              {renderTh('Instructor', 'instructorName', false)}
              {renderTh('Avg. # Grades', 'avgStudents', true)}
              {renderTh('Total # Grades', 'totalStudents', true)}
              {renderTh('Avg. GPA', 'gpa', true)}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={item.instructor?.id || idx} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                <td style={TABLE_STYLES.td}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.instructor?.name || '-'}</span>
                </td>
                <td style={TABLE_STYLES.tdRight}>{item.avgStudents != null ? Math.round(item.avgStudents).toLocaleString() : '-'}</td>
                <td style={TABLE_STYLES.tdRight}>{item.totalStudents != null ? item.totalStudents.toLocaleString() : '-'}</td>
                <td style={TABLE_STYLES.tdRight}>{item.gpa != null ? item.gpa.toFixed(2) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
  };

  const inputStyle = {
    padding: '0.5em 1em',
    borderRadius: '2px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-card)',
    fontSize: '13px',
    fontFamily: 'inherit',
    color: 'var(--text-primary)',
    outline: 'none'
  };

  return (
    <div className="Explore" style={{ fontFamily: 'Lato, "Helvetica Neue", Arial, Helvetica, sans-serif' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
            Explore
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
            {totalCount > 0 ? `${totalCount.toLocaleString()} results` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Subject filter – only for courses and instructors tabs */}
          {(activeTab === 'courses' || activeTab === 'instructors') && (
            <div ref={subjectRef} style={{ position: 'relative' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Filter by subject..."
                  value={subjectInput}
                  onChange={e => {
                    setSubjectInput(e.target.value);
                    setSubjectDropdownOpen(true);
                  }}
                  onFocus={() => setSubjectDropdownOpen(true)}
                  style={{ ...inputStyle, width: '200px', paddingRight: filterSubject ? '2rem' : '1em' }}
                />
                {filterSubject && (
                  <button
                    onClick={handleSubjectClear}
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px',
                      color: 'var(--text-secondary)', lineHeight: 1, padding: '0'
                    }}
                    title="Clear subject filter"
                  >✕</button>
                )}
              </div>
              {subjectDropdownOpen && subjectSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                  background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderTop: 'none', borderRadius: '0 0 4px 4px',
                  maxHeight: '220px', overflowY: 'auto',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.12)', minWidth: '240px'
                }}>
                  {subjectSuggestions.map(({ code, name }) => (
                    <div
                      key={code}
                      onMouseDown={() => handleSubjectSelect(code)}
                      style={{
                        padding: '0.5em 1em', cursor: 'pointer', fontSize: '13px',
                        color: 'var(--text-primary)', display: 'flex', gap: '0.5em', alignItems: 'baseline'
                      }}
                      onMouseOver={e => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                      onMouseOut={e => e.currentTarget.style.backgroundColor = ''}
                    >
                      <span style={{ fontWeight: 700, color: '#e94b26', minWidth: '45px' }}>{code}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Gen Ed filter – courses tab only */}
          {activeTab === 'courses' && (
            <select
              value={filterGenEd}
              onChange={handleGenEdChange}
              style={{ ...inputStyle, cursor: 'pointer' }}
              aria-label="Filter by Gen Ed category"
            >
              <option value="">All Gen Ed</option>
              {GEN_ED_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}

          {/* Sort dropdown */}
          <select
            value={currentSortValue}
            onChange={handleSortChange}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '2px solid rgba(34,36,38,.15)', marginBottom: '1.25rem', gap: '0' }}>
        {['subjects', 'courses', 'instructors'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #e94b26' : '2px solid transparent',
              padding: '0.6rem 1.25rem',
              fontSize: '14px',
              fontWeight: activeTab === tab ? '700' : '400',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              textTransform: 'capitalize',
              marginBottom: '-2px',
              transition: 'color 0.15s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        {renderTable()}
      </div>

      {!loading && totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}

export default Explore;