import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from '../services/api';
import { Alert, AuthLayout, Field } from '../components/ui';

function VisitorLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await api.post(
        '/auth/login',
        {
          email,
          password,
        }
      );

      const { token, user } = response.data;

      if (user.role !== "visitor") {
        setError("This login is only for visitors.");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/visitor/dashboard");
    } catch (err) {
      if (err.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        navigate(`/visitor/verify-otp?email=${encodeURIComponent(err.response.data.email)}`, {
          state: { delivery: err.response.data.delivery, retryAfter: err.response.data.retryAfter },
        });
        return;
      }
      setError(
        err.response?.data?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Visitor login"
      subtitle="Sign in to request visits and view your passes."
      footer={<>Don&apos;t have an account? <Link to="/visitor/register" className="link">Sign up</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field id="email" label="Email">
          <input id="email" type="email" className="input" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
        </Field>
        <Field id="password" label="Password">
          <input id="password" type="password" className="input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </Field>
        <Alert>{error}</Alert>
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default VisitorLogin;
