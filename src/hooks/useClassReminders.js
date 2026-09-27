import { useEffect } from "react";
import { useData } from "../context/DataContext";
import { useToast } from "../context/ToastContext";
import useNow from "./useNow";
import { getNextClass, toDateInput } from "../utils/helpers";

/** Pushes an "Upcoming class" notification ~15 minutes before each class (once per session). */
export default function useClassReminders() {
  const { routine, settings, pushNotification } = useData();
  const toast = useToast();
  const now = useNow(30000);

  useEffect(() => {
    if (!settings.classReminders) return;
    const next = getNextClass(routine.items, now);
    if (!next || next.status !== "upcoming") return;
    const mins = (next.start - now) / 60000;
    if (mins > 15 || mins < 0) return;
    const key = `uu_reminded_${next.cls.id}_${toDateInput(next.start)}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    const m = Math.max(1, Math.round(mins));
    pushNotification({
      type: "class",
      title: "Upcoming class",
      message: `${next.cls.courseName} (${next.cls.courseCode}) starts in ${m} min · ${next.cls.room}`,
    });
    toast.info("Class starting soon", `${next.cls.courseName} in ${m} min · ${next.cls.room}`);
  }, [now]); // eslint-disable-line react-hooks/exhaustive-deps
}
