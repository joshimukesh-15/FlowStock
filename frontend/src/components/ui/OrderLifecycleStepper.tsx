"use client";

import React from "react";
import { Clock, PackageCheck, FileText } from "lucide-react";
import { LifecycleStepper, LifecycleStepDef } from "./LifecycleStepper";

export type OrderStatus = "DRAFT" | "CONFIRMED" | "FULFILLED" | "CANCELLED";

export interface OrderLifecycleStepperProps {
  status: OrderStatus;
  createdAt?: string;
  updatedAt?: string;
  className?: string;
}

const ORDER_STEPS: LifecycleStepDef[] = [
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

const getOrderStepIndex = (st: OrderStatus): number => {
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

export const OrderLifecycleStepper: React.FC<OrderLifecycleStepperProps> = ({
  status,
  className = "",
}) => {
  const isCancelled = status === "CANCELLED";
  const currentIndex = getOrderStepIndex(status);

  const announcement = isCancelled
    ? undefined
    : currentIndex === 2
    ? "Completed"
    : currentIndex === 1
    ? "Awaiting fulfillment"
    : "Draft review";

  return (
    <LifecycleStepper
      title="Order Lifecycle Status"
      steps={ORDER_STEPS}
      currentStepIndex={currentIndex}
      isCancelled={isCancelled}
      statusAnnouncement={announcement}
      cancelledMessage="This order was cancelled. Reserved inventory was released back into available stock."
      className={className}
    />
  );
};
