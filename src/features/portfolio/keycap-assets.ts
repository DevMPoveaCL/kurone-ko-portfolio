export interface KeycapAsset {
  height: number;
  src: string;
  width: number;
}

export const KEYCAP_ASSET = {
  UP: { src: "/assets/projects/keycaps-tight/up.webp", width: 868, height: 740 },
  DOWN: { src: "/assets/projects/keycaps-tight/down.webp", width: 867, height: 740 },
  TAB: { src: "/assets/projects/keycaps-tight/tab.webp", width: 1250, height: 722 },
  ENTER: { src: "/assets/projects/keycaps-tight/enter.webp", width: 862, height: 755 },
  SPACE: { src: "/assets/projects/keycaps-tight/space.webp", width: 998, height: 554 },
  ESC: { src: "/assets/projects/keycaps-tight/esc.webp", width: 773, height: 570 },
  DELETE: { src: "/assets/projects/keycaps-tight/del.webp", width: 766, height: 569 },
  ALT: { src: "/assets/projects/keycaps-tight/alt.webp", width: 867, height: 755 },
  OPT: { src: "/assets/projects/keycaps-tight/opt.webp", width: 875, height: 778 },
  X: { src: "/assets/projects/keycaps-tight/x.webp", width: 876, height: 777 },
  Q: { src: "/assets/projects/keycaps-tight/q.webp", width: 874, height: 777 },
  CLEAR: { src: "/assets/projects/keycaps-tight/C.webp", width: 833, height: 652 },
  APPLY: { src: "/assets/projects/keycaps-tight/A.webp", width: 829, height: 652 },
  FILTER: { src: "/assets/projects/keycaps-tight/F.webp", width: 825, height: 645 },
  M: { src: "/assets/projects/keycaps-tight/m.webp", width: 876, height: 777 },
  STACK: { src: "/assets/projects/keycaps-tight/S.webp", width: 1536, height: 1024 },
  INFO: { src: "/assets/projects/keycaps-tight/i.webp", width: 1536, height: 1024 },
} as const satisfies Record<string, KeycapAsset>;

export type KeycapName = keyof typeof KEYCAP_ASSET;
