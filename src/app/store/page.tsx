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
import { useCart } from "@/hooks/useCart";

export default function StoreCatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { cartItems, totalItems, totalAmount, addToCart } = useCart();

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

  const handleAddToCart = (product: IProduct) => {
    addToCart(product);
    toast.success(`Added ${product.title} to cart`, {
      action: {
        label: "View Cart",
        onClick: () => router.push("/store/cart"),
      },
    });
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
              <Link href="/store/cart">
                <Button
                  className="relative flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-xs px-4 py-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Cart</span>
                  {totalItems > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-white text-primary rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Button>
              </Link>
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
                      onClick={() => handleAddToCart(product)}
                      className="rounded-xl px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 dark:text-slate-900 text-white text-xs font-semibold cursor-pointer"
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

        {/* Floating Cart Access Bar */}
        {totalItems > 0 && (
          <div className="fixed bottom-6 right-6 z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-xl px-5 py-3 h-12 flex items-center gap-3 border border-white/20 hover:scale-105 transition-all"
            >
              <Link href="/store/cart">
                <ShoppingCart className="w-5 h-5" />
                <span className="font-bold text-sm">
                  View Cart ({totalItems}) • LKR {totalAmount.toLocaleString()}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        )}
    </div>
  );
}
