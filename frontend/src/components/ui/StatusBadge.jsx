"use client";
import { AnimatedBadge } from "@/components/ui/AnimatedBadge";
import {
  Clock,
  PackageCheck,
  CheckCircle2,
  Ban,
  Send,
  Navigation,
  Truck,
  AlertCircle,
  Activity,
} from "lucide-react";

const STATUS_CONFIGS = {
  order: {
    DRAFT: { variant: "default", icon: Clock, label: "DRAFT" },
    CONFIRMED: { variant: "warning", icon: PackageCheck, label: "STOCK RESERVED", pulse: true },
    FULFILLED: { variant: "success", icon: CheckCircle2, label: "FULFILLED" },
    CANCELLED: { variant: "danger", icon: Ban, label: "CANCELLED" },
  },
  po: {
    DRAFT: { variant: "default", icon: Clock, label: "DRAFT" },
    ISSUED: { variant: "warning", icon: Send, label: "ISSUED TO VENDOR", pulse: true },
    RECEIVED: { variant: "success", icon: CheckCircle2, label: "GOODS RECEIVED" },
    CANCELLED: { variant: "danger", icon: Ban, label: "CANCELLED" },
  },
  shipment: {
    PENDING: { variant: "default", icon: Clock, label: "Pending Pickup" },
    IN_TRANSIT: { variant: "warning", icon: Navigation, label: "In Transit", pulse: true },
    OUT_FOR_DELIVERY: { variant: "warning", icon: Truck, label: "Out for Delivery", pulse: true },
    DELIVERED: { variant: "success", icon: CheckCircle2, label: "Delivered" },
    CANCELLED: { variant: "danger", icon: Ban, label: "Cancelled" },
  },
  invoice: {
    DRAFT: { variant: "default", icon: Clock, label: "Draft" },
    ISSUED: { variant: "warning", icon: Send, label: "Issued (Unpaid)" },
    PARTIALLY_PAID: { variant: "warning", icon: Clock, label: "Partially Paid", pulse: true },
    PAID: { variant: "success", icon: CheckCircle2, label: "Paid in Full" },
    OVERDUE: { variant: "danger", icon: AlertCircle, label: "Overdue" },
    VOID: { variant: "danger", icon: Ban, label: "Void" },
  },
};

/**
 * Standard Reusable StatusBadge
 * @param {string} status - The entity status string (e.g., 'CONFIRMED', 'DELIVERED', 'PAID')
 * @param {string} [type] - Entity domain ('order', 'po', 'shipment', 'invoice')
 * @param {string} [className] - Additional class names
 */
export function StatusBadge({ status, type, className = "" }) {
  if (!status) return null;

  const upperStatus = String(status).toUpperCase();

  // 1. Look up exact match in domain config
  let config = type && STATUS_CONFIGS[type] ? STATUS_CONFIGS[type][upperStatus] : null;

  // 2. If not found by type, attempt generic cross-domain fallback
  if (!config) {
    for (const domainKey of ["order", "po", "shipment", "invoice"]) {
      if (STATUS_CONFIGS[domainKey][upperStatus]) {
        config = STATUS_CONFIGS[domainKey][upperStatus];
        break;
      }
    }
  }

  // 3. Ultimate fallback
  if (!config) {
    return (
      <AnimatedBadge
        statusKey={upperStatus}
        variant="default"
        icon={Activity}
        className={className}
      >
        {status}
      </AnimatedBadge>
    );
  }

  const IconComponent = config.icon;

  return (
    <AnimatedBadge
      statusKey={upperStatus}
      variant={config.variant}
      icon={IconComponent}
      pulse={config.pulse || false}
      className={className}
    >
      {config.label}
    </AnimatedBadge>
  );
}
