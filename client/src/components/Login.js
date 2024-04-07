import React from 'react';
import './Login.css';

const Login = () => {
    return (
        <div className="login-container">
            <h2>Nick Lift Weight</h2>
            <a href={`${process.env.REACT_APP_SERVER_URL}/auth/google`}>
                <button type="button" className="google-signin-btn">Sign in with Google</button>
            </a>
        </div>
    );
};

export default Login;
