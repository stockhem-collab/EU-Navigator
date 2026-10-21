import Link from "next/link";
import Icon, { IconName } from "@/components/Icon";

// One summary figure: an icon, the number and what it counts. Used in the
// rows of figures on Översikt, Ansöka, Rapportera and Datacenter.
// - warn: amber when the number is above zero (something needs action)
// - pressed: set for figures that work as a filter (a button), dark when on
// - a zero is toned down so the figures that matter stand out
export default function StatCard({
  value,
  label,
  icon,
  href,
  onClick,
  pressed,
  warn = false,
}: {
  value: string | number;
  label: string;
  icon?: IconName;
  href?: string;
  onClick?: () => void;
  pressed?: boolean;
  warn?: boolean;
}) {
  const active = pressed === true;
  const highlight = !active && warn && typeof value === "number" && value > 0;
  const zero = !active && value === 0;
  const interactive = Boolean(href || onClick);

  const box = `group flex h-full items-start gap-3 rounded-xl border p-4 text-left transition ${
    interactive ? "hover:-translate-y-0.5 hover:shadow-md" : ""
  } ${
    active
      ? "border-navy-800 bg-navy-800 text-white"
      : highlight
      ? "border-amber-200 bg-amber-50 hover:border-amber-300"
      : `border-navy-100 bg-white ${interactive ? "hover:border-navy-200" : ""}`
  }`;

  const content = (
    <>
      {icon && (
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            active ? "bg-white/10 text-white" : highlight ? "bg-amber-100 text-amber-700" : zero ? "bg-navy-50 text-navy-300" : "bg-navy-50 text-navy-600"
          }`}
        >
          <Icon name={icon} />
        </span>
      )}
      <span className="min-w-0">
        <span
          className={`block text-2xl font-extrabold leading-tight ${
            active ? "text-white" : highlight ? "text-amber-800" : zero ? "text-navy-300" : "text-navy-900"
          }`}
        >
          {value}
        </span>
        <span className={`mt-0.5 block text-xs [overflow-wrap:anywhere] ${active ? "text-navy-200" : "text-navy-500"}`}>{label}</span>
      </span>
    </>
  );

  if (pressed !== undefined)
    return (
      <button type="button" aria-pressed={pressed} onClick={onClick} className={box}>
        {content}
      </button>
    );
  // Links to a #section stay plain links, as before, so the jump lands on
  // the section's heading.
  if (href?.includes("#") || (href && onClick))
    return (
      <a href={href} onClick={onClick} className={box}>
        {content}
      </a>
    );
  if (href)
    return (
      <Link href={href} className={box}>
        {content}
      </Link>
    );
  return <div className={box}>{content}</div>;
}
