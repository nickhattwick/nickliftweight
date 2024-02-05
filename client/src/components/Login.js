import React from 'react';

const Login = () => {
    return (
        <div>
            <h2>Login</h2>
            <a href={process.env.REACT_APP_SERVER_URL + '/auth/google'}>
                <button type="button">Sign in with Google</button>
            </a>
        </div>
    );
};

export default Login;