"use client";
import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";
import { Button } from "./Button";
import { Card, CardContent } from "./Card";
import { Badge } from "./Badge";

export const AccessDenied = ({ currentPath = "", role = "", meta = {} }) => {
  const navigate = useNavigate();

  const moduleName = currentPath
    ? currentPath.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Module";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-slate-200/90 dark:border-[#262833] shadow-lg">
        <CardContent className="p-8 space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <Badge variant="warning" className="mb-2">
              <Lock className="w-3 h-3 mr-1" />
              Role Restricted
            </Badge>
            <h2 className="text-xl font-bold text-slate-900 dark:text-[#FFFBF4] tracking-tight">
              Access Restricted
            </h2>
            <p className="text-xs text-slate-600 dark:text-[#9BA3AF] leading-relaxed max-w-sm mx-auto">
              The <span className="font-semibold text-slate-900 dark:text-[#FFFBF4]">{moduleName}</span> workspace is not authorized for your current role (<span className="font-semibold text-slate-900 dark:text-[#FFFBF4]">{meta?.label || role}</span>).
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#16181F] border border-slate-200/80 dark:border-[#22242B] text-[11px] text-slate-500 dark:text-[#808594] text-left space-y-1">
            <p className="font-medium text-slate-700 dark:text-[#D8CFBC]">Need access to this module?</p>
            <p>
              Switch your active operator profile in the top-right header, or ask an administrator to adjust your role assignments.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="gap-2 px-4 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Overview</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
