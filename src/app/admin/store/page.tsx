"use client";

import { useEffect, useState } from "react";
import { storeService, IProduct, IStoreOrder } from "@/services/storeService";
import { useAuth } from "@/hooks/useAuth";
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
  Package,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Truck,
  DollarSign,
  Search,
  Layers,
  Video,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminStorePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [orders, setOrders] = useState<IStoreOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Product modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IProduct | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    category: "study_pack",
    inventory_count: 50,
    thumbnail_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchProducts();
    fetchOrders();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await storeService.getProducts({ include_inactive: true });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await storeService.getAllOrders();
      if (res.success) {
        setOrders(res.data);
      }
    } catch (err: any) {
      // non-blocking
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      title: "",
      description: "",
      price: 1500,
      category: "study_pack",
      inventory_count: 50,
      thumbnail_url: "",
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: IProduct) => {
    setEditingProduct(p);
    setFormData({
      title: p.title,
      description: p.description || "",
      price: p.price,
      category: p.category,
      inventory_count: p.inventory_count,
      thumbnail_url: p.thumbnail_url || "",
      is_active: p.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Product title is required");
      return;
    }

    try {
      if (editingProduct) {
        await storeService.updateProduct(editingProduct._id, formData as any);
        toast.success("Product updated successfully");
      } else {
        await storeService.createProduct(formData as any);
        toast.success("Product created successfully");
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save product");
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate/archive this product?")) return;
    try {
      await storeService.deleteProduct(id);
      toast.success("Product archived");
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to archive product");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Package}
          title={
            <EditableContent
              configKey="admin_store_title"
              initialValue="Physical Bookstore & Material Inventory"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="admin_store_desc"
              initialValue="Manage printed course materials, textbooks, stock inventory, and physical delivery orders."
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
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "products"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Products ({products.length})
                </button>
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "orders"
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  Store Orders ({orders.length})
                </button>
              </div>

              {activeTab === "products" && (
                <Button
                  onClick={handleOpenAdd}
                  className="bg-primary hover:bg-primary/90 text-white rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Product
                </Button>
              )}
            </div>
          }
        />

        {/* Tab 1: Products */}
        {activeTab === "products" && (
          <CardSection
            title={
              <EditableContent
                configKey="admin_store_products_heading"
                initialValue="Physical Items & Stock Catalog"
                as="span"
              />
            }
            icon={Package}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Item</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Price (LKR)</th>
                    <th className="py-3 px-4">Stock Count</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="relative w-24 h-24 drop-shadow-sm">
                            <Image src={CLAY_ASSETS.storeHeroCart} alt="" fill className="object-contain" />
                          </div>
                          <p className="text-sm font-semibold text-slate-700">No products created yet.</p>
                          <p className="text-xs text-slate-400">Click &ldquo;Add Product&rdquo; above to publish materials to the bookstore.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center flex-shrink-0 relative">
                              {p.thumbnail_url ? (
                                <img src={p.thumbnail_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Image src={CLAY_ASSETS.storeHeroCart} alt="" fill className="object-contain p-1" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">{p.title}</p>
                              <p className="text-[11px] text-slate-400 line-clamp-1">{p.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium text-slate-600 dark:text-slate-300">
                          {p.category.replace("_", " ")}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          LKR {p.price.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold ${
                              p.inventory_count > 10
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                                : p.inventory_count > 0
                                ? "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                                : "bg-red-100 dark:bg-red-950/40 text-red-600"
                            }`}
                          >
                            {p.inventory_count} in stock
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {p.is_active ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-semibold">
                              <XCircle className="w-3.5 h-3.5" /> Archived
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleArchive(p._id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardSection>
        )}

        {/* Tab 2: Store Orders */}
        {activeTab === "orders" && (
          <CardSection
            title={
              <EditableContent
                configKey="admin_store_orders_heading"
                initialValue="Physical Shipment Orders"
                as="span"
              />
            }
            icon={Truck}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Fulfillment</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400">
                        No orders recorded yet.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {ord.order_id}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {ord.user_id?.first_name || ""} {ord.user_id?.last_name || ""}
                          </p>
                          <p className="text-[11px] text-slate-400">{ord.shipping_address}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-700 dark:text-slate-300">
                            {ord.items?.map((it) => `${it.title} (x${it.quantity})`).join(", ")}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          LKR {ord.total_amount?.toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              ord.payment_status === "paid"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                                : "bg-amber-100 dark:bg-amber-950/40 text-amber-600"
                            }`}
                          >
                            {ord.payment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              ord.fulfillment_status === "delivered"
                                ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600"
                                : ord.fulfillment_status === "dispatched"
                                ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {ord.fulfillment_status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(ord.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardSection>
        )}

        {/* Create/Edit Product Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add Store Product"}
              </h2>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Product Title *
                  </label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e: any) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. October 2026 Combined Maths Tute Pack"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e: any) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Includes printed tutorials, past paper booklets..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e: any) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="study_pack">Monthly Study Pack</option>
                      <option value="tute">Tutorial</option>
                      <option value="book">Textbook / Guide</option>
                      <option value="merchandise">Merchandise / Accessory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Price (LKR) *
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      value={formData.price}
                      onChange={(e: any) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Inventory Count
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={formData.inventory_count}
                      onChange={(e: any) => setFormData({ ...formData, inventory_count: Number(e.target.value) })}
                      className="rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Thumbnail Image URL
                    </label>
                    <Input
                      value={formData.thumbnail_url}
                      onChange={(e: any) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                      placeholder="https://..."
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_toggle"
                    checked={formData.is_active}
                    onChange={(e: any) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <label htmlFor="is_active_toggle" className="text-slate-700 dark:text-slate-300 font-medium">
                    Product is Active and Visible in Catalog
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl bg-primary text-white">
                    Save Product
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
