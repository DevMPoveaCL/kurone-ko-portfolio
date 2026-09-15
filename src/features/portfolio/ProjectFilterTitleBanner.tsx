import Image from "next/image";
import { withPublicPath } from "@/shared/routing/public-path";

interface ProjectFilterTitleBannerProps {
  alt?: string;
  className?: string;
}

export function ProjectFilterTitleBanner({
  alt = "",
  className = "project-filter-title-banner",
}: ProjectFilterTitleBannerProps) {
  const isDecorative = alt === "";

  return (
    <div
      aria-hidden={isDecorative || undefined}
      className={className}
    >
      <picture>
        <source
          media="(max-width: 48rem), (pointer: coarse)"
          srcSet={withPublicPath("/assets/projects/titlemobile2.webp")}
        />
        <Image
          alt={alt}
          height={422}
          priority
          sizes="(min-width: 769px) 66rem, 100vw"
          src={withPublicPath("/assets/projects/filter-title.webp")}
          width={1915}
        />
      </picture>
    </div>
  );
}
