import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Top Tier-1 MNC Enterprise SearchBar
 * Standard 36px (h-9) enterprise height, centered icons, smooth focus transition
 */
export const SearchBar = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Search...",
  className,
  disabled = false,
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative flex-1", className)}>
      <Search className="w-4 h-4 text-slate-400 dark:text-[#7C8189] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm rounded-lg border border-slate-300 dark:border-[#323744] bg-white dark:bg-[#181A20] text-slate-900 dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-[#7C8189] shadow-2xs transition-colors focus:border-slate-400 dark:focus:border-[#545963] focus:outline-none focus:ring-2 focus:ring-[#A0BDDB]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
          title="Clear search"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
};

export default SearchBar;
