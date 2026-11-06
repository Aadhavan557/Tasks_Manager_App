import React from "react";
import { motion } from "framer-motion";

// Configuration for floating animated petals
const PETALS = [
  { id: 1, left: "10%", size: 18, delay: 0, duration: 12, rotate: 25, color: "#f472b6" },
  { id: 2, left: "22%", size: 14, delay: 2, duration: 15, rotate: -45, color: "#f9a8d4" },
  { id: 3, left: "35%", size: 20, delay: 4, duration: 11, rotate: 60, color: "#e879f9" },
  { id: 4, left: "48%", size: 16, delay: 1, duration: 14, rotate: -30, color: "#fb7185" },
  { id: 5, left: "62%", size: 15, delay: 3, duration: 13, rotate: 40, color: "#f472b6" },
  { id: 6, left: "75%", size: 22, delay: 5, duration: 10, rotate: -60, color: "#c084fc" },
  { id: 7, left: "88%", size: 17, delay: 2.5, duration: 16, rotate: 35, color: "#fda4af" },
  { id: 8, left: "5%", size: 19, delay: 6, duration: 12, rotate: 50, color: "#f9a8d4" },
  { id: 9, left: "92%", size: 16, delay: 4.5, duration: 13, rotate: -25, color: "#e879f9" },
  { id: 10, left: "40%", size: 14, delay: 7, duration: 15, rotate: 70, color: "#fb7185" },
  { id: 11, left: "80%", size: 18, delay: 8, duration: 14, rotate: -40, color: "#f472b6" },
  { id: 12, left: "18%", size: 15, delay: 5.5, duration: 12, rotate: 15, color: "#c084fc" },
];

export function FlowerBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* 1. Base dark background */}
      <div className="absolute inset-0 bg-[#090b14]" />

      {/* 2. Painted Floral Wallpaper Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-85 mix-blend-screen"
        style={{ backgroundImage: `url('/floral-bg.jpg')` }}
      />

      {/* 3. Soft gradient overlay to blend seamlessly with theme */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#090b14] via-transparent to-[#090b14]/70" />

      {/* 4. Dreamy ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-[120px]" />
      <div className="absolute top-10 right-10 w-80 h-80 bg-rose-500/15 rounded-full blur-[100px]" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-indigo-500/15 rounded-full blur-[100px]" />

      {/* 5. Floating & Swaying Petals Animation */}
      {PETALS.map((petal) => (
        <motion.div
          key={petal.id}
          className="absolute -top-10 pointer-events-none"
          style={{
            left: petal.left,
            width: petal.size,
            height: petal.size * 1.4,
          }}
          initial={{ y: -60, x: 0, opacity: 0, rotate: 0 }}
          animate={{
            y: ["0vh", "115vh"],
            x: [0, 25, -20, 30, 0],
            opacity: [0, 0.85, 0.9, 0.7, 0],
            rotate: [petal.rotate, petal.rotate + 180, petal.rotate + 360],
          }}
          transition={{
            duration: petal.duration,
            delay: petal.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {/* Petal SVG Shape */}
          <svg
            viewBox="0 0 30 42"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(244,114,182,0.4)]"
          >
            <path
              d="M15 0C8 10 0 20 0 30C0 36.6 6.7 42 15 42C23.3 42 30 36.6 30 30C30 20 22 10 15 0Z"
              fill={petal.color}
              fillOpacity="0.85"
            />
            {/* Center vein */}
            <path
              d="M15 8V36"
              stroke="#ffffff"
              strokeOpacity="0.45"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

