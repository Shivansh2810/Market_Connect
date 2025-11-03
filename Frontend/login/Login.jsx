import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

export default function Login() {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState("");
  const [disabled, setDisabled] = useState(false);
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!accountType || !emailOrPhone || !password) {
      alert("All fields are required!");
      return;
    }

    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^[0-9]{10}$/;
    if (!emailRegex.test(emailOrPhone) && !phoneRegex.test(emailOrPhone)) {
      alert("Enter valid Email or Mobile Number!");
      return;
    }

    alert("Login Successful!");
  };

  const handleSelect = (value) => {
    setAccountType(value);
    setDisabled(true);
  };

  const handleGoogleLogin = () => {
    alert("Google Sign-In coming soon!");
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <header className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-5 shadow-md text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-white to-yellow-200 drop-shadow-md uppercase">
          Market Connect
        </h1>
        <p className="text-blue-100 mt-2 text-sm md:text-base font-medium">
          Your trusted marketplace for buyers & sellers
        </p>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-[1.01]">
          <div className="flex flex-col md:flex-row">
            <div className="flex-1 bg-gradient-to-b from-cyan-400 to-blue-600 text-white p-10 flex flex-col justify-center">
              <div className="text-center mb-4">
                <div className="flex gap-10 justify-center mb-4 text-lg font-semibold">
                  <span>Buyer</span>
                  <span>Seller</span>
                </div>
                <img
                  src="https://cdn-icons-png.freepik.com/256/17695/17695167.png"
                  className="mx-auto w-40 md:w-56"
                  alt="Market Connect"
                />
              </div>
            </div>
            <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-blue-600 mb-4 text-center">
                Login to Your Account
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <select
                  value={accountType}
                  onChange={(e) => handleSelect(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="" disabled>
                    Select Account Type
                  </option>
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                </select>

                <input
                  type="text"
                  placeholder="Email / Mobile Number"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md font-semibold transition"
                >
                  LOGIN
                </button>
              </form>

              <div className="mt-4">
                <button
                  onClick={handleGoogleLogin}
                  className="flex items-center justify-center gap-2 w-full border border-gray-300 py-2 rounded-md hover:bg-gray-100 transition"
                >
                  <FcGoogle size={22} />
                  <span className="text-gray-700 font-medium">
                    Continue with Google
                  </span>
                </button>
              </div>

              <div className="flex justify-between mt-4 text-sm">
                <p>
                  New User?{" "}
                  <span
                    onClick={() => navigate("/signup")}
                    className="text-blue-600 cursor-pointer font-semibold"
                  >
                    Signup
                  </span>
                </p>
                <p className="text-gray-500 cursor-pointer hover:text-blue-500">
                  Forgot your password?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
