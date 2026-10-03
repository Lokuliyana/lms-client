"use client";

import { useEffect, useState } from "react";
import { deliveryService, IDeliveryOrder } from "@/services/deliveryService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionHeader } from "@/components/reusable/section-header";
import { CardSection } from "@/components/reusable/card-section";
import { SectionLoader } from "@/components/reusable/section-loader";
import EditableContent from "@/components/admin/editable-content";
import Link from "next/link";
import Image from "next/image";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import {
  Truck,
  Package,
  Search,
  CheckCircle2,
  Clock,
  Send,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Filter,
  Video,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminDeliveriesPage() {
  const [deliveries, setDeliveries] = useState<IDeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Tracking update modal
  const [selectedDelivery, setSelectedDelivery] = useState<IDeliveryOrder | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierService, setCourierService] = useState("Domex Courier");
  const [newStatus, setNewStatus] = useState("dispatched");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchDeliveries();
  }, [statusFilter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await deliveryService.getDeliveries({
        status: statusFilter === "all" ? undefined : statusFilter,
        search: search || undefined,
      });
      if (res.success) {
        setDeliveries(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDeliveries();
  };

  const openUpdateModal = (del: IDeliveryOrder) => {
    setSelectedDelivery(del);
    setTrackingNumber(del.tracking_number || "");
    setCourierService(del.courier_service || "Domex Courier");
    setNewStatus(del.status === "pending_processing" ? "dispatched" : del.status);
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDelivery) return;

    try {
      setIsUpdating(true);
      await deliveryService.updateDeliveryStatus(selectedDelivery._id, {
        status: newStatus,
        tracking_number: trackingNumber.trim(),
        courier_service: courierService.trim(),
      });
      toast.success("Delivery details & tracking updated successfully");
      setSelectedDelivery(null);
      fetchDeliveries();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update tracking");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Truck}
          title={
            <EditableContent
              configKey="admin_deliveries_title"
              initialValue="Physical Dispatch & Parcel Logistics"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="admin_deliveries_desc"
              initialValue="Track student study pack deliveries, assign courier tracking numbers, and fulfill physical shipments."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              <Link href="/admin/study-packs">
                <Button variant="outline" className="text-xs font-semibold rounded-xl">
                  <Video className="w-3.5 h-3.5 mr-1 text-purple-600" />
                  <span>Digital Study Packs Studio</span>
                </Button>
              </Link>
              <div className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Total Dispatches: {deliveries.length}
              </div>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {["all", "pending_processing", "processing", "dispatched", "delivered"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {st === "all"
                  ? "All Deliveries"
                  : st === "pending_processing"
                  ? "Pending Dispatch"
                  : st === "processing"
                  ? "Packing"
                  : st === "dispatched"
                  ? "Dispatched"
                  : "Delivered"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search recipient, order ID, phone..."
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
            />
          </form>
        </div>

        {/* Deliveries Table in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="admin_deliveries_table_heading"
              initialValue="Consolidated Shipment Rosters"
              as="span"
            />
          }
          icon={Package}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Address</th>
                  <th className="py-3 px-4">Courier / Tracking</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="relative w-24 h-24 drop-shadow-sm">
                          <Image src={CLAY_ASSETS.dispatchCourierVan} alt="" fill className="object-contain" />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">No shipments found.</p>
                        <p className="text-xs text-slate-400">No orders match the selected filter criteria.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  deliveries.map((del) => (
                    <tr key={del._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {del.order_id}
                        {del.month_key && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Month: {del.month_key}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {del.recipient_name ||
                              `${del.student_id?.first_name || ""} ${del.student_id?.last_name || ""}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                          <Phone className="w-3 h-3" />
                          <span>{del.recipient_phone || del.student_id?.phone || "No phone"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-start gap-1 text-slate-600 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{del.shipping_address}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {del.tracking_number ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {del.courier_service || "Courier"}
                            </span>
                            <span className="block font-mono text-[11px] text-primary">
                              #{del.tracking_number}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No tracking yet</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] inline-flex items-center gap-1 ${
                            del.status === "delivered"
                              ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                              : del.status === "dispatched" || del.status === "shipped"
                              ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600"
                              : del.status === "processing"
                              ? "bg-purple-100 dark:bg-purple-950/40 text-purple-600"
                              : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                          }`}
                        >
                          {del.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {new Date(del.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUpdateModal(del)}
                          className="rounded-xl text-xs px-2.5 py-1"
                        >
                          Dispatch / Track
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardSection>

        {/* Tracking & Status Modal */}
        {selectedDelivery && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    Update Dispatch: {selectedDelivery.order_id}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Recipient: {selectedDelivery.recipient_name || selectedDelivery.student_id?.first_name}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveTracking} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Fulfillment Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="pending_processing">Pending Processing</option>
                    <option value="processing">Processing & Packing</option>
                    <option value="dispatched">Dispatched (With Courier)</option>
                    <option value="delivered">Delivered to Recipient</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Courier Service Partner
                  </label>
                  <select
                    value={courierService}
                    onChange={(e: any) => setCourierService(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Domex Courier">Domex Courier</option>
                    <option value="Pronto Lanka">Pronto Lanka</option>
                    <option value="PromptX Express">PromptX Express</option>
                    <option value="Koombiyo Delivery">Koombiyo Delivery</option>
                    <option value="Citypak">Citypak</option>
                    <option value="SL Post (Registered Mail)">SL Post (Registered Mail)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Tracking Waybill Number
                  </label>
                  <Input
                    value={trackingNumber}
                    onChange={(e: any) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. DMX-8923019"
                    className="rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDelivery(null)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating}
                    className="rounded-xl bg-primary text-white"
                  >
                    {isUpdating ? "Saving..." : "Save Dispatch Info"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}
