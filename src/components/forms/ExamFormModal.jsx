import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input, { Textarea } from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { addDays, toDateInput } from "../../utils/helpers";

const empty = () => ({ course: "", title: "", type: "Midterm", date: toDateInput(addDays(new Date(), 7)), time: "10:00", room: "", syllabus: "" });

export default function ExamFormModal({ open, onClose, onSubmit, initial }) {
  const { courses } = useData();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      const first = courses.items[0];
      setForm(initial ? { ...empty(), ...initial } : { ...empty(), course: first?.code || "", title: first?.name || "" });
      setErrors({});
    }
  }, [open, initial, courses.items]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onCourse = (e) => {
    const c = courses.items.find((x) => x.code === e.target.value);
    setForm((f) => ({ ...f, course: e.target.value, title: c?.name || f.title }));
  };

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.course) errs.course = "Select a course.";
    if (!form.date) errs.date = "Date is required.";
    if (!form.time) errs.time = "Time is required.";
    if (!form.room.trim()) errs.room = "Room is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...form, room: form.room.trim() });
  };

  const courseOptions = courses.items.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  if (form.course && !courseOptions.some((o) => o.value === form.course)) courseOptions.unshift({ value: form.course, label: form.course });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit exam" : "Add exam"}
      description="Keep track of your upcoming exams and quizzes."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="exam-form">
            {initial ? "Save changes" : "Add exam"}
          </Button>
        </>
      }
    >
      <form id="exam-form" onSubmit={submit} className="space-y-4" noValidate>
        <Select label="Course" required value={form.course} onChange={onCourse} options={courseOptions} placeholder="Select course" error={errors.course} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Exam type" value={form.type} onChange={set("type")} options={["Quiz", "Midterm", "Final", "Lab Exam", "Viva", "Presentation"]} />
          <Input label="Room" required placeholder="Room 501" value={form.room} onChange={set("room")} error={errors.room} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Date" required type="date" value={form.date} onChange={set("date")} error={errors.date} />
          <Input label="Time" required type="time" value={form.time} onChange={set("time")} error={errors.time} />
        </div>
        <Textarea label="Syllabus / notes" placeholder="Topics covered…" value={form.syllabus} onChange={set("syllabus")} />
      </form>
    </Modal>
  );
}
