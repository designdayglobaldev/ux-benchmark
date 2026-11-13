import type { Variants } from "motion/react";

export const MESSAGE_ANIMATIONS = {
  "slide-up": {
    variants: {
      initial: { opacity: 0, y: 14, scale: 0.98 },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.28,
          ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
        },
      },
    } satisfies Variants,
  },
  fade: {
    variants: {
      initial: { opacity: 0 },
      animate: {
        opacity: 1,
        transition: {
          duration: 0.35,
          ease: "easeInOut",
        },
      },
    } satisfies Variants,
  },
  stagger: {
    variants: {
      initial: { opacity: 0, y: 10 },
      animate: (custom: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: {
          delay: custom * 0.08,
          duration: 0.32,
          ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number],
        },
      }),
    } satisfies Variants,
  },
};


