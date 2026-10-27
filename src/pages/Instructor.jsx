import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getInstructor } from '../api';

export default function Instructor() {
  const { instructorId } = useParams();
  const [state, setState] = useState({ loading: true });
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setState({ loading: true });
    getInstructor(instructorId).then(data => {
      if (!cancelled) setState({ data });
    }).catch(error => {
      if (!cancelled) setState({ error: error.response?.status === 404 ? 'Instructor not found.' : 'We couldn’t load this instructor.' });
    });
    return () => { cancelled = true; };
  }, [instructorId, retry]);

  return <section className="Instructors">
    <Link to="/instructors" className="instructor-back">← All instructors</Link>
    {state.loading ? <p className="instructor-message" role="status">Loading instructor…</p>
      : state.error ? <div className="instructor-message" role="alert"><p>{state.error}</p><button className="btn btn-secondary" onClick={() => setRetry(value => value + 1)}>Try again</button></div>
      : <>
        <div className="instructor-heading">
          <p className="instructor-eyebrow">Instructor</p><h1>{state.data.name}</h1>
          <p>Courses taught in the historical grade records.</p>
          <Link className="instructor-back" to={`/search?instructor=${encodeURIComponent(state.data.name)}`}>Search courses for this instructor and matching name variants →</Link>
        </div>
        <div className="instructor-directory">
          <div className="instructor-directory-bar">{state.data.courses.length} courses</div>
          {state.data.courses.length ? <ul className="instructor-results">{state.data.courses.map(course => <li key={course.id}>
            <Link className="instructor-result" to={`/courses/${course.id}`}>
              <span className="pill">{course.subject?.code} {course.number}</span>
              <span className="instructor-result-name">{course.title}</span>
              <span className="instructor-result-action" aria-hidden="true">→</span>
            </Link>
          </li>)}</ul> : <p className="instructor-message">No historical grade records are available for this instructor yet.</p>}
        </div>
      </>}
  </section>;
}
