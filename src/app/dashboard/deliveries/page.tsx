"use client";

import { useEffect, useState } from "react";
import { deliveryService, IDeliveryOrder } from "@/services/deliveryService";
import { useAuth } from "@/hooks/useAuth";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  Phone,
  AlertCircle,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";

export default function StudentDeliveriesPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<IDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDeliveries();
  }, []);

  const fetchMyDeliveries = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getMyDeliveries();
      if (res.success) {
        setDeliveries(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status: string) => {
    if (status === "delivered") return 3;
    if (status === "dispatched" || status === "shipped") return 2;
    if (status === "processing") return 1;
    return 0; // pending_processing
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Truck}
          title={
            <EditableContent
              configKey="deliveries_title"
              initialValue="Physical Parcel & Courier Tracking"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="deliveries_desc"
              initialValue="Real-time delivery progress for monthly lecture tutes, revision booklets, and study pack orders."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              <Link href="/study-packs">
                <Button variant="outline" className="text-xs font-semibold rounded-xl">
                  <Video className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  <span>Digital Study Packs</span>
                </Button>
              </Link>
              <Link href="/store">
                <Button className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold px-4 py-2">
                  <Package className="w-4 h-4" />
                  <span>Visit Store</span>
                </Button>
              </Link>
            </div>
          }
        />

        {/* Content wrapped in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="deliveries_list_heading"
              initialValue="Dispatched Study Packs & Orders"
              as="span"
            />
          }
          icon={Package}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : deliveries.length === 0 ? (
            <ClayEmptyState
              illustration={CLAY_ASSETS.emptyDeliveriesPack}
              title="No Active Deliveries"
              description="When you order printed tutes or enroll in classes with physical study pack delivery, your tracking status will update here."
              action={{
                label: "Browse Store Materials",
                href: "/store",
              }}
            />
          ) : (
            <div className="space-y-6 pt-2">
              {deliveries.map((delivery) => {
                const step = getStepIndex(delivery.status);
                const steps = ["Order Placed", "Packaging", "In Transit", "Delivered"];
                const statusIllustration =
                  step === 3
                    ? CLAY_ASSETS.deliveryCompleted
                    : CLAY_ASSETS.deliveryInTransit;

                return (
                  <div
                    key={delivery._id}
                    className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6"
                  >
                    {/* Top Row: Order ID + Status Badge + Clay Illustration */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 shrink-0 drop-shadow-xs">
                          <Image src={statusIllustration} alt="Delivery status" fill className="object-contain" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-white">
                              Waybill #{delivery.order_id}
                            </span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-primary/10 text-primary">
                              {delivery.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Method: {delivery.delivery_method} • Ordered on{" "}
                            {new Date(delivery.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {delivery.tracking_number && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">Tracking:</span>
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                            {delivery.tracking_number}
                          </span>
                          {delivery.courier_service && (
                            <span className="text-[10px] text-slate-400">({delivery.courier_service})</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Stepper Progress Bar */}
                    <div className="relative py-2">
                      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 dark:bg-slate-700" />
                      <div
                        className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-primary transition-all duration-500"
                        style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
                      />

                      <div className="relative flex justify-between">
                        {steps.map((label, idx) => {
                          const isDone = idx <= step;
                          const isCurrent = idx === step;

                          return (
                            <div key={label} className="flex flex-col items-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                  isDone
                                    ? "bg-primary text-white shadow-sm ring-4 ring-primary/20"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                                }`}
                              >
                                {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span
                                className={`text-[11px] mt-2 font-medium ${
                                  isCurrent
                                    ? "text-primary font-bold"
                                    : isDone
                                    ? "text-slate-700 dark:text-slate-300"
                                    : "text-slate-400"
                                }`}
                              >
                                {label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items and Address Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Delivery Destination
                        </span>
                        <div className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{delivery.shipping_address}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                          <Phone className="w-4 h-4 text-primary shrink-0" />
                          <span>
                            {delivery.recipient_phone} ({delivery.recipient_name})
                          </span>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                          Included Parcel Items
                        </span>
                        <div className="space-y-1">
                          {delivery.items && delivery.items.length > 0 ? (
                            delivery.items.map((item: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                              >
                                <span className="truncate">{item.title || "Course Material Pack"}</span>
                                <span className="font-semibold text-slate-500">x{item.quantity || 1}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              Class monthly study pack and notes bundle
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardSection>
      </div>
    </div>
  );
}
