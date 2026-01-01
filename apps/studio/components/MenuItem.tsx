import { useState } from "react";
import React from "react";

const MenuItem = ({ icon, label, isDanger = false }: { icon: React.ReactNode; label: string; isDanger?: boolean }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group cursor-pointer
        ${isDanger ? "text-red-400 hover:bg-red-500/10" : "text-neutral-400 hover:bg-neutral-800"}`}
    >
      <span className={`transition-colors ${isDanger ? "text-red-400 group-hover:text-red-500" : "text-neutral-500 group-hover:text-primary"}`}>
        {React.cloneElement(icon as React.ReactElement<{ hovered: boolean }>, { hovered })}
      </span>
      {label}
    </button>
  );
};

export { MenuItem };