import React, { useState } from "react";
import "../styles/auth.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "../components/Navbar";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Capture the response from the login request
      const response = await axios.post("http://localhost:3001/auth/login", {
        email,
        password,
      });

      // Store the access token in local storage
      const { accessToken } = response.data;

      // Show success notification
      toast.success("Successfully logged in", {
        icon: "👏",
        style: {
          border: "1px solid #4caf50",
          padding: "16px",
          color: "#4caf50",
        },
      });

      localStorage.setItem("accessToken", accessToken);
      navigate("/");
    } catch (error) {
      toast.error("Log in failed. Please try again.", {
        icon: "❌",
        style: {
          border: "1px solid #ff4d4f",
          padding: "16px",
          color: "#ff4d4f",
        },
      });
    }
  };

  return (
    <div className="container">
      <Navbar />
      <div className="main_container">
        <Toaster position="top-right" />

        <form className="form" onSubmit={handleSubmit}>
          <h2 className="title">Welcome Back</h2>
          <input
            className="input-field"
            type="email"
            name="email"
            placeholder="University Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input-field"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
          <button type="submit" className="submit-btn">
            Sign In
          </button>
          <div className="link">
            Dont have an account? <a href="/studentRegister">Register</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
