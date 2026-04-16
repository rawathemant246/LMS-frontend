"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import { motion, animate } from "framer-motion";
import { useEffect, useRef } from "react";

interface KpiCardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  delta?: number;
  icon: LucideIcon;
  index?: number;
}

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(val) {
        if (value >= 100000) {
          node.textContent = `${prefix}${(val / 100000).toFixed(1)}${suffix}`;
        } else if (value >= 1000) {
          node.textContent = `${prefix}${Math.floor(val).toLocaleString("en-IN")}${suffix}`;
        } else {
          node.textContent = `${prefix}${Math.floor(val)}${suffix}`;
        }
      },
    });

    return () => controls.stop();
  }, [value, prefix, suffix]);

  return <span ref={ref}>0</span>;
}

export function KpiCard({ title, value, prefix, suffix, delta, icon: Icon, index = 0 }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <div className="p-2 rounded-lg bg-brand-primary-light">
              <Icon className="h-5 w-5 text-brand-primary" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-gray-900">
              <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
            </p>
            {delta !== undefined && (
              <p className={`text-xs font-semibold mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}% vs last month
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
