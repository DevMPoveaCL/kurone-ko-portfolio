import type { NextConfig } from "next";

const DEPLOY_TARGET = {
  GITHUB_PAGES: "github-pages",
  ROOT: "root",
} as const;

const deployTarget = process.env.DEPLOY_TARGET === DEPLOY_TARGET.GITHUB_PAGES
  ? DEPLOY_TARGET.GITHUB_PAGES
  : DEPLOY_TARGET.ROOT;
const githubPagesBasePath = "/kurone-ko-portfolio";
const isGitHubPages = deployTarget === DEPLOY_TARGET.GITHUB_PAGES;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_DEPLOY_TARGET: deployTarget,
  },
  ...(isGitHubPages
    ? { assetPrefix: githubPagesBasePath, basePath: githubPagesBasePath }
    : {}),
};

export default nextConfig;
