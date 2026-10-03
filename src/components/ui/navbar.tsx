"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { navItems as getNavItems } from "./navConfig";

const NAV_HEIGHT = 55;
const NAV_RADIUS = 28;
const BUMP_RADIUS = 50;
const BUMP_OVERLAP = 20;
const svgWidth = 350;

export default function ProfessionalBottomNavbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fullPath = `${pathname}${searchParams.toString() ? "?" + searchParams.toString() : ""}`;

  const [navItems, setNavItems] = useState<any[]>([]);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;
    const items = filterNavItems(getNavItems(user || undefined), "mobile", user?.role);
    setNavItems(items);
  }, []);

  const activeIdx = useMemo(() => {
    return navItems.findIndex((item) => item.href === fullPath);
  }, [fullPath, navItems]);

  const count = navItems.length || 1;
  const segment = svgWidth / count;
  const bumpCenterX = segment * activeIdx + segment / 2;

  const navPath = () => {
    const w = svgWidth;
    const h = NAV_HEIGHT;
    const r = NAV_RADIUS;
    const br = BUMP_RADIUS;
    const bx = bumpCenterX;
    const notchDepth = BUMP_OVERLAP;

    return `
      M${r},0
      H${bx - br}
      A${br},${br} 0 0 1 ${bx},${notchDepth}
      A${br},${br} 0 0 1 ${bx + br},0
      H${w - r}
      A${r},${r} 0 0 1 ${w},${r}
      V${h - r}
      A${r},${r} 0 0 1 ${w - r},${h}
      H${r}
      A${r},${r} 0 0 1 0,${h - r}
      V${r}
      A${r},${r} 0 0 1 ${r},0
      Z
    `.replace(/\s+/g, " ");
  };

  return (
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 sm:hidden"
      style={{ width: svgWidth }}
    >
      <div className="relative" style={{ height: NAV_HEIGHT }}>
        <svg
          width={svgWidth}
          height={NAV_HEIGHT}
          viewBox={`0 0 ${svgWidth} ${NAV_HEIGHT}`}
          className="absolute top-0 left-0 w-full h-full z-0"
          style={{
            filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))",
            transform: "translate3d(0, 0, 0)",
            willChange: "transform",
          }}
        >
          <defs>
            <linearGradient id="navGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(249, 250, 251, 0.98)" />
              <stop offset="100%" stopColor="rgba(243, 244, 246, 0.96)" />
            </linearGradient>
            <linearGradient id="notchGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(79, 70, 229, 0.08)" />
              <stop offset="100%" stopColor="rgba(79, 70, 229, 0.04)" />
            </linearGradient>
          </defs>

          <motion.path
            d={navPath()}
            fill="url(#navGradient)"
            stroke="rgba(209, 213, 219, 0.6)"
            strokeWidth={1}
            animate={{ d: navPath() }}
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
          <motion.circle
            cx={bumpCenterX}
            cy={BUMP_OVERLAP}
            r={BUMP_RADIUS - 15}
            fill="url(#notchGradient)"
            opacity={0.3}
            animate={{ cx: bumpCenterX }}
            transition={{
              type: "tween",
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
          />
        </svg>

        {/* Nav Items */}
        <div
          className="absolute top-0 left-0 w-full h-full flex items-center justify-around z-10 pointer-events-none select-none"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          {navItems.map((item, idx) => {
            const isActive = idx === activeIdx;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center h-full"
                style={{ width: segment, pointerEvents: "auto" }}
              >
                <Link
                  href={item.href ?? "#"}
                  className="relative flex flex-col items-center justify-center w-full h-full group focus:outline-none"
                >
                  <motion.div
                    className="relative flex flex-col items-center justify-center"
                    animate={{ y: isActive ? -10 : 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <motion.div
                      className={`${
                        isActive
                          ? "w-10 h-10 rounded-xl bg-indigo-600"
                          : "w-8 h-8 rounded-lg"
                      } flex items-center justify-center transition-all duration-150 ease-out group-hover:scale-105`}
                    >
                      <Icon
                        className={`${
                          isActive
                            ? "text-white text-lg"
                            : "text-gray-400 text-base group-hover:text-indigo-500"
                        } transition-colors duration-150 ease-out`}
                      />
                    </motion.div>

                    {isActive && (
                      <motion.span
                        key={`label-${item.id}`}
                        className="mt-1.5 text-xs font-medium text-indigo-700"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </motion.div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* --- Shared filter function (same as Sidebar) --- */
function filterNavItems(
  items: any[],
  device: "mobile" | "desktop",
  role?: string
) {
  // Guests (no role) should be treated as "student"
  const effectiveRole = role || "student";

  const roleOk = (required?: string | string[]) => {
    if (!required) return true;
    return Array.isArray(required)
      ? required.includes(effectiveRole)
      : required === effectiveRole;
  };

  return items
    .filter(
      (item) => item.visibleOn?.includes(device) && roleOk(item.requireRole)
    )
    .map((item) => ({
      ...item,
      children:
        item.children?.filter(
          (child: any) =>
            child.visibleOn?.includes(device) && roleOk(child.requireRole)
        ) || undefined,
    }));
}