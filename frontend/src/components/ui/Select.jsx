"use client";
import React, { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Premium FlowStock Custom Select Component
 * 
 * Replaces ugly native OS <select> popups with luxury-styled dropdowns:
 * - Fluid bone/smoky-black palette (#11120D, #D8CFBC, #565449)
 * - Auto-detects screen boundary to flip upwards if near screen bottom
 * - Smooth Framer Motion reveal with AnimatePresence
 * - Keyboard navigation (Up/Down/Enter/Escape)
 * - Click-outside dismiss
 * - Supports both `options={[ { value, label, subtext, icon } ]}` prop AND `<option>` children
 */
export const Select = React.forwardRef(({
  value,
  onChange,
  options = [],
  children,
  placeholder = "Select an option...",
  disabled = false,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  size = "md", // "sm" | "md"
  name,
  id,
  icon: LeadingIcon,
  ariaLabel,
  required = false,
  ...props
}, ref) => {
  const generatedId = useId();
  const selectId = id || generatedId;
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Normalize options from either `options` prop or `children` (<option> tags)
  const normalizedOptions = React.useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) => {
        if (typeof opt === "string" || typeof opt === "number") {
          return { value: opt, label: String(opt) };
        }
        return opt;
      });
    }

    const items = [];
    if (children) {
      React.Children.forEach(children, (child) => {
        if (React.isValidElement(child)) {
          const val = child.props.value !== undefined ? child.props.value : child.props.children;
          items.push({
            value: val,
            label: child.props.children || String(val),
            disabled: child.props.disabled || false,
            className: child.props.className,
          });
        }
      });
    }
    return items;
  }, [options, children]);

  // Find currently selected option object
  const selectedOption = normalizedOptions.find(
    (opt) => String(opt.value) === String(value)
  );

  // Determine open direction on toggle
  const toggleDropdown = () => {
    if (disabled) return;
    if (!isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      // If less than 240px below and more space above, open upwards
      setOpenUpward(spaceBelow < 240 && spaceAbove > spaceBelow);

      // Pre-highlight current selection
      const currentIdx = normalizedOptions.findIndex((opt) => String(opt.value) === String(value));
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0);
    }
    setIsOpen((prev) => !prev);
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!isOpen) {
        toggleDropdown();
      } else if (highlightedIndex >= 0 && highlightedIndex < normalizedOptions.length) {
        selectOption(normalizedOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        toggleDropdown();
      } else {
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < normalizedOptions.length && normalizedOptions[next].disabled) {
            next++;
          }
          return next < normalizedOptions.length ? next : prev;
        });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        toggleDropdown();
      } else {
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && normalizedOptions[next].disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
      }
    } else if (e.key === "Tab") {
      if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  // Auto-scroll highlighted option into view
  useEffect(() => {
    if (isOpen && listRef.current && highlightedIndex >= 0) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [isOpen, highlightedIndex]);

  const selectOption = (opt) => {
    if (opt.disabled) return;
    setIsOpen(false);
    if (onChange) {
      // Fire synthetic event compatible with native e.target.value handlers
      const syntheticEvent = {
        target: { value: opt.value, name },
        currentTarget: { value: opt.value, name },
        value: opt.value,
      };
      onChange(syntheticEvent, opt.value);
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={cn("relative inline-block w-full text-left select-none", className)}
      {...props}
    >
      {/* Hidden input for native form compatibility */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ""}
          required={required}
        />
      )}

      {/* Trigger Button */}
      <button
        ref={ref}
        type="button"
        id={selectId}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={toggleDropdown}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full flex items-center justify-between text-left transition-all duration-150 rounded-xl cursor-pointer outline-none",
          "border border-slate-300 dark:border-[#33372B]",
          "bg-white dark:bg-[#181A20] text-slate-900 dark:text-[#FFFBF4]",
          "hover:border-slate-400 dark:hover:border-[#565449]",
          "focus:border-[#D8CFBC] dark:focus:border-[#D8CFBC] focus:ring-1 focus:ring-[#D8CFBC]",
          disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-[#11120D]",
          isSmall ? "px-2.5 py-1.5 text-xs h-8" : "px-3.5 py-2.5 text-sm h-10",
          buttonClassName
        )}
      >
        <span className="flex items-center gap-2 truncate pr-2">
          {LeadingIcon && (
            <LeadingIcon className={cn("text-slate-400 dark:text-[#9BA3AF] shrink-0", isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
          )}
          {selectedOption ? (
            <span className="truncate font-normal text-slate-900 dark:text-[#FFFBF4]">
              {selectedOption.label}
            </span>
          ) : (
            <span className="truncate text-slate-400 dark:text-[#7C8189]">
              {placeholder}
            </span>
          )}
        </span>

        <ChevronDown
          className={cn(
            "text-slate-400 dark:text-[#9BA3AF] shrink-0 transition-transform duration-200",
            isSmall ? "w-3.5 h-3.5" : "w-4 h-4",
            isOpen && "rotate-180 text-slate-700 dark:text-[#D8CFBC]"
          )}
        />
      </button>

      {/* Floating Menu with Luxury Animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 6 : -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute left-0 right-0 z-[150] rounded-xl overflow-hidden shadow-2xl backdrop-blur-md",
              "bg-white/98 dark:bg-[#191B15]/98 border border-slate-200 dark:border-[#33372B]",
              openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5",
              dropdownClassName
            )}
          >
            <div
              ref={listRef}
              role="listbox"
              aria-label={placeholder}
              className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 focus:outline-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-[#33372B]"
            >
              {normalizedOptions.length === 0 ? (
                <div className="px-3 py-3 text-xs text-center text-slate-400 dark:text-[#7C8189]">
                  No options available
                </div>
              ) : (
                normalizedOptions.map((opt, idx) => {
                  const isSelected = String(opt.value) === String(value);
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={String(opt.value) + idx}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectOption(opt)}
                      onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                      className={cn(
                        "relative flex items-center justify-between rounded-lg cursor-pointer transition-colors duration-100",
                        isSmall ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm",
                        isSelected
                          ? "bg-[#D8CFBC]/25 dark:bg-[#D8CFBC]/20 font-semibold text-slate-950 dark:text-[#FFFBF4]"
                          : isHighlighted
                          ? "bg-slate-100 dark:bg-[#23261E] text-slate-900 dark:text-[#FFFBF4]"
                          : "text-slate-700 dark:text-[#9BA3AF] hover:bg-slate-50 dark:hover:bg-[#1E2019]",
                        opt.disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate leading-snug">{opt.label}</span>
                        {opt.subtext && (
                          <span className="text-[11px] text-slate-400 dark:text-[#7C8189] font-normal truncate">
                            {opt.subtext}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <Check className={cn("text-slate-900 dark:text-[#D8CFBC] shrink-0 ml-2", isSmall ? "w-3.5 h-3.5" : "w-4 h-4")} />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Select.displayName = "Select";
