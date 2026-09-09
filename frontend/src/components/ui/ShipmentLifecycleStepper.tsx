"use client";

import React from "react";
import { Clock, Truck, Navigation, CheckCircle2 } from "lucide-react";
import { LifecycleStepper, LifecycleStepDef } from "./LifecycleStepper";

export type ShipmentStatus = "PENDING" | "IN_TRANSIT" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

export interface ShipmentLifecycleStepperProps {
  status: ShipmentStatus;
  carrier?: string;
  trackingNumber?: string;
  className?: string;
}

const SHIPMENT_STEPS: LifecycleStepDef[] = [
  {
    key: "PENDING",
    label: "Manifested",
    sublabel: "Awaiting pickup",
    icon: Clock,
  },
  {
    key: "IN_TRANSIT",
    label: "In Transit",
    sublabel: "Hub to hub transit",
    icon: Truck,
  },
  {
    key: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    sublabel: "Courier dispatched",
    icon: Navigation,
  },
  {
    key: "DELIVERED",
    label: "Delivered",
    sublabel: "Consignee received",
    icon: CheckCircle2,
  },
];

const getShipmentStepIndex = (st: ShipmentStatus): number => {
  switch (st) {
    case "PENDING":
      return 0;
    case "IN_TRANSIT":
      return 1;
    case "OUT_FOR_DELIVERY":
      return 2;
    case "DELIVERED":
      return 3;
    case "CANCELLED":
      return -1;
    default:
      return 0;
  }
};

export const ShipmentLifecycleStepper: React.FC<ShipmentLifecycleStepperProps> = ({
  status,
  carrier,
  trackingNumber,
  className = "",
}) => {
  const isCancelled = status === "CANCELLED";
  const currentIndex = getShipmentStepIndex(status);

  const announcement = isCancelled
    ? undefined
    : currentIndex === 3
    ? "Delivered & Signed"
    : currentIndex === 2
    ? "Out for Delivery"
    : currentIndex === 1
    ? "In Transit"
    : "Manifest Created";

  const titleWithMeta = carrier && trackingNumber
    ? `Logistics Delivery · ${carrier} (${trackingNumber})`
    : "Logistics Delivery Status";

  return (
    <LifecycleStepper
      title={titleWithMeta}
      steps={SHIPMENT_STEPS}
      currentStepIndex={currentIndex}
      isCancelled={isCancelled}
      statusAnnouncement={announcement}
      cancelledMessage="This shipment consignment was cancelled by logistics dispatch."
      className={className}
    />
  );
};
