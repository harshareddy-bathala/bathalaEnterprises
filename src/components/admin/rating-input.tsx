"use client";

import { useState } from "react";

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function RatingInput({
  value,
  onChange,
  disabled = false,
  size = "md",
}: RatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeStyles = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const iconSize = sizeStyles[size];

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={handleMouseLeave}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayRating;
        const isHovered = rating <= hoverRating;
        const isSelected = rating <= value;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={disabled}
            className={`transition-all ${
              disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
            } ${isHovered ? "scale-110" : ""}`}
            aria-label={`${rating} star${rating !== 1 ? "s" : ""}`}
            role="radio"
            aria-checked={rating === value}
          >
            <span
              className={`material-symbols-outlined ${iconSize} transition-colors ${
                isFilled
                  ? "text-amber-500"
                  : "text-gray-300"
              }`}
              style={{
                fontVariationSettings: isFilled
                  ? `'FILL' 1, 'wght' ${isSelected ? 820 : 700}, 'GRAD' 200, 'opsz' 24`
                  : "'FILL' 0, 'wght' 320, 'GRAD' 0, 'opsz' 24",
              }}
            >
              star
            </span>
          </button>
        );
      })}
      <span className="ml-2 text-sm text-[#6b7280]">
        {value > 0 ? `${value}/5` : "No rating"}
      </span>
    </div>
  );
}
