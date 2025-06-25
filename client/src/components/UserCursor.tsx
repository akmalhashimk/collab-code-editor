import { useEffect, useState } from "react";
import type { CursorPosition } from "@shared/schema";

interface UserCursorProps {
  cursor: CursorPosition;
}

export default function UserCursor({ cursor }: UserCursorProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(prev => !prev);
    }, 530); // Blink every 530ms

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="user-cursor"
      style={{
        color: cursor.color,
        top: `${(cursor.line - 1) * 24 + 16}px`, // 24px line height, 16px padding
        left: `${cursor.column * 8 + 16}px`, // 8px char width, 16px padding
      }}
    >
      {visible && (
        <div
          className="absolute top-0 left-0 w-0.5 h-5 animate-blink"
          style={{ backgroundColor: cursor.color }}
        />
      )}
      <div
        className="absolute -top-6 left-0 bg-opacity-90 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        style={{ backgroundColor: cursor.color }}
      >
        {cursor.username}
      </div>
    </div>
  );
}
