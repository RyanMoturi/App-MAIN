import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Navbar from './components/Navbar';
import Login from './pages/login';
import Signup from './pages/Signup';
import ClientDashboard from './pages/ClientDashboard';
import FundiDashboard from './pages/FundiDashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import JobList from './pages/JobList';
import JobDetails from './pages/JobDetails';
import Profile from './pages/Profile';
import PostJob from './pages/PostJob';

const App = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/jobs" element={<JobList />} />
      <Route path="/jobs/:id" element={<JobDetails />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route path="/fundi-dashboard" element={<FundiDashboard />} />
      <Route path="/post-job" element={<PostJob />} />
    </Routes>
  </>
);

export default App;
