import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Input, { Textarea } from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { useData } from "../../context/DataContext";
import { addDays, toDateTimeInput } from "../../utils/helpers";

const empty = () => {
  const d = addDays(new Date(), 3);
  d.setHours(23, 59, 0, 0);
  return { course: "", title: "", description: "", deadline: toDateTimeInput(d), priority: "medium", status: "pending" };
};

export default function AssignmentFormModal({ open, onClose, onSubmit, initial }) {
  const { courses } = useData();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm(initial ? { ...empty(), ...initial } : { ...empty(), course: courses.items[0]?.code || "" });
      setErrors({});
    }
  }, [open, initial, courses.items]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.course.trim()) errs.course = "Select a course.";
    if (form.title.trim().length < 3) errs.title = "Title must be at least 3 characters.";
    if (!form.deadline) errs.deadline = "Deadline is required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    // eslint-disable-next-line no-unused-vars
    const { _status, id, ...clean } = form;
    onSubmit({ ...clean, title: form.title.trim(), description: form.description.trim() });
  };

  const courseOptions = courses.items.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  if (form.course && !courseOptions.some((o) => o.value === form.course)) courseOptions.unshift({ value: form.course, label: form.course });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit assignment" : "New assignment"}
      description={initial ? "Update the details of this assignment." : "Add a new assignment to your tracker."}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="assignment-form">
            {initial ? "Save changes" : "Add assignment"}
          </Button>
        </>
      }
    >
      <form id="assignment-form" onSubmit={submit} className="space-y-4" noValidate>
        <Select label="Course" required value={form.course} onChange={set("course")} options={courseOptions} placeholder="Select course" error={errors.course} />
        <Input label="Title" required placeholder="e.g. Implement AVL Tree" value={form.title} onChange={set("title")} error={errors.title} />
        <Textarea label="Description" placeholder="What needs to be done?" value={form.description} onChange={set("description")} />
        <Input label="Deadline" required type="datetime-local" value={form.deadline} onChange={set("deadline")} error={errors.deadline} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={form.priority}
            onChange={set("priority")}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={set("status")}
            options={[
              { value: "pending", label: "Pending" },
              { value: "in-progress", label: "In Progress" },
              { value: "completed", label: "Completed" },
              { value: "overdue", label: "Overdue" },
            ]}
          />
        </div>
      </form>
    </Modal>
  );
}
