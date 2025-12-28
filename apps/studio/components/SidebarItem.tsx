import Link from "next/link";
import { LucideIcon } from "lucide-react";

type SidebarItemProps = {
  href: string;
  icon: LucideIcon;
  label: string;
  className?: string;
  iconClassName?: string;
};

export default function SidebarItem({
  href,
  icon: Icon,
  label,
  className,
  iconClassName,
}: SidebarItemProps) {
  return (
    <li className={`w-full flex justify-center ${className}`}>
      <Link
        href={href}
        className="group flex w-full justify-center rounded-lg px-2 py-3 transition-colors"
      >
        <div className="flex flex-col items-center gap-1">
          <Icon
            className={`size-6 transition-colors duration-500 text-muted-foreground group-hover:text-primary ${iconClassName}`}
          />

          {/* Label space is always reserved */}
          <span className="text-[10px] text-muted-foreground transition-all duration-500 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0">
            {label}
          </span>
        </div>
      </Link>
    </li>
  );
}
