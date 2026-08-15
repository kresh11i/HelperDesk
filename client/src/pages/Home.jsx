import React from "react";
import { Navigate } from "react-router-dom";

const Home = () => {
  // Redirect to login page for the frontend UI test
  return <Navigate to="/login" replace />;
};

export default Home;
