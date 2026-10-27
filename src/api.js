import axios from 'axios';

// The same built bundle is served from multiple domains (e.g. kf.rthak.com and
// meows.ro) off one host. Map each serving domain to the API host it should use.
const API_HOSTS = {
  'kf.rthak.com': 'https://kingfisherapi.rthak.com',
  'meows.ro': 'https://api.meows.ro',
};

const DEFAULT_API_HOST = 'https://kingfisherapi.rthak.com';

function resolveBaseURL() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (import.meta.env.DEV) return '/v1';
  // Normalize a leading www. so www.meows.ro works without an extra entry.
  const hostname = (window.location.hostname || '').replace(/^www\./, '');
  const host = API_HOSTS[hostname] || DEFAULT_API_HOST;
  return `${host}/v1`;
}

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});


export const getSubjects = () => api.get('/subjects').then(res => res.data);
export const getCourses = (params) => api.get('/courses', { params }).then(res => res.data);
export const getCourse = (id) => api.get(`/courses/${id}`).then(res => res.data);
export const getCourseGrades = (id) => api.get(`/courses/${id}/grades`).then(res => res.data);
export const getTerms = () => api.get('/terms').then(res => res.data);
export const getSectionTypes = () => api.get('/sections/types').then(res => res.data);
export const getScheduledSections = (id, term) =>
  api.get(`/courses/${id}/scheduled-sections`, { params: { term } }).then(res => res.data);
export const refreshCourseSections = (id, term) =>
  api.post(`/courses/${id}/sections/refresh`, null, { params: { term } }).then(res => res.data);
export const getCourseRefreshStatus = (id, term) =>
  api.get(`/courses/${id}/sections/refresh-status`, { params: { term } }).then(res => res.data);
export const getInstructors = (params) => api.get('/instructors', { params }).then(res => res.data);
export const exploreSubjects = (params) => api.get('/explore/subjects', { params }).then(res => res.data);
export const exploreCourses = (params) => api.get('/explore/courses', { params }).then(res => res.data);
export const exploreInstructors = (params) => api.get('/explore/instructors', { params }).then(res => res.data);

export default api;
export const getInstructor = id => api.get(`/instructors/${id}`).then(res => res.data);
