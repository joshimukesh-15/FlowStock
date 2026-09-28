"use client";
import { Clock, PackageCheck, FileText } from "lucide-react";
import { LifecycleStepper } from "./LifecycleStepper";
const ORDER_STEPS = [
    {
        key: "DRAFT",
        label: "Draft",
        sublabel: "Stock unreserved",
        icon: FileText,
    },
    {
        key: "CONFIRMED",
        label: "Confirmed",
        sublabel: "Stock reserved in facility",
        icon: Clock,
    },
    {
        key: "FULFILLED",
        label: "Fulfilled",
        sublabel: "Dispatched & inventory deducted",
        icon: PackageCheck,
    },
];
const getOrderStepIndex = (st) => {
    switch (st) {
        case "DRAFT":
            return 0;
        case "CONFIRMED":
            return 1;
        case "FULFILLED":
            return 2;
        case "CANCELLED":
            return -1;
        default:
            return 0;
    }
};
export const OrderLifecycleStepper = ({ status, className = "", }) => {
    const isCancelled = status === "CANCELLED";
    const currentIndex = getOrderStepIndex(status);
    const announcement = isCancelled
        ? undefined
        : currentIndex === 2
            ? "Completed"
            : currentIndex === 1
                ? "Awaiting fulfillment"
                : "Draft review";
    return (<LifecycleStepper title="Order Lifecycle Status" steps={ORDER_STEPS} currentStepIndex={currentIndex} isCancelled={isCancelled} statusAnnouncement={announcement} cancelledMessage="This order was cancelled. Reserved inventory was released back into available stock." className={className}/>);
};
