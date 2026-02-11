import React from "react";

interface GameCardProps {
  title: string;
  description: string;
  image: string;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function GameCard({
  title,
  description,
  image,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: GameCardProps) {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="
        relative h-64 md:h-72 
        rounded-[32px] 
        overflow-hidden cursor-pointer 
        group shadow-2xl transition-all duration-500
        hover:scale-[1.03]
      "
    >
      {/* Ảnh nền */}
      <img
        src={image}
        alt={title}
        className="
          absolute inset-0 w-full h-full object-cover
          transition-transform duration-700 group-hover:scale-110
        "
      />

      {/* Lớp phủ mờ */}
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-all" />
    </div>
  );
}