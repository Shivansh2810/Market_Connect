import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";
import { useAuth } from "../../contexts/AuthContext";
import "./Signup.css";

// Using shared `api` instance (baseURL configured in Frontend/api/axios.js)

export default function Signup() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  
  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newErrors = { ...errors };

    if (name === "firstName" || name === "lastName") {
      if (!/^[A-Za-z]*$/.test(value)) {
        newErrors[name] = "Only alphabets are allowed!";
      } else {
        delete newErrors[name];
      }
    }

    if (name === "mobile") {
      if (!/^[0-9]*$/.test(value)) {
        newErrors[name] = "Only numbers are allowed!";
      } else if (value.length > 10) {
        newErrors[name] = "Mobile number cannot exceed 10 digits!";
      } else {
        delete newErrors[name];
      }
    }

    setForm({ ...form, [name]: value });
    setErrors(newErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted errors before submitting!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number!"
      );
      return;
    }

    if (!form.firstName || !form.lastName || !form.email || !form.mobile) {
      setError("All fields are required!");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post(`/signup`, {
        name: `${form.firstName} ${form.lastName}`.trim(),
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        mobNo: form.mobile
      });

      if (response.data.token && response.data.user) {
        // Store auth data
        login(response.data.user, response.data.token);
        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        "Signup failed. Please check your information and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <header className="signup-header">
        <h1>Market Connect</h1>
        <p>Join the trusted marketplace community</p>
      </header>

      <div className="signup-container">
        <div className="signup-left">
          <div className="role-labels">
            <span>Buyer</span>
            <span>Seller</span>
          </div>
          <img
            src="https://cdn-icons-png.freepik.com/256/17695/17695167.png"
            alt="illustration"
          />
        </div>

        <div className="signup-right">
          <h2>Create Your Account</h2>

          {error && (
            <div style={{ 
              color: 'red', 
              marginBottom: '15px', 
              padding: '10px', 
              backgroundColor: '#ffe6e6', 
              borderRadius: '5px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  className={errors.firstName ? "error-input" : ""}
                />
                {errors.firstName && (
                  <p className="error-text">{errors.firstName}</p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  className={errors.lastName ? "error-input" : ""}
                />
                {errors.lastName && (
                  <p className="error-text">{errors.lastName}</p>
                )}
              </div>

              <div className="col-span">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span">
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={handleChange}
                  className={errors.mobile ? "error-input" : ""}
                />
                {errors.mobile && <p className="error-text">{errors.mobile}</p>}
              </div>

              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button type="submit" className="btn-signup" disabled={loading}>
              {loading ? "SIGNING UP..." : "SIGN UP"}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account?{" "}
              <span onClick={() => navigate("/")}>Login</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}