import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input, { Textarea } from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { cn } from "../../utils/cn";
import { COURSE_COLORS, getColor } from "../../utils/helpers";

const empty = { code: "", name: "", credits: 3, instructor: "", progress: 0, color: "blue", description: "" };

export default function CourseFormModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty, ...initial } : empty);
      setErrors({});
    }
  }, [open, initial]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.code.trim()) errs.code = "Course code is required.";
    if (!form.name.trim()) errs.name = "Course name is required.";
    if (!form.instructor.trim()) errs.instructor = "Instructor is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      instructor: form.instructor.trim(),
      credits: Number(form.credits),
      progress: Math.min(100, Math.max(0, Number(form.progress) || 0)),
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit course" : "Add course"}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="course-form">
            {initial ? "Save changes" : "Add course"}
          </Button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Course code" required placeholder="CSE 221" value={form.code} onChange={set("code")} error={errors.code} />
          <Select label="Credits" value={String(form.credits)} onChange={set("credits")} options={["1", "1.5", "2", "3", "4"]} />
        </div>
        <Input label="Course name" required placeholder="Data Structure" value={form.name} onChange={set("name")} error={errors.name} />
        <Input label="Instructor" required placeholder="Dr. Rahman" value={form.instructor} onChange={set("instructor")} error={errors.instructor} />
        <div>
          <label htmlFor="course-progress" className="mb-1.5 flex justify-between text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
            Progress <span className="tabular-nums text-zinc-500">{form.progress}%</span>
          </label>
          <input id="course-progress" type="range" min="0" max="100" value={form.progress} onChange={set("progress")} className="w-full accent-brand-600" />
        </div>
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">Color</legend>
          <div className="flex flex-wrap gap-2">
            {COURSE_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm((f) => ({ ...f, color: c }))}
                aria-label={`Color ${c}`}
                aria-pressed={form.color === c}
                className={cn("h-8 w-8 rounded-full ring-offset-2 transition dark:ring-offset-ink-900", getColor(c).bar, form.color === c ? "ring-2 ring-zinc-900 dark:ring-white" : "hover:scale-110")}
              />
            ))}
          </div>
        </fieldset>
        <Textarea label="Description" placeholder="What is this course about?" value={form.description} onChange={set("description")} />
      </form>
    </Modal>
  );
}
