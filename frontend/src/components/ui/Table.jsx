"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const Table = React.forwardRef(({ className, children, ...props }, ref) => (
  <div className="w-full overflow-x-auto">
    <table
      ref={ref}
      className={cn("w-full text-left text-xs border-collapse", className)}
      {...props}
    >
      {children}
    </table>
  </div>
));
Table.displayName = "Table";

export const TableHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-slate-50 dark:bg-[#191B15] border-b border-slate-100 dark:border-[#33372B] text-slate-500 dark:text-[#9BA3AF] font-semibold uppercase tracking-wider text-[11px]",
      className
    )}
    {...props}
  >
    {children}
  </thead>
));
TableHeader.displayName = "TableHeader";

export const TableBody = React.forwardRef(({ className, children, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("divide-y divide-slate-100 dark:divide-[#2B2E25]", className)}
    {...props}
  >
    {children}
  </tbody>
));
TableBody.displayName = "TableBody";

export const TableRow = React.forwardRef(({ className, children, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "hover:bg-slate-50/70 dark:hover:bg-[#191B15]/50 transition-colors group",
      className
    )}
    {...props}
  >
    {children}
  </tr>
));
TableRow.displayName = "TableRow";

export const TableHead = React.forwardRef(({ className, children, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("py-2.5 px-3.5 font-semibold", className)}
    {...props}
  >
    {children}
  </th>
));
TableHead.displayName = "TableHead";

export const TableCell = React.forwardRef(({ className, children, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("py-2.5 px-3.5 align-middle", className)}
    {...props}
  >
    {children}
  </td>
));
TableCell.displayName = "TableCell";
