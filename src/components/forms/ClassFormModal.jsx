import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { DAYS, timeToMinutes } from "../../utils/helpers";

const empty = (day) => ({ day: day ?? new Date().getDay(), courseCode: "", courseName: "", teacher: "", room: "", start: "09:00", end: "10:30" });

export default function ClassFormModal({ open, onClose, onSubmit, initial, defaultDay }) {
  const { courses } = useData();
  const [form, setForm] = useState(() => empty(defaultDay));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty(), ...initial } : empty(defaultDay));
      setErrors({});
    }
  }, [open, initial, defaultDay]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const pickCourse = (e) => {
    const c = courses.items.find((x) => x.code === e.target.value);
    if (c) setForm((f) => ({ ...f, courseCode: c.code, courseName: c.name, teacher: c.instructor }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.courseCode.trim()) errs.courseCode = "Course code is required.";
    if (!form.courseName.trim()) errs.courseName = "Course name is required.";
    if (!form.teacher.trim()) errs.teacher = "Teacher is required.";
    if (!form.room.trim()) errs.room = "Room is required.";
    if (!form.start) errs.start = "Start time is required.";
    if (!form.end) errs.end = "End time is required.";
    else if (timeToMinutes(form.end) <= timeToMinutes(form.start)) errs.end = "End time must be after start time.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...form, day: Number(form.day), courseCode: form.courseCode.trim().toUpperCase(), courseName: form.courseName.trim(), teacher: form.teacher.trim(), room: form.room.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit class" : "Add class"}
      description="Classes repeat weekly on the selected day."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="class-form">
            {initial ? "Save changes" : "Add class"}
          </Button>
        </>
      }
    >
      <form id="class-form" onSubmit={submit} className="space-y-4" noValidate>
        {!initial && courses.items.length > 0 && (
          <Select
            label="Quick fill from your courses"
            value=""
            onChange={pickCourse}
            placeholder="Choose a course (optional)"
            options={courses.items.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }))}
          />
        )}
        <Select label="Day" value={String(form.day)} onChange={set("day")} options={DAYS.map((d, i) => ({ value: String(i), label: d }))} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Course code" required placeholder="CSE 221" value={form.courseCode} onChange={set("courseCode")} error={errors.courseCode} />
          <Input label="Course name" required placeholder="Data Structure" value={form.courseName} onChange={set("courseName")} error={errors.courseName} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Teacher" required placeholder="Dr. Rahman" value={form.teacher} onChange={set("teacher")} error={errors.teacher} />
          <Input label="Room" required placeholder="Room 502" value={form.room} onChange={set("room")} error={errors.room} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Start time" type="time" required value={form.start} onChange={set("start")} error={errors.start} />
          <Input label="End time" type="time" value={form.end} onChange={set("end")} error={errors.end} />
        </div>
      </form>
    </Modal>
  );
}
