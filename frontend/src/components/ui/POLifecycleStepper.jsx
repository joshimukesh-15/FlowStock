"use client";
import React from "react";
import { Send, PackageCheck, FileText } from "lucide-react";
import { LifecycleStepper } from "./LifecycleStepper";
const PO_STEPS = [
    {
        key: "DRAFT",
        label: "Draft",
        sublabel: "Procurement requisition",
        icon: FileText,
    },
    {
        key: "ISSUED",
        label: "Issued to Vendor",
        sublabel: "Awaiting shipment & delivery",
        icon: Send,
    },
    {
        key: "RECEIVED",
        label: "Goods Received",
        sublabel: "Stock audited & added to DC",
        icon: PackageCheck,
    },
];
const getPOStepIndex = (st) => {
    switch (st) {
        case "DRAFT":
            return 0;
        case "ISSUED":
            return 1;
        case "RECEIVED":
            return 2;
        case "CANCELLED":
            return -1;
        default:
            return 0;
    }
};
export const POLifecycleStepper = ({ status, className = "", }) => {
    const isCancelled = status === "CANCELLED";
    const currentIndex = getPOStepIndex(status);
    const announcement = isCancelled
        ? undefined
        : currentIndex === 2
            ? "Completed & Received"
            : currentIndex === 1
                ? "Awaiting vendor receipt"
                : "Requisition review";
    return (<LifecycleStepper title="Purchase Order Status" steps={PO_STEPS} currentStepIndex={currentIndex} isCancelled={isCancelled} statusAnnouncement={announcement} cancelledMessage="This purchase order was cancelled. Inbound supplier commitments were closed." className={className}/>);
};
