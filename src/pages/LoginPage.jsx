import { useState } from "react";
import "../styles/Login.css";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/dashboard");
        } catch (err) {
            switch (err.code) {
                case "auth/user-not-found":
                    setError("No user found with this email.");
                    break;
                case "auth/invalid-credential":
                    setError("Invalid Credential");
                    break;
                default:
                    setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Login</h2>
                {error && <div className="login-error">{error}</div>}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-fields">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            disabled={loading}
                        />
                        <div className="password-field">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                                disabled={loading}
                            />
                            <span className="password-icon" onClick={togglePasswordVisibility}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                        </div>
                        <button type="submit" className="login-button" disabled={loading}>
                            {loading ? <span className="spinner"></span> : "Login"}
                        </button>
                        <p className="signup-link">
                            Don't have an account? <Link to="/signup">Sign Up</Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
