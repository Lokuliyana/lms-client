// src/components/layout/Footer.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { FaFacebook, FaYoutube } from "react-icons/fa";
import { siteConfig } from "@/lib/site-config";
import EditableContent from "@/components/admin/editable-content";
import { useBranding } from "@/hooks/useBranding";

export default function Footer() {
  const { footer } = siteConfig;
  const { branding } = useBranding();
  const year = new Date().getFullYear();
  const whatsappUrl = branding.supportWhatsApp
    ? `https://wa.me/${branding.supportWhatsApp.replace(/[^0-9]/g, '')}`
    : footer.social.whatsapp.url;

  return (
    <footer suppressHydrationWarning className="mt-16 border-t border-slate-200/70 bg-gradient-to-b from-white to-slate-50">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div suppressHydrationWarning>
            <div suppressHydrationWarning className="relative w-56 h-24 mb-3">
              <Image
                suppressHydrationWarning
                src={branding.assets?.logoUrl || footer.brand.logo}
                alt={branding.platformName || "NexvoLearn"}
                fill
                className="object-contain"
                priority
              />
            </div>
            <div suppressHydrationWarning className="text-sm text-slate-600 leading-relaxed max-w-xs">
              {branding.slogan || footer.brand.description}
            </div>
            <div suppressHydrationWarning className="text-xs text-slate-500 font-medium mt-2">
              Instructor: {branding.instructorName}
            </div>
          </div>

          {/* Learning Services */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wide">
              Learning Services
            </h4>
            <ul className="space-y-3">
              {footer.services.map((item: any, i: number) => (
                <li key={i}>
                  <Link href={item.href} className="group block">
                    <div className="text-sm font-medium text-slate-700 group-hover:text-indigo-700 transition">
                      <EditableContent
                        configKey={`site.footer.services.${i}.label`}
                        initialValue={item.label}
                      />
                    </div>
                    <div className="text-xs text-slate-500 group-hover:text-slate-600 transition">
                      <EditableContent
                        configKey={`site.footer.services.${i}.desc`}
                        initialValue={item.desc}
                      />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social / CTA */}
          <div className="flex flex-col items-start md:items-end text-center md:text-right space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              Connect
            </h4>

            <div className="flex gap-3">
              <Link
                href={footer.social.facebook.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition"
                aria-label="Facebook"
              >
                <FaFacebook className="w-5 h-5 text-blue-600" />
              </Link>

              <Link
                href={footer.social.youtube.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-slate-200 hover:border-red-500 hover:bg-red-50 transition"
                aria-label="YouTube"
              >
                <FaYoutube className="w-5 h-5 text-red-600" />
              </Link>

              {/* WhatsApp */}
              <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-full border border-slate-200 hover:border-green-500 hover:bg-green-50 transition relative"
                aria-label="WhatsApp"
                animate={{
                  y: -4,
                  boxShadow: "0 4px 12px rgba(34, 197, 94, 0.5)",
                }}
                initial={{
                  y: 0,
                  boxShadow: "0 0 0 0 rgba(34, 197, 94, 0)",
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                }}
              >
                <MessageCircle className="w-5 h-5 text-green-600" />
              </motion.a>
            </div>

            <Link
              href={footer.cta.href}
              className="inline-block mt-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-semibold shadow-xs hover:opacity-95 transition"
            >
              <EditableContent
                configKey="site.footer.cta.label"
                initialValue={footer.cta.label}
              />
            </Link>

            <div className="text-xs text-slate-500 mt-2">
              <EditableContent
                configKey="site.footer.cta.subtext"
                initialValue={footer.cta.subtext}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 my-10" />

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-600">
          <p>
            © {year} {branding.platformName} — {branding.instructorName}. All rights reserved.
          </p>
          <p className="text-slate-500">
            {footer.copyright.builtBy.text}{" "}
            <Link
              href={footer.copyright.builtBy.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors"
            >
              {branding.platformName}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
