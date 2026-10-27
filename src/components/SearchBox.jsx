import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function SearchBox() {
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const instructorSearch = location.pathname.startsWith('/instructors');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchValue(params.get('q') || params.get('query') || '');
  }, [location.search, location.pathname]);

  const performSearch = event => {
    event.preventDefault();
    const query = searchValue.trim();
    if (instructorSearch) {
      navigate(query ? `/instructors?q=${encodeURIComponent(query)}` : '/instructors');
    } else if (query) {
      const savedTerm = localStorage.getItem('selectedTerm');
      const termParam = savedTerm && savedTerm !== 'all' ? `&term=${encodeURIComponent(savedTerm)}` : '';
      navigate(`/search?q=${encodeURIComponent(query)}${termParam}`);
    }
  };

  return (
    <form role="search" className="search-box SearchBox" onSubmit={performSearch}>
      <input type="search" aria-label={instructorSearch ? 'Search instructors' : 'Search courses'}
        placeholder={instructorSearch ? 'Search instructors by name or initials…' : "Search for 'CS 225', 'Algorithms', or 'Comp Sci'..."}
        value={searchValue} onChange={event => setSearchValue(event.target.value)} />
      <button type="submit" className="icon" aria-label={instructorSearch ? 'Find instructors' : 'Find courses'}>
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      </button>
    </form>
  );
}
export default SearchBox;
