import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import UserList from './pages/UserList';
import Navbar from './components/Navbar';
import Login from './pages/login';
import Signup from './pages/Signup';

const App = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/login" element={<Login />} />
    <Route path="/signup" element={<Signup />} />
    </Routes>
  </>
);

export default App;
