import { useEffect, useRef, useState } from "react";
import { Camera, Pencil, Mail, IdCard, Building2, GraduationCap, Layers, CalendarRange, Phone, BookCheck, Award, Library, UserCheck, Trash2 } from "lucide-react";
import Card, { CardHeader, CardBody } from "../components/ui/Card";
import Avatar from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Input, { Textarea } from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { DEPARTMENTS, SEMESTERS } from "../data/mockData";
import { getColor } from "../utils/helpers";
import { cn } from "../utils/cn";

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-ink-800 dark:text-zinc-400">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-zinc-900 dark:text-zinc-100">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function Profile() {
  useDocumentTitle("Profile");
  const { user, updateProfile } = useAuth();
  const { courses, settings } = useData();
  const toast = useToast();
  const fileRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editOpen && user) {
      setForm({ ...user, cgpa: String(user.cgpa), creditsCompleted: String(user.creditsCompleted), coursesCompleted: String(user.coursesCompleted), attendance: String(user.attendance) });
      setErrors({});
    }
  }, [editOpen, user]);

  if (!user) return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onAvatar = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please choose an image file.");
    if (file.size > 1.5 * 1024 * 1024) return toast.error("Image too large", "Please choose an image under 1.5 MB.");
    const reader = new FileReader();
    reader.onload = () => {
      // Downscale to keep localStorage small
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        updateProfile({ avatar: canvas.toDataURL("image/jpeg", 0.85) });
        toast.success("Profile photo updated.");
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const save = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name?.trim()) errs.name = "Name is required.";
    const cg = Number(form.cgpa);
    if (isNaN(cg) || cg < 0 || cg > 4) errs.cgpa = "CGPA must be between 0 and 4.";
    const att = Number(form.attendance);
    if (isNaN(att) || att < 0 || att > 100) errs.attendance = "Attendance must be 0–100.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    updateProfile({
      name: form.name.trim(),
      studentId: form.studentId.trim(),
      department: form.department,
      program: form.program.trim(),
      semester: form.semester,
      batch: form.batch.trim(),
      phone: form.phone.trim(),
      bio: form.bio.trim(),
      cgpa: Math.round(cg * 100) / 100,
      creditsCompleted: Number(form.creditsCompleted) || 0,
      coursesCompleted: Number(form.coursesCompleted) || 0,
      attendance: att,
    });
    setEditOpen(false);
    toast.success("Profile updated.");
  };

  const stats = [
    { icon: GraduationCap, label: "CGPA", value: settings.showCgpa ? Number(user.cgpa).toFixed(2) : "Hidden" },
    { icon: BookCheck, label: "Credits completed", value: user.creditsCompleted },
    { icon: Library, label: "Courses completed", value: user.coursesCompleted },
    { icon: UserCheck, label: "Attendance", value: `${user.attendance}%` },
  ];

  return (
    <div className="space-y-6">
      {/* Cover + identity */}
      <Card className="overflow-hidden">
        <div className="relative h-32 bg-zinc-900 sm:h-40 dark:bg-ink-800">
          <div className="bg-grid absolute inset-0 opacity-70" aria-hidden="true" />
          <div className="absolute -right-10 -top-20 h-60 w-60 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
          <div className="absolute bottom-4 right-4 hidden text-right text-white/70 sm:block">
            <p className="text-xs font-medium">Uttara University</p>
            <p className="text-[11px] text-white/50">Dhaka, Bangladesh</p>
          </div>
        </div>
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar name={user.name} src={user.avatar} size="2xl" ring />
                <button
                  onClick={() => fileRef.current?.click()}
                  aria-label="Change profile photo"
                  className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-zinc-900 text-white shadow-lg transition hover:scale-105 dark:border-ink-900 dark:bg-white dark:text-zinc-900"
                >
                  <Camera size={15} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatar} />
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">{user.name}</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  {user.program || user.department} · {user.semester}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge tone="blue">{user.studentId}</Badge>
                  <Badge tone="green" dot>
                    Active student
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {user.avatar && (
                <Button variant="ghost" icon={Trash2} onClick={() => { updateProfile({ avatar: "" }); toast.info("Profile photo removed."); }}>
                  <span className="hidden sm:inline">Remove photo</span>
                </Button>
              )}
              <Button variant="outline" icon={Pencil} onClick={() => setEditOpen(true)}>
                Edit profile
              </Button>
            </div>
          </div>
          {user.bio && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">{user.bio}</p>}
        </div>
      </Card>

      {/* Academic stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <s.icon size={18} className="text-brand-600 dark:text-brand-400" />
            <p className="mt-3 text-2xl font-bold tabular-nums text-zinc-900 dark:text-white">{s.value}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Personal information" />
          <CardBody className="divide-y divide-zinc-100 pt-0 dark:divide-ink-700">
            <InfoRow icon={IdCard} label="Student ID" value={user.studentId} />
            <InfoRow icon={Mail} label="University email" value={user.email} />
            <InfoRow icon={Phone} label="Phone" value={user.phone} />
            <InfoRow icon={Building2} label="University" value={user.university || "Uttara University"} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Academic information" />
          <CardBody className="divide-y divide-zinc-100 pt-0 dark:divide-ink-700">
            <InfoRow icon={Layers} label="Department" value={user.department} />
            <InfoRow icon={GraduationCap} label="Program" value={user.program} />
            <InfoRow icon={CalendarRange} label="Semester" value={user.semester} />
            <InfoRow icon={Award} label="Batch" value={user.batch} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Current courses" description={`${courses.items.length} courses this semester`} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {courses.items.map((c) => {
              const col = getColor(c.color);
              return (
                <span key={c.id} className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm", col.bg)}>
                  <span className={cn("font-semibold", col.text)}>{c.code}</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{c.name}</span>
                </span>
              );
            })}
            {courses.items.length === 0 && <p className="text-sm text-zinc-500">No courses added yet.</p>}
          </div>
        </CardBody>
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        size="lg"
        title="Edit profile"
        description="Changes are saved to this browser."
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="profile-form">
              Save changes
            </Button>
          </>
        }
      >
        <form id="profile-form" onSubmit={save} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name || ""} onChange={set("name")} error={errors.name} />
            <Input label="Student ID" value={form.studentId || ""} onChange={set("studentId")} />
          </div>
          <Input label="Email" value={form.email || ""} disabled hint="Email cannot be changed." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Department" value={form.department || DEPARTMENTS[0]} onChange={set("department")} options={DEPARTMENTS.includes(form.department) || !form.department ? DEPARTMENTS : [form.department, ...DEPARTMENTS]} />
            <Select label="Semester" value={form.semester || SEMESTERS[0]} onChange={set("semester")} options={SEMESTERS} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Program" value={form.program || ""} onChange={set("program")} />
            <Input label="Batch" value={form.batch || ""} onChange={set("batch")} placeholder="Batch 57" />
          </div>
          <Input label="Phone" value={form.phone || ""} onChange={set("phone")} placeholder="+880 1XXX-XXXXXX" />
          <Textarea label="Bio" value={form.bio || ""} onChange={set("bio")} placeholder="A short intro about yourself" />
          <div className="border-t border-zinc-100 pt-4 dark:border-ink-700">
            <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Academic record</p>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Input label="CGPA" type="number" step="0.01" value={form.cgpa || ""} onChange={set("cgpa")} error={errors.cgpa} />
              <Input label="Credits" type="number" value={form.creditsCompleted || ""} onChange={set("creditsCompleted")} />
              <Input label="Courses" type="number" value={form.coursesCompleted || ""} onChange={set("coursesCompleted")} />
              <Input label="Attendance %" type="number" value={form.attendance || ""} onChange={set("attendance")} error={errors.attendance} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
