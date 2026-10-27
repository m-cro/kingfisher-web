import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Search from './pages/Search';
import Course from './pages/Course';
import Instructors from './pages/Instructors';
import Instructor from './pages/Instructor';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/instructors" element={<Instructors />} />
        <Route path="/instructors/:instructorId" element={<Instructor />} />
        <Route path="/search" element={<Search />} />
        <Route path="/courses/:courseId" element={<Course />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;