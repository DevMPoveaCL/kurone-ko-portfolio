"use client";

import { useEffect, useRef, useState } from "react";
import { withPublicPath } from "@/shared/routing/public-path";

export function ProjectRoomBackground() {
  const [canPlayDecorativeVideo, setCanPlayDecorativeVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlaybackPreference = () => setCanPlayDecorativeVideo(!mediaQuery.matches);

    updatePlaybackPreference();
    mediaQuery.addEventListener("change", updatePlaybackPreference);
    return () => mediaQuery.removeEventListener("change", updatePlaybackPreference);
  }, []);

  useEffect(() => {
    if (!canPlayDecorativeVideo) return;
    void videoRef.current?.play().catch(() => undefined);
  }, [canPlayDecorativeVideo]);

  return (
    <div aria-hidden="true" className="project-room-background">
      {canPlayDecorativeVideo ? (
        <video autoPlay loop muted playsInline poster={withPublicPath("/assets/projects/ProjectsBG.webp")} preload="metadata" ref={videoRef}>
          <source src={withPublicPath("/assets/projects/projectbg.webm")} type={'video/webm; codecs="vp9"'} />
          <source src={withPublicPath("/assets/projects/projectbg.mp4")} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
