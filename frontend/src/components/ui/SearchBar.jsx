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
    <form onSubmit={handleSubmit} className={cn("relative flex-1 group", className)}>
      <Search className="w-4 h-4 text-slate-400 dark:text-[#9BA3AF] group-focus-within:text-[#565449] dark:group-focus-within:text-[#D8CFBC] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none shrink-0 transition-colors" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-[#33372B] hover:border-slate-300 dark:hover:border-[#565449] bg-white dark:bg-[#181A20] text-slate-900 dark:text-[#FFFBF4] placeholder:text-slate-400 dark:placeholder:text-[#7C8189] shadow-2xs transition-all duration-150 focus:border-[#565449] dark:focus:border-[#D8CFBC] focus:outline-none focus:ring-2 focus:ring-[#D8CFBC]/25 disabled:opacity-50 disabled:cursor-not-allowed"
        {...props}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-[#D8CFBC] p-1 rounded-md transition-colors cursor-pointer"
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
