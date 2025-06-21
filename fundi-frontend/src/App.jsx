import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import Navbar from './components/Navbar';
import Login from './pages/login';
import Signup from './pages/Signup';
import ClientDashboard from './pages/ClientDashboard';
import FundiDashboard from './pages/FundiDashboard';

const App = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/client-dashboard" element={<ClientDashboard />} />
      <Route path="/fundi-dashboard" element={<FundiDashboard />} />
    </Routes>
  </>
);

export default App;
