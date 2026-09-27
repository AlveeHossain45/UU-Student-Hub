import { Monitor, Moon, Sun, Check } from "lucide-react";
import Dropdown, { DropdownItem } from "../ui/Dropdown";
import { useTheme } from "../../context/ThemeContext";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const CurrentIcon = resolved === "dark" ? Moon : Sun;
  return (
    <Dropdown
      trigger={({ toggle, open }) => (
        <button
          onClick={toggle}
          aria-label="Change theme"
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-ink-700 dark:hover:text-zinc-100"
        >
          <CurrentIcon size={18} className="transition-transform duration-300" key={resolved} />
        </button>
      )}
      panelClassName="w-44"
    >
      {({ close }) =>
        OPTIONS.map((o) => (
          <DropdownItem
            key={o.value}
            icon={o.icon}
            active={theme === o.value}
            onClick={() => {
              setTheme(o.value);
              close();
            }}
          >
            <span className="flex items-center justify-between">
              {o.label}
              {theme === o.value && <Check size={14} className="text-brand-600 dark:text-brand-400" />}
            </span>
          </DropdownItem>
        ))
      }
    </Dropdown>
  );
}
