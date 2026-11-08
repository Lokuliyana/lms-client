"use client";

import React from "react";
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Clock,
  ExternalLink,
  Phone,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export interface DeliveryStepperProps {
  orderId?: string;
  status: string; // "pending_processing" | "processing" | "dispatched" | "shipped" | "delivered" | "cancelled"
  courierService?: string;
  trackingNumber?: string;
  shippingAddress?: string;
  recipientPhone?: string;
  recipientName?: string;
  dispatchedAt?: string;
  deliveredAt?: string;
  createdAt?: string;
  className?: string;
}

const STEPS = [
  {
    key: "pending_processing",
    label: "Order Confirmed",
    desc: "Order verified & queued",
    icon: Clock,
  },
  {
    key: "processing",
    label: "Packaging Notes",
    desc: "Printed book being bound",
    icon: Package,
  },
  {
    key: "dispatched",
    label: "Dispatched",
    desc: "Handed over to courier",
    icon: Truck,
  },
  {
    key: "shipped",
    label: "In Transit",
    desc: "Out for home delivery",
    icon: MapPin,
  },
  {
    key: "delivered",
    label: "Delivered",
    desc: "Delivered to destination",
    icon: CheckCircle2,
  },
];

const STATUS_ORDER: Record<string, number> = {
  pending_processing: 0,
  pending: 0,
  confirmed: 0,
  processing: 1,
  packaging: 1,
  dispatched: 2,
  shipped: 3,
  in_transit: 3,
  delivered: 4,
  completed: 4,
};

export const DeliveryStepper: React.FC<DeliveryStepperProps> = ({
  orderId,
  status,
  courierService,
  trackingNumber,
  shippingAddress,
  recipientPhone,
  recipientName,
  dispatchedAt,
  deliveredAt,
  createdAt,
  className = "",
}) => {
  const isCancelled = status === "cancelled";
  const currentIndex = STATUS_ORDER[status] !== undefined ? STATUS_ORDER[status] : 0;

  return (
    <div
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-6 ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Package className="w-3.5 h-3.5" />
              Physical Notes Fulfillment
            </span>
            {orderId && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                #{orderId}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
            Hardcopy Study Book Delivery Status
          </h3>
        </div>

        {/* Courier / Tracking badge if available */}
        {trackingNumber ? (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {courierService || "Courier"} Tracking
            </span>
            <span className="text-xs font-mono font-semibold text-primary select-all">
              {trackingNumber}
            </span>
          </div>
        ) : (
          <div className="text-right hidden sm:block">
            <span className="text-xs text-slate-400">
              {createdAt ? `Ordered on ${new Date(createdAt).toLocaleDateString()}` : "Processing dispatch"}
            </span>
          </div>
        )}
      </div>

      {isCancelled ? (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">Fulfillment Order Cancelled</p>
            <p className="text-red-600 dark:text-red-400/80 mt-0.5">
              The physical delivery for this study pack was cancelled. Digital access remains active.
            </p>
          </div>
        </div>
      ) : (
        /* Stepper Flow */
        <div className="relative py-2">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-8 right-8 -translate-y-5 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{
                width: `${(currentIndex / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;

              return (
                <div
                  key={step.key}
                  className={`flex md:flex-col items-center gap-3 md:text-center transition-all ${
                    isCurrent
                      ? "opacity-100"
                      : isPast
                      ? "opacity-90"
                      : "opacity-40"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border transition-all shadow-xs ${
                      isPast
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : isCurrent
                        ? "bg-indigo-600 text-white border-indigo-600 ring-4 ring-indigo-500/20 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {isPast ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold leading-tight ${
                        isCurrent
                          ? "text-indigo-600 dark:text-indigo-400"
                          : isPast
                          ? "text-slate-900 dark:text-slate-200"
                          : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recipient & Shipping Summary Details */}
      {(shippingAddress || recipientPhone || recipientName) && (
        <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                Delivery Address: {shippingAddress || "Registered profile address"}
              </span>
              {recipientName && (
                <span className="text-[11px] text-slate-400">
                  Recipient: {recipientName}
                </span>
              )}
            </div>
          </div>

          {recipientPhone && (
            <div className="flex items-center gap-1.5 shrink-0 text-slate-500 dark:text-slate-400">
              <Phone className="w-3.5 h-3.5" />
              <span>{recipientPhone}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryStepper;
