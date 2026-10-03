"use client";

import { useEffect, useState } from "react";
import { storeService, IProduct } from "@/services/storeService";
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
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import {
  Package,
  ShoppingCart,
  Search,
  CheckCircle2,
  X,
  Plus,
  Minus,
  Truck,
  CreditCard,
  AlertCircle,
  Video,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function StoreCatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart state
  const [cart, setCart] = useState<{ [productId: string]: { product: IProduct; quantity: number } }>({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await storeService.getProducts({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        search: search || undefined,
      });
      if (res.success) {
        setProducts(res.data);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to load store products");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const addToCart = (product: IProduct) => {
    setCart((prev) => {
      const existing = prev[product._id];
      const newQty = existing ? existing.quantity + 1 : 1;
      if (newQty > product.inventory_count) {
        toast.error(`Only ${product.inventory_count} items available in stock`);
        return prev;
      }
      return {
        ...prev,
        [product._id]: { product, quantity: newQty },
      };
    });
    toast.success(`Added ${product.title} to cart`);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const item = prev[productId];
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      if (newQty > item.product.inventory_count) {
        toast.error(`Maximum available stock reached (${item.product.inventory_count})`);
        return prev;
      }
      return {
        ...prev,
        [productId]: { ...item, quantity: newQty },
      };
    });
  };

  const cartItems = Object.values(cart);
  const totalAmount = cartItems.reduce((acc, curr) => acc + curr.product.price * curr.quantity, 0);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please log in to place an order");
      router.push("/auth/login?redirect=/store");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!shippingAddress.trim()) {
      toast.error("Please enter a valid shipping address for courier dispatch");
      return;
    }

    try {
      setIsCheckingOut(true);
      const res = await storeService.createCheckout({
        items: cartItems.map((ci) => ({
          product_id: ci.product._id,
          quantity: ci.quantity,
        })),
        shipping_address: shippingAddress.trim(),
        contact_phone: contactPhone.trim(),
        payment_method: "mock",
      });

      if (res.success) {
        toast.success("Order placed successfully! Delivery order has been initiated.");
        setCart({});
        setIsCartOpen(false);
        router.push("/dashboard/deliveries");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process checkout");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-7">
        {/* Reusable Section Header */}
        <SectionHeader
          icon={Package}
          title={
            <EditableContent
              configKey="store_page_title"
              initialValue="Academic Bookstore & Physical Dispatch"
              as="span"
            />
          }
          description={
            <EditableContent
              configKey="store_page_desc"
              initialValue="Order printed tutorial packs, official revision booklets, and study accessories delivered directly to your doorstep with tracking."
              as="span"
            />
          }
          actions={
            <div className="flex items-center gap-3">
              <Link href="/study-packs">
                <Button
                  variant="outline"
                  className="flex items-center gap-2 border-indigo-200 text-indigo-600 dark:border-indigo-900 rounded-xl px-4 py-2 text-sm font-medium"
                >
                  <Video className="w-4 h-4" />
                  <span>Digital Study Packs</span>
                </Button>
              </Link>
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs px-4 py-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart</span>
                {cartItems.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white text-primary rounded-full">
                    {cartItems.reduce((acc, c) => acc + c.quantity, 0)}
                  </span>
                )}
              </Button>
            </div>
          }
        />

        {/* Digital Study Packs Notice Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-900/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Looking for digital past class recordings and topic videos?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Items here are physical books and tutes shipped to your doorstep. For instant online video bundles, visit Digital Study Packs.
              </p>
            </div>
          </div>
          <Link href="/study-packs" className="shrink-0">
            <Button size="sm" variant="secondary" className="flex items-center gap-1.5 text-xs font-semibold rounded-xl">
              <span>View Digital Packs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {["all", "study_pack", "tute", "book", "merchandise"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-primary text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {cat === "all"
                  ? "All Physical Items"
                  : cat === "study_pack"
                  ? "Printed Packs"
                  : cat === "tute"
                  ? "Tutorials"
                  : cat === "book"
                  ? "Textbooks & Guides"
                  : "Accessories"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
              placeholder="Search materials..."
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </form>
        </div>

        {/* Product Catalog wrapped in CardSection */}
        <CardSection
          title={
            <EditableContent
              configKey="store_catalog_heading"
              initialValue="Physical Course Materials & Printed Tutes"
              as="span"
            />
          }
          icon={Package}
        >
          {loading ? (
            <div className="py-12">
              <SectionLoader />
            </div>
          ) : products.length === 0 ? (
            <ClayEmptyState
              illustration={CLAY_ASSETS.storeHeroCart}
              title="No products found"
              description="There are no available physical materials matching this category right now. Check back soon for updated stock."
              action={{
                label: "Clear Category Filter",
                onClick: () => setSelectedCategory("all"),
                variant: "outline",
              }}
            />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="group flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-all"
              >
                <div className="h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-50/50 to-slate-50">
                      <div className="relative w-20 h-20 drop-shadow-xs">
                        <Image src={CLAY_ASSETS.storeHeroCart} alt="" fill className="object-contain" />
                      </div>
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mt-1">
                        {product.category.replace("_", " ")}
                      </span>
                    </div>
                  )}
                  {product.inventory_count > 0 ? (
                    <span className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                      In Stock ({product.inventory_count})
                    </span>
                  ) : (
                    <span className="absolute top-3 right-3 bg-red-500/90 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-sm">
                      Out of Stock
                    </span>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-primary">
                      {product.category.replace("_", " ")}
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                      {product.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {product.description || "Official course material with home courier fulfillment."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">Price</span>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">
                        LKR {product.price.toLocaleString()}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={product.inventory_count <= 0}
                      onClick={() => addToCart(product)}
                      className="rounded-xl px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-xs font-semibold"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 mr-1.5" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </CardSection>

        {/* Cart Drawer / Slide-over */}
        {isCartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col p-6 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Cart</h2>
                  <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                    {cartItems.length} items
                  </span>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm">Your cart is currently empty</p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto py-4 space-y-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div
                      key={product._id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="flex-1 pr-2">
                        <h4 className="font-medium text-sm text-slate-900 dark:text-white line-clamp-1">
                          {product.title}
                        </h4>
                        <p className="text-xs text-slate-500">LKR {product.price.toLocaleString()} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                          <button
                            onClick={() => updateCartQty(product._id, -1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold">{quantity}</span>
                          <button
                            onClick={() => updateCartQty(product._id, 1)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white w-16 text-right">
                          LKR {(product.price * quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Shipping Address & Details */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Courier Shipping Address *
                    </label>
                    <textarea
                      rows={2}
                      value={shippingAddress}
                      onChange={(e: any) => setShippingAddress(e.target.value)}
                      placeholder="Enter house no, street, city, postal code..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />

                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Contact Phone (for Courier Dispatch)
                    </label>
                    <Input
                      value={contactPhone}
                      onChange={(e: any) => setContactPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className="text-xs rounded-xl"
                    />
                  </div>
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
                    <span>Total Amount</span>
                    <span>LKR {totalAmount.toLocaleString()}</span>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className="w-full py-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold flex items-center justify-center gap-2 shadow-md"
                  >
                    <Truck className="w-4 h-4" />
                    {isCheckingOut ? "Processing..." : "Place Order with Delivery"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
