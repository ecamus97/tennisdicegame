import React from "react";

interface DiceProps {
  value: number;
  isRolling?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary";
}

const Dice: React.FC<DiceProps> = ({ value, isRolling = false, size = "md", variant = "primary" }) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const dotSize = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  };

  const bgClass = variant === "primary" 
    ? "bg-gradient-to-br from-primary to-accent" 
    : "bg-gradient-to-br from-secondary to-muted";

  const dotClass = variant === "primary" 
    ? "bg-primary-foreground" 
    : "bg-secondary-foreground";

  const getDots = (val: number) => {
    const dotPositions: Record<number, [number, number][]> = {
      1: [[1, 1]],
      2: [[0, 0], [2, 2]],
      3: [[0, 0], [1, 1], [2, 2]],
      4: [[0, 0], [0, 2], [2, 0], [2, 2]],
      5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
      6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
    };

    return dotPositions[val] || [];
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        ${bgClass}
        rounded-lg dice-shadow
        flex items-center justify-center
        ${isRolling ? "animate-dice-roll" : ""}
        transition-transform duration-200
      `}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-0.5 p-1.5">
        {[0, 1, 2].map((row) =>
          [0, 1, 2].map((col) => {
            const hasDot = getDots(value).some(([r, c]) => r === row && c === col);
            return (
              <div
                key={`${row}-${col}`}
                className={`
                  ${dotSize[size]} 
                  rounded-full 
                  ${hasDot ? dotClass : "bg-transparent"}
                  transition-all duration-200
                `}
              />
            );
          })
        )}
      </div>
    </div>
  );
};

export default Dice;
