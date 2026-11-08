"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Truck,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Package,
  AlertCircle,
  Loader2,
  Clock,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { storeService } from "@/services/storeService";
import { SectionHeader } from "@/components/reusable/section-header";
import { ClayEmptyState } from "@/components/reusable/ClayEmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/dev/label";
import { CLAY_ASSETS } from "@/constants/clayAssets";
import { toast } from "sonner";

export default function StoreCartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    cartItems,
    totalItems,
    totalAmount,
    isLoaded,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = useCart();

  // Courier shipping details state
  const [recipientName, setRecipientName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill user data when available
  useEffect(() => {
    if (user) {
      const name =
        user.full_name ||
        user.fullName ||
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
      if (name && !recipientName) setRecipientName(name);
      if (user.phone && !contactPhone) setContactPhone(user.phone);
      if (user.address && !shippingAddress) setShippingAddress(user.address);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to complete your material order.");
      router.push("/login?redirect=/store/cart");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }

    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      setError("Please provide a valid shipping address (at least 5 characters).");
      toast.error("Valid shipping address is required for courier dispatch.");
      return;
    }

    const digits = contactPhone.replace(/\D/g, "");
    if (!contactPhone.trim() || digits.length < 7 || digits.length > 15) {
      setError("Please enter a valid contact phone number for the courier (7-15 digits).");
      toast.error("Valid phone number is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await storeService.createCheckout({
        items: cartItems.map((ci) => ({
          product_id: ci.product._id,
          quantity: ci.quantity,
        })),
        shipping_address: shippingAddress.trim(),
        contact_phone: contactPhone.trim(),
        recipient_name: recipientName.trim() || undefined,
        payment_method: "cod",
        notes: notes.trim() || undefined,
      });

      if (res.success) {
        toast.success("Order placed successfully! Delivery order has been initiated.");
        clearCart();
        router.push("/dashboard/deliveries");
      } else {
        toast.error(res.message || "Failed to place material order.");
      }
    } catch (err: any) {
      console.error("Store checkout error:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to process material order.";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-slate-500">Loading your cart...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-primary transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/store" className="hover:text-primary transition-colors">
          Material Store
        </Link>
        <span>/</span>
        <span className="text-slate-900 dark:text-white font-semibold">
          Shopping Cart
        </span>
      </div>

      {/* Header */}
      <SectionHeader
        title="Material Stock Cart"
        description="Review your selected study materials, revision packs, and stationeries before courier dispatch."
        icon={ShoppingCart}
        actions={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Link href="/store">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Continue Shopping
            </Link>
          </Button>
        }
      />

      {/* Cart Content */}
      {cartItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 shadow-xs">
          <ClayEmptyState
            title="Your Material Cart is Empty"
            description="You haven't added any study packs, books, or physical educational materials to your cart yet."
            illustration={CLAY_ASSETS.storeHeroCart}
            action={{
              label: "Browse Material Store",
              href: "/store",
              icon: Package,
              variant: "primary",
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
              {/* Table / List Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-primary">
                    <Package className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Cart Items ({totalItems})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={clearCart}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Cart</span>
                </button>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {cartItems.map(({ product, quantity }) => {
                  const lineTotal = product.price * quantity;
                  const isMaxStock = quantity >= product.inventory_count;

                  return (
                    <div
                      key={product._id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Product Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt={product.title}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Package className="w-7 h-7" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {product.category || "General"}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                            {product.title}
                          </h4>
                          <p className="text-xs font-semibold text-primary">
                            LKR {product.price.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400 font-normal">
                              each
                            </span>
                          </p>
                          {product.inventory_count <= 5 && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                              Only {product.inventory_count} left in stock
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Line Total & Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100 dark:border-slate-800">
                        {/* Stepper */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => updateCartQty(product._id, -1)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[28px] text-center">
                            {quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(product._id, 1)}
                            disabled={isMaxStock}
                            className={`p-2 transition-colors ${
                              isMaxStock
                                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Line Total */}
                        <div className="text-right min-w-[90px]">
                          <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                            LKR {lineTotal.toLocaleString()}
                          </span>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(product._id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Delivery Benefits Card */}
            <div className="bg-gradient-to-r from-indigo-50/60 to-purple-50/40 dark:from-slate-900 dark:to-indigo-950/30 rounded-3xl border border-indigo-100 dark:border-indigo-950 p-5 flex flex-col sm:flex-row items-center gap-4 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-primary shadow-xs shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5 text-center sm:text-left">
                <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                  Islandwide Courier Delivery Guarantee
                </h5>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Physical packages are carefully packed and dispatched through registered courier service with tracking updates sent directly to your student deliveries hub.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Form */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-6">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Order Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm courier dispatch & delivery details
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Items Subtotal ({totalItems})</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    LKR {totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span>Courier Delivery</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Standard Courier Included
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Total Amount
                  </span>
                  <span className="text-xl font-extrabold text-primary">
                    LKR {totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Error Notice */}
              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Sign in prompt if guest */}
              {!user && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2 text-xs text-amber-800 dark:text-amber-300">
                  <p className="font-bold">Student Sign-in Required</p>
                  <p className="text-[11px] opacity-90">
                    Please log in to bind this order to your student profile and enable real-time tracking.
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold h-9"
                  >
                    <Link href="/login?redirect=/store/cart">Sign In to Checkout</Link>
                  </Button>
                </div>
              )}

              {/* Courier Delivery Details Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-2">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
                      Recipient Full Name *
                    </Label>
                    <Input
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Nimal Perera"
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
                      Contact Phone (for Courier Dispatch) *
                    </Label>
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 077 123 4567 or +94 77 123 4567"
                      required
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-1 block">
                      Courier Shipping Address *
                    </Label>
                    <textarea
                      rows={3}
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="House no, Street name, City, Postal Code..."
                      required
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-slate-400"
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                      Special Delivery Instructions (Optional)
                    </Label>
                    <Input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Landmark near junction or leave with security"
                      className="h-9 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || cartItems.length === 0}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Dispatching Order...</span>
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      <span>Place Order with Delivery</span>
                    </>
                  )}
                </Button>
              </form>

              {/* Badges */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Secure Order</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>1-3 Days Dispatch</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
