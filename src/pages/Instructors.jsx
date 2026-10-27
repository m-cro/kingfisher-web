import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getInstructors } from '../api';
import Pagination from '../components/Pagination';

export default function Instructors() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);
  const [state, setState] = useState({ loading: true, results: [], totalCount: 0, totalPages: 0 });
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, results: [], totalCount: 0, totalPages: 0 });
    getInstructors({ query: query || undefined, page, perPage: 25 }).then(data => {
      if (!cancelled) setState({ ...data, loading: false });
    }).catch(() => {
      if (!cancelled) setState({ error: true, loading: false, results: [] });
    });
    return () => { cancelled = true; };
  }, [query, page, retry]);

  const changePage = nextPage => {
    const next = new URLSearchParams(params);
    next.set('page', nextPage);
    setParams(next);
  };

  return (
    <section className="Instructors" aria-labelledby="instructors-heading">
      <div className="instructor-heading">
        <p className="instructor-eyebrow">The people behind the courses</p>
        <h1 id="instructors-heading">Instructors</h1>
        <p>Find an instructor and explore the courses they’ve taught.</p>
        <p className="instructor-hint">Search by surname, full name, or initials. Try “Talati, N” or “Nishil Talati”.</p>
      </div>
      <div className="instructor-directory" aria-busy={state.loading}>
        <div className="instructor-directory-bar" aria-live="polite">
          <span>{state.loading ? 'Finding instructors…' : state.error ? 'Search unavailable' : `${state.totalCount.toLocaleString()} instructors${query ? ` matching “${query}”` : ''}`}</span>
          {query && <Link to="/instructors">Clear search</Link>}
        </div>
        {state.loading ? <p className="instructor-message" role="status">Loading instructors…</p>
          : state.error ? <div className="instructor-message" role="alert"><p>We couldn’t load instructors. Please try again.</p><button className="btn btn-secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
          : state.results.length === 0 ? <div className="instructor-message"><h2>No instructors found</h2><p>Try a surname or a different spelling.</p></div>
          : <ul className="instructor-results">
            {state.results.map(instructor => <li key={instructor.id}>
              <Link to={`/instructors/${instructor.id}`} className="instructor-result">
                <span className="instructor-monogram" aria-hidden="true">{instructor.name.charAt(0).toUpperCase()}</span>
                <span className="instructor-result-name">{instructor.name}</span>
                <span className="instructor-result-action">View courses <span aria-hidden="true">↗</span></span>
              </Link>
            </li>)}
          </ul>}
      </div>
      {!state.loading && !state.error && <Pagination currentPage={page} totalPages={state.totalPages} onPageChange={changePage} />}
    </section>
  );
}
