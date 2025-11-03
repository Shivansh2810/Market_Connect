import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (Object.keys(errors).length > 0) {
      alert("Please fix the highlighted errors before submitting!");
      return;
    }

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (form.password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(form.password)) {
      alert(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number!"
      );
      return;
    }

    alert("Signup Successful!");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <header className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-5 shadow-md text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-200 drop-shadow-md uppercase">
          Market Connect
        </h1>
        <p className="text-blue-100 mt-2 text-xs sm:text-sm md:text-base font-medium">
          Join the trusted marketplace community
        </p>
      </header>
      <div className="flex flex-col md:flex-row items-center justify-center flex-1 w-full px-4 py-6 sm:py-10">
        <div className="flex flex-col md:flex-row w-full max-w-[900px] bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex-1 bg-gradient-to-b from-cyan-400 to-blue-600 text-white p-8 sm:p-10 flex flex-col justify-center items-center">
            <div className="mb-6 text-center">
              <div className="flex gap-10 justify-center mb-4 text-lg font-semibold">
                <span>Buyer</span>
                <span>Seller</span>
              </div>
              <img
                src="https://cdn-icons-png.freepik.com/256/17695/17695167.png"
                className="mx-auto max-h-[220px] sm:max-h-[280px] md:max-h-[320px] object-contain"
                alt="illustration"
              />
            </div>
          </div>
          <div className="flex-1 p-6 sm:p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-6">
              Signup
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={form.firstName}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  } p-2 rounded-md focus:ring-2 focus:ring-blue-400`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={form.lastName}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  } p-2 rounded-md focus:ring-2 focus:ring-blue-400`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.lastName}
                  </p>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <input
                  type="text"
                  name="mobile"
                  placeholder="Mobile Number"
                  value={form.mobile}
                  onChange={handleChange}
                  className={`w-full border ${
                    errors.mobile ? "border-red-500" : "border-gray-300"
                  } p-2 rounded-md focus:ring-2 focus:ring-blue-400`}
                />
                {errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                )}
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 p-2 rounded-md focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <button
                type="submit"
                className="col-span-1 sm:col-span-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
              >
                SIGN UP
              </button>
            </form>
            <div className="mt-4 text-sm text-center sm:text-left">
              <p>
                Already have an account?{" "}
                <span
                  onClick={() => navigate("/")}
                  className="text-blue-600 cursor-pointer font-semibold"
                >
                  Login
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
