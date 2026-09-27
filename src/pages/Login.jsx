import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowRight, Zap } from "lucide-react";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEMO_CREDENTIALS } from "../data/mockData";
import useDocumentTitle from "../hooks/useDocumentTitle";

export default function Login() {
  useDocumentTitle("Sign in");
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.password) e.password = "Password is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    const res = await login(form.email, form.password, form.remember);
    setLoading(false);
    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    toast.success("Welcome back!", "You have signed in successfully.");
    navigate(location.state?.from || "/dashboard", { replace: true });
  };

  const fillDemo = () => {
    setForm((f) => ({ ...f, email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password }));
    setErrors({});
    setFormError("");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Welcome back 👋</h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Sign in to continue to your student dashboard.</p>

      <button
        type="button"
        onClick={fillDemo}
        className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50/60 p-3.5 text-left transition hover:bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/5 dark:hover:bg-brand-500/10"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Zap size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">Use demo account</span>
          <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
            {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
          </span>
        </span>
        <ArrowRight size={16} className="text-brand-600 dark:text-brand-400" />
      </button>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-ink-700" /> or sign in with email <span className="h-px flex-1 bg-zinc-200 dark:bg-ink-700" />
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </div>
        )}
        <Input
          label="University email"
          type="email"
          icon={Mail}
          placeholder="you@uttarauniversity.edu.bd"
          autoComplete="email"
          value={form.email}
          onChange={set("email")}
          error={errors.email}
        />
        <Input
          label="Password"
          type={showPw ? "text" : "password"}
          icon={Lock}
          placeholder="Enter your password"
          autoComplete="current-password"
          value={form.password}
          onChange={set("password")}
          error={errors.password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? "Hide password" : "Show password"}
              className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={set("remember")}
              className="h-4 w-4 rounded border-zinc-300 accent-brand-600 dark:border-ink-500"
            />
            Remember me
          </label>
          <button
            type="button"
            onClick={() => toast.info("Password reset", "Please contact the UU IT help desk to reset your password.")}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            Forgot password?
          </button>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={ArrowRight}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
        New to UU Student Hub?{" "}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Create an account
        </Link>
      </p>
    </div>
  );
}
