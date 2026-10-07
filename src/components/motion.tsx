"use client";

import { useEffect } from "react";
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion, useTransform, type Variants } from "framer-motion";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import Stack from "@mui/material/Stack";
import { formatMoney } from "@/lib/money";

// Only transform + opacity are animated: cheap on phones and friendly to reduced-motion settings
// (MotionConfig in Providers turns transform animations off when the OS asks for it).
export const EASE = [0.22, 1, 0.36, 1] as const;

export const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.045, delayChildren: 0.04 } },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

export const MotionBox = motion.create(Box);
export const MotionPaper = motion.create(Paper);
export const MotionStack = motion.create(Stack);
export const MotionTableBody = motion.create(TableBody);
export const MotionTableRow = motion.create(TableRow);
export { AnimatePresence };

/** Container whose direct `StaggerItem` children fade up one after another. */
export function Stagger({ children, spacing = 0, className }: { children: React.ReactNode; spacing?: number; className?: string }) {
  return (
    <MotionStack variants={containerVariants} initial="hidden" animate="show" spacing={spacing} className={className}>
      {children}
    </MotionStack>
  );
}

export function StaggerItem({ children }: { children: React.ReactNode }) {
  return <MotionBox variants={itemVariants}>{children}</MotionBox>;
}

/** Card that fades up and lifts a little on hover / presses down on tap. */
export function LiftCard({ children, sx, onClick }: { children: React.ReactNode; sx?: object; onClick?: () => void }) {
  return (
    <MotionPaper
      variants={itemVariants}
      layout="position"
      exit={{ opacity: 0, x: -48, transition: { duration: 0.2 } }}
      whileHover={{ y: -3, boxShadow: "0 10px 24px rgba(11,37,69,0.14)" }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      sx={sx}
      onClick={onClick}
    >
      {children}
    </MotionPaper>
  );
}

/** One-shot entrance for a single block, optionally delayed. */
export function Reveal({ children, delay = 0, y = 16 }: { children: React.ReactNode; delay?: number; y?: number }) {
  return (
    <MotionBox initial={{ opacity: 0, y }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE, delay }}>
      {children}
    </MotionBox>
  );
}

/** Counts up to `value` (integers or soles). Shows the final number straight away for reduced motion. */
export function AnimatedNumber({ value, kind = "int" }: { value: number; kind?: "int" | "money" }) {
  const reduce = useReducedMotion();
  const format = (v: number) => (kind === "money" ? formatMoney(v) : Math.round(v).toLocaleString("es-PE"));
  const motionValue = useMotionValue(0);
  const text = useTransform(motionValue, format);

  useEffect(() => {
    if (reduce) return;
    const controls = animate(motionValue, value, { duration: 0.9, ease: "easeOut" });
    return () => controls.stop();
  }, [value, reduce, motionValue]);

  return reduce ? <>{format(value)}</> : <motion.span>{text}</motion.span>;
}
