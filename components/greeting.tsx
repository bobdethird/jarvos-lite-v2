"use client";

import { motion } from "framer-motion";
import {
  CalendarIcon,
  CloudSunIcon,
  CalculatorIcon,
  MusicIcon,
  ImageIcon,
  MapIcon,
  ClockIcon,
  BookOpenIcon,
  MailIcon,
  VideoIcon,
  CameraIcon,
  FileTextIcon,
  SettingsIcon,
  CompassIcon,
  NewspaperIcon,
  WalletIcon,
} from "lucide-react";
import type { ReactNode } from "react";

type AppItem = {
  name: string;
  icon: ReactNode;
  color: string;
};

const apps: AppItem[] = [
  {
    name: "Calendar",
    icon: <CalendarIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-red-400 via-red-500 to-red-600",
  },
  {
    name: "Weather",
    icon: <CloudSunIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-sky-400 via-sky-500 to-blue-500",
  },
  {
    name: "Notes",
    icon: <FileTextIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-500",
  },
  {
    name: "Mail",
    icon: <MailIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600",
  },
  {
    name: "Photos",
    icon: <ImageIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-pink-400 via-pink-500 to-rose-500",
  },
  {
    name: "Music",
    icon: <MusicIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-rose-500 via-pink-500 to-pink-600",
  },
  {
    name: "Maps",
    icon: <MapIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-600",
  },
  {
    name: "Calculator",
    icon: <CalculatorIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-zinc-600 via-zinc-700 to-zinc-800",
  },
  {
    name: "Clock",
    icon: <ClockIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950",
  },
  {
    name: "Books",
    icon: <BookOpenIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600",
  },
  {
    name: "Camera",
    icon: <CameraIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-neutral-500 via-neutral-600 to-neutral-700",
  },
  {
    name: "Videos",
    icon: <VideoIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-violet-400 via-violet-500 to-purple-600",
  },
  {
    name: "Safari",
    icon: <CompassIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500",
  },
  {
    name: "News",
    icon: <NewspaperIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-red-500 via-red-500 to-rose-600",
  },
  {
    name: "Wallet",
    icon: <WalletIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
  },
  {
    name: "Settings",
    icon: <SettingsIcon className="size-7 md:size-8" />,
    color: "bg-gradient-to-br from-zinc-400 via-zinc-500 to-zinc-600",
  },
];

export const Greeting = () => {
  return (
    <div className="flex size-full flex-col items-center justify-center px-6 py-8">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-2 text-center font-semibold text-2xl md:text-3xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.3 }}
      >
        Hello there!
      </motion.div>
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center text-lg text-zinc-500 md:text-xl"
        exit={{ opacity: 0, y: 10 }}
        initial={{ opacity: 0, y: 10 }}
        transition={{ delay: 0.4 }}
      >
        How can I help you today?
      </motion.div>

      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full max-w-[380px] flex-wrap items-start justify-center gap-x-6 gap-y-7 md:max-w-[860px] md:gap-x-7 md:gap-y-9"
        exit={{ opacity: 0, y: 20 }}
        initial={{ opacity: 0, y: 20 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        {apps.map((app, i) => (
          <motion.button
            key={app.name}
            animate={{ opacity: 1, scale: 1 }}
            className="group flex w-[72px] flex-col items-center gap-1.5 md:w-[80px]"
            initial={{ opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.5 + i * 0.03, duration: 0.3 }}
            type="button"
          >
            <div
              className={`${app.color} flex size-[60px] items-center justify-center rounded-[14px] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1)] transition-all duration-200 ease-out group-hover:scale-105 group-active:scale-95 md:size-[68px] md:rounded-[22px]`}
            >
              {app.icon}
            </div>
            <span className="max-w-[72px] truncate text-center font-medium text-[11px] leading-tight text-muted-foreground md:max-w-[80px] md:text-xs">
              {app.name}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
};
