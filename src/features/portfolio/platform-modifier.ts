"use client";

import { useSyncExternalStore } from "react";

const PLATFORM_MODIFIER = {
  ALT: "Alt",
  OPTION: "Option",
} as const;

export type PlatformModifier = (typeof PLATFORM_MODIFIER)[keyof typeof PLATFORM_MODIFIER];

interface NavigatorWithUserAgentData extends Navigator {
  userAgentData?: {
    platform?: string;
  };
}

function isMacPlatform(platform: string | undefined) {
  return /mac/i.test(platform ?? "");
}

export function getPlatformModifier(navigatorValue: Navigator): PlatformModifier {
  const navigatorWithUserAgentData = navigatorValue as NavigatorWithUserAgentData;

  if (isMacPlatform(navigatorWithUserAgentData.userAgentData?.platform)) return PLATFORM_MODIFIER.OPTION;
  if (isMacPlatform(navigatorValue.platform)) return PLATFORM_MODIFIER.OPTION;
  if (isMacPlatform(navigatorValue.userAgent)) return PLATFORM_MODIFIER.OPTION;
  return PLATFORM_MODIFIER.ALT;
}

function subscribeToPlatform() {
  return () => undefined;
}

function getClientPlatformModifier() {
  return getPlatformModifier(window.navigator);
}

function getServerPlatformModifier(): PlatformModifier {
  return PLATFORM_MODIFIER.ALT;
}

export function usePlatformModifier() {
  return useSyncExternalStore(subscribeToPlatform, getClientPlatformModifier, getServerPlatformModifier);
}
