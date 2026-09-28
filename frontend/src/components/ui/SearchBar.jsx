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
      <Search className="w-4 h-4 text-[#6D8C73] dark:text-[#7C8189] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm rounded-lg border border-[#BDC9B8] dark:border-[#4C6B55] bg-[#F7F3EA] dark:bg-[#1B2A20] text-[#314C3B] dark:text-[#F4F5F7] placeholder-slate-400 dark:placeholder-[#7C8189] shadow-2xs transition-colors focus:border-slate-400 dark:focus:border-[#6D8C73] focus:outline-none focus:ring-2 focus:ring-[#92AA97]/30 disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6D8C73] hover:text-[#4C6B55] dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
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
