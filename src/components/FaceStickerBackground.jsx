import React from 'react';

const FACES = [
  '/faces/Aan.png',
  '/faces/Danil.png',
  '/faces/Iam.png',
  '/faces/Kicil.png',
  '/faces/Patur.png',
  '/faces/Sena.png',
];

const ROTATIONS = [
  'rotate-[-12deg]',
  'rotate-[10deg]',
  'rotate-[-6deg]',
  'rotate-[15deg]',
  'rotate-[-18deg]',
  'rotate-[8deg]',
];

export default function FaceStickerBackground() {
  // Stiker disusun rapat dari atas sampai bawah
  const leftFaces = Array.from({ length: 30 }, (_, i) => ({
    src: FACES[i % FACES.length],
    rotation: ROTATIONS[i % ROTATIONS.length],
  }));

  const rightFaces = Array.from({ length: 30 }, (_, i) => ({
    src: FACES[(i + 2) % FACES.length],
    rotation: ROTATIONS[(i + 3) % ROTATIONS.length],
  }));

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none">
      {/* PINGGIR KIRI — Terkunci maksimal lebar 160px */}
      <div className="absolute left-[-10px] top-0 bottom-0 flex w-36 sm:w-44 flex-wrap content-start justify-center gap-1.5 py-4 opacity-80">
        {leftFaces.map((face, idx) => (
          <img
            key={`left-${idx}`}
            src={face.src}
            alt=""
            className={`h-20 w-20 sm:h-24 sm:w-24 -mb-3 object-contain filter drop-shadow-[2px_2px_0px_rgba(15,23,42,0.15)] ${face.rotation}`}
          />
        ))}
      </div>

      {/* PINGGIR KANAN — Terkunci maksimal lebar 160px */}
      <div className="absolute right-[-10px] top-0 bottom-0 flex w-36 sm:w-44 flex-wrap content-start justify-center gap-1.5 py-4 opacity-80">
        {rightFaces.map((face, idx) => (
          <img
            key={`right-${idx}`}
            src={face.src}
            alt=""
            className={`h-20 w-20 sm:h-24 sm:w-24 -mb-3 object-contain filter drop-shadow-[2px_2px_0px_rgba(15,23,42,0.15)] ${face.rotation}`}
          />
        ))}
      </div>
    </div>
  );
}