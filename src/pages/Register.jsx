import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User2, IdCard, ArrowRight } from "lucide-react";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Button from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { DEPARTMENTS, SEMESTERS } from "../data/mockData";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { cn } from "../utils/cn";

const strength = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

export default function Register() {
  useDocumentTitle("Create account");
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    studentId: "",
    email: "",
    password: "",
    confirm: "",
    department: DEPARTMENTS[0],
    semester: SEMESTERS[0],
  });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 3) e.name = "Please enter your full name.";
    if (!/^[A-Za-z0-9-]{4,}$/.test(form.studentId.trim())) e.studentId = "Enter a valid Student ID (e.g. UU-CSE-2023-042).";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid university email.";
    if (form.password.length < 6) e.password = "Password must be at least 6 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!validate()) return;
    setLoading(true);
    const res = await register(form);
    setLoading(false);
    if (!res.ok) return setFormError(res.error);
    toast.success("Account created!", "Welcome to UU Student Hub 🎓");
    navigate("/dashboard", { replace: true });
  };

  const s = strength(form.password);
  const sLabel = ["Too weak", "Weak", "Fair", "Good", "Strong"][s];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Create your account</h1>
      <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Join UU Student Hub and take control of your semester.</p>

      <form onSubmit={submit} noValidate className="mt-7 space-y-4">
        {formError && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {formError}
          </div>
        )}
        <Input label="Full name" icon={User2} placeholder="Mohammad Alvee Hossain" value={form.name} onChange={set("name")} error={errors.name} autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Student ID" icon={IdCard} placeholder="UU-CSE-2023-042" value={form.studentId} onChange={set("studentId")} error={errors.studentId} />
          <Input label="University email" type="email" icon={Mail} placeholder="you@uttarauniversity.edu.bd" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Department" value={form.department} onChange={set("department")} options={DEPARTMENTS} />
          <Select label="Semester" value={form.semester} onChange={set("semester")} options={SEMESTERS} />
        </div>
        <div>
          <Input
            label="Password"
            type={showPw ? "text" : "password"}
            icon={Lock}
            placeholder="At least 6 characters"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            autoComplete="new-password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                className="rounded-lg p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />
          {form.password && (
            <div className="mt-2 flex items-center gap-2" aria-live="polite">
              <div className="flex flex-1 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < s ? (s <= 1 ? "bg-red-500" : s === 2 ? "bg-amber-500" : "bg-emerald-500") : "bg-zinc-200 dark:bg-ink-700"
                    )}
                  />
                ))}
              </div>
              <span className="text-xs text-zinc-500">{sLabel}</span>
            </div>
          )}
        </div>
        <Input
          label="Confirm password"
          type={showPw ? "text" : "password"}
          icon={Lock}
          placeholder="Re-enter your password"
          value={form.confirm}
          onChange={set("confirm")}
          error={errors.confirm}
          autoComplete="new-password"
        />
        <Button type="submit" size="lg" className="w-full" loading={loading} iconRight={ArrowRight}>
          {loading ? "Creating account…" : "Create account"}
        </Button>
        <p className="text-center text-xs text-zinc-400">Demo only — your data is stored locally in this browser.</p>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
          Sign in
        </Link>
      </p>
    </div>
  );
}
