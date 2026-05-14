"use client";

import { useRef, useState } from "react";

const stories = [
  {
    name: "Benjamin",
    label: "Coach Quentin",
    src: "/uploads/video/ITW%20Benjamin%20(coach%20Quentin).MP4",
  },
  {
    name: "Julia",
    label: "Coach Chris",
    src: "/uploads/video/ITW%20Julia%20(coach%20Chris).MP4",
  },
];

export function VideoStories() {
  const [active, setActive] = useState<number | null>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  const openStory = (index: number) => {
    setActive(index);
  };

  const closeStory = () => {
    setActive(null);
    if (modalVideoRef.current) {
      modalVideoRef.current.pause();
      modalVideoRef.current.currentTime = 0;
    }
  };

  return (
    <>
      <div className="flex justify-center gap-8 md:gap-14">
        {stories.map((story, i) => (
          <button
            key={story.src}
            onClick={() => openStory(i)}
            className="group flex flex-col items-center gap-3 focus:outline-none"
            aria-label={`Témoignage de ${story.name} – ${story.label}`}
          >
            {/* Story ring + bubble */}
            <div
              className="relative flex h-[110px] w-[110px] items-center justify-center rounded-full p-[3px] md:h-[130px] md:w-[130px]"
              style={{
                background:
                  "linear-gradient(135deg, #cffd5a 0%, #a8d400 45%, #111 100%)",
              }}
            >
              {/* Inner circle */}
              <div className="relative h-full w-full overflow-hidden rounded-full border-[3px] border-black bg-black">
                <video
                  src={story.src}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                  className="h-full w-full object-cover opacity-90 transition duration-300 group-hover:opacity-100 group-hover:scale-105"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition duration-200 group-hover:bg-black/10">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm transition group-hover:bg-[var(--accent)]">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-4 w-4 translate-x-[1px] text-white transition group-hover:text-black"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Labels */}
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{story.name}</p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/45">
                {story.label}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Modal overlay */}
      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/92 backdrop-blur-md"
          onClick={closeStory}
        >
          <div
            className="relative w-full max-w-[380px] overflow-hidden rounded-[28px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Story top ring accent */}
            <div className="absolute inset-x-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[var(--accent)] via-[#a8d400] to-transparent" />

            <video
              ref={modalVideoRef}
              src={stories[active].src}
              autoPlay
              controls
              playsInline
              className="aspect-[9/16] w-full bg-black object-cover"
            />

            {/* Info bar */}
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-5 pt-10 pointer-events-none">
              <p className="text-base font-semibold text-white">
                {stories[active].name}
              </p>
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/60">
                {stories[active].label}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={closeStory}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black"
              aria-label="Fermer"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
