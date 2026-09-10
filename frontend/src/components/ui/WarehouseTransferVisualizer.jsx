import React from "react";
import { motion } from "framer-motion";
import { Warehouse as WarehouseIcon, Package, CheckCircle2, Truck, Ban } from "lucide-react";
import { getTransition, RELATIVE_OFFSET, useReducedMotion } from "@/motion";
export const WarehouseTransferVisualizer = ({ transfer, className = "", }) => {
    const prefersReducedMotion = useReducedMotion();
    const isTransit = transfer.status === "IN_TRANSIT";
    const isReceived = transfer.status === "RECEIVED";
    const isCancelled = transfer.status === "CANCELLED";
    return (<div className={`p-4 bg-zinc-50 border border-zinc-200 rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-3 text-xs">
        <span className="font-semibold text-zinc-500 uppercase tracking-wider">
          Stock Transit Route &bull; {transfer.transfer_number}
        </span>
        <span className="font-mono text-zinc-900 font-medium">
          {transfer.quantity} {transfer.product?.unit || "units"} of {transfer.product?.name || "Product"}
        </span>
      </div>

      <div className="relative flex items-center justify-between px-6 py-4 bg-white border border-zinc-200 rounded-lg">
        {/* Source Warehouse Node */}
        <div className="flex flex-col items-center text-center z-10">
          <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-800 shadow-xs">
            <WarehouseIcon className="w-5 h-5"/>
          </div>
          <span className="text-xs font-semibold text-zinc-900 mt-2">
            {transfer.source_warehouse?.name || "Source WH"}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {transfer.source_warehouse?.code || "SRC"}
          </span>
        </div>

        {/* 2D Transit Corridor Track */}
        <div className="flex-1 mx-6 relative flex items-center justify-center">
          <div className="w-full h-1 bg-zinc-200 rounded-full relative overflow-hidden">
            {/* Base line state */}
            <div className={`h-full ${isReceived ? "bg-zinc-900" : isCancelled ? "bg-red-400" : "bg-zinc-300"}`}/>

            {/* A single cue confirms the real in-transit status without a distracting loop. */}
            {isTransit && !prefersReducedMotion && (<motion.div className="absolute top-0 bottom-0 w-16 bg-gradient-to-r from-transparent via-zinc-900 to-transparent" initial={{ x: RELATIVE_OFFSET.transitStart }} animate={{ x: RELATIVE_OFFSET.transitEnd }} transition={getTransition("complex", prefersReducedMotion)}/>)}
          </div>

          {/* Central Cargo Indicator */}
          <div className="absolute -top-3">
            {isTransit ? (<div className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-medium flex items-center gap-1 shadow-sm">
                <Truck className="w-3 h-3 text-zinc-300"/>
                <span>In Transit</span>
              </div>) : isReceived ? (<div className="px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[10px] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-zinc-400"/>
                <span>Delivered</span>
              </div>) : isCancelled ? (<div className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-medium flex items-center gap-1 border border-red-200">
                <Ban className="w-3 h-3"/>
                <span>Cancelled</span>
              </div>) : (<div className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-medium flex items-center gap-1 border border-zinc-300">
                <Package className="w-3 h-3"/>
                <span>Requested</span>
              </div>)}
          </div>
        </div>

        {/* Destination Warehouse Node */}
        <div className="flex flex-col items-center text-center z-10">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-xs border ${isReceived
            ? "bg-zinc-900 text-white border-zinc-900"
            : "bg-zinc-100 border-zinc-300 text-zinc-800"}`}>
            <WarehouseIcon className="w-5 h-5"/>
          </div>
          <span className="text-xs font-semibold text-zinc-900 mt-2">
            {transfer.destination_warehouse?.name || "Dest WH"}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {transfer.destination_warehouse?.code || "DEST"}
          </span>
        </div>
      </div>
    </div>);
};
