import React, { useState } from 'react';
import './login1.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';
import { loginUser,signupUser } from '../../api/auth';

// Homepage component with header
const HomePage = () => {
    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Header */}
            <header style={{
                backgroundColor: '#3c009d',
                color: 'white',
                padding: '20px 0',
                textAlign: 'center',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
                <h1 style={{
                    margin: 0,
                    fontSize: '36px',
                    fontWeight: '700',
                    letterSpacing: '1px'
                }}>
                    Market Connect
                </h1>
            </header>
        </div>
    );
};

// Login/Signup Component
const Login1 = ({ onLoginSuccess, onSignUpSuccess }) => {
    // Starts with the Login view
    const [action, setAction] = useState('login');
    const [accountType, setAccountType] = useState('buyer');
    const [name, setName] = useState('');
    const [nameError, setNameError] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [email, setEmail] = useState('');
    const [loginError, setLoginError] = useState('');

    // Function to validate name input
    const handleNameChange = (e) => {
        const value = e.target.value;
        // Check if the input contains any numbers
        if (/\d/.test(value)) {
            setNameError('Name cannot contain numbers');
            setName(value);
        } else {
            setNameError('');
            setName(value);
        }
    };

    // Function to validate password input
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        
        // Check if password has at least 6 characters
        if (value.length > 0 && value.length < 6) {
            setPasswordError('Password must be at least 6 characters long');
        } else {
            setPasswordError('');
        }
        
        // If we're on signup page and confirm password is filled, revalidate confirm password
        if (action !== 'login' && confirmPassword) {
            if (value !== confirmPassword) {
                setConfirmPasswordError('Passwords do not match');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    // Function to validate confirm password input
    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        
        // Check if passwords match
        if (value && password && value !== password) {
            setConfirmPasswordError('Passwords do not match');
        } else {
            setConfirmPasswordError('');
        }
    };

    // Function to handle email input
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        // Clear login error when user starts typing
        if (loginError) {
            setLoginError('');
        }
    };

    // Login handler
    const handleLogin = async () => {
        try{
            const data = await loginUser(email,password,accountType);
            console.log(data);
            onLoginSuccess();
        }catch(err){
            setLoginError(err.message || "Login failed");
        }
    }

    //signup handler
    const handleSignup = async () => {
        try{
            const data =  await signupUser(name,email,password,accountType);
            console.log(data);
            alert("Signup successful! Please log in.");
            onSignUpSuccess();
        }catch(err){
            alert(err.errMsg || "Signup failed");
        }
    }

    // Function to handle action change and reset fields
    const handleActionChange = (newAction) => {
        setAction(newAction);
        if (newAction === 'login') {
            setName('');
            setNameError('');
            setPassword('');
            setPasswordError('');
            setConfirmPassword('');
            setConfirmPasswordError('');
            setLoginError('');
        }
    };

    return (
        <div className='container'>
            <div className='header'>
                <div className='text'>{action}</div>
                <div className='underline'></div>
            </div>
            <div className="inputs">
                {/* Account Type Dropdown - visible on both pages */}
                <div className="input-dropdown">
                    <label htmlFor="account-type">Account Type</label>
                    <select
                        id="account-type"
                        value={accountType}
                        onChange={(e) => setAccountType(e.target.value)}
                    >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                    </select>
                </div>
                {/* Name input - visible only on Sign Up page */}
                {action === "login" ? null : (
                    <div>
                        <div className="input">
                            <FontAwesomeIcon icon={faUser} className="icon" />
                            <input 
                                type="text" 
                                placeholder='Name' 
                                value={name}
                                onChange={handleNameChange}
                            />
                        </div>
                        {nameError && (
                            <div className="error-message">{nameError}</div>
                        )}
                    </div>
                )}
                {/* Email input */}
                <div>
                    <div className="input">
                        <FontAwesomeIcon icon={faEnvelope} className="icon" />
                        <input 
                            type="email" 
                            placeholder='Email-Id' 
                            value={email}
                            onChange={handleEmailChange}
                        />
                    </div>
                    {loginError && action === 'login' && (
                        <div className="error-message">{loginError}</div>
                    )}
                </div>
                {/* Password input */}
                <div>
                    <div className="input">
                        <FontAwesomeIcon icon={faLock} className="icon" />
                        <input 
                            type="password" 
                            placeholder='Password' 
                            value={password}
                            onChange={handlePasswordChange}
                        />
                    </div>
                    {passwordError && (
                        <div className="error-message">{passwordError}</div>
                    )}
                </div>
                {/* Confirm Password input - visible only on Sign Up page */}
                {action === "login" ? null : (
                    <div>
                        <div className="input">
                            <FontAwesomeIcon icon={faLock} className="icon" />
                            <input 
                                type="password" 
                                placeholder='Confirm Password' 
                                value={confirmPassword}
                                onChange={handleConfirmPasswordChange}
                            />
                        </div>
                        {confirmPasswordError && (
                            <div className="error-message">{confirmPasswordError}</div>
                        )}
                    </div>
                )}
                {/* "Agree with terms and conditions" checkbox - visible only on Sign Up page */}
                {action === "login" ? null : (
                    <div className="terms-checkbox">
                        <input type="checkbox" id="terms" />
                        <label htmlFor="terms">I agree with the terms and conditions</label>
                    </div>
                )}
                {/* Forgot Password link - visible only on Login page */}
                {action === "Sign Up" ? null : (
                    <div className="forget-password">Forgot Password? <span> click here</span></div>
                )}
            </div>
            <div className="submit-container">
                {/* Main Action Button */}
                <div
                    className="submit"
                    onClick={() => {
                        if (action === "login") {
                            handleLogin();
                        } else {
                           handleSignup();
                        }
                    }}
                >
                    {action === "login" ? "Login" : "Sign up"}
                </div>
            </div>
            {/* Conditional link to switch between Login and Sign Up */}
            {action === "login" ? (
                <div className="create-account-text">
                    Create an account? <span onClick={() => handleActionChange("Sign Up")}>Sign up</span>
                </div>
            ) : (
                <div className="create-account-text">
                    Already have an account? <span onClick={() => handleActionChange("login")}>Login</span>
                </div>
            )}
        </div>
    );
};

// Main App component that handles page routing
const App = () => {
    const [currentPage, setCurrentPage] = useState('login');

    const handleLoginSuccess = () => {
        setCurrentPage('home');
    };

    const handleSignUpSuccess = () => {
        // This function will be called when the Sign Up button is clicked
        // and it correctly changes the App's state to 'login'
        setCurrentPage('login');
    };

    return (
        <div>
            {currentPage === 'login' ? (
                <Login1 onLoginSuccess={handleLoginSuccess} onSignUpSuccess={handleSignUpSuccess} />
            ) : (
                <HomePage />
            )}
        </div>
    );
};

export default App;
