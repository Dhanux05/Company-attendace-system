import React, { useEffect, useState } from "react";

const FloatingClock = () => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();
  const timeLabel = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  return (
    <div className="floating-clock-shell" aria-hidden="true">
      <div className="floating-clock-tooltip">
        <div className="floating-clock-tooltip-time">{timeLabel}</div>
        <div className="floating-clock-tooltip-date">{dateLabel}</div>
      </div>
      <div className="floating-clock">
        <div className="floating-clock-face">
          {Array.from({ length: 12 }).map((_, index) => (
            <span
              key={index}
              className={`clock-tick ${index % 3 === 0 ? "major" : ""}`}
              style={{ transform: `translateX(-50%) rotate(${index * 30}deg)` }}
            />
          ))}
          <span className="clock-hand hour" style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }} />
          <span className="clock-hand minute" style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }} />
          <span className="clock-hand second" style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }} />
          <span className="clock-center-dot" />
        </div>
      </div>
    </div>
  );
};

export default FloatingClock;
