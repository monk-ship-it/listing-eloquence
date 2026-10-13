/** Responsive WebP variants (640/1024/1600) for bundled photography. */
import walkExt640 from "@/assets/home-walk-exterior-640.webp";
import walkExt1024 from "@/assets/home-walk-exterior-1024.webp";
import walkExt1600 from "@/assets/home-walk-exterior-1600.webp";
import walkKit640 from "@/assets/home-walk-kitchen-640.webp";
import walkKit1024 from "@/assets/home-walk-kitchen-1024.webp";
import walkKit1600 from "@/assets/home-walk-kitchen-1600.webp";
import walkGar640 from "@/assets/home-walk-garden-640.webp";
import walkGar1024 from "@/assets/home-walk-garden-1024.webp";
import walkGar1600 from "@/assets/home-walk-garden-1600.webp";
import gHero640 from "@/assets/guides-hero-exterior-640.webp";
import gHero1024 from "@/assets/guides-hero-exterior-1024.webp";
import gHero1600 from "@/assets/guides-hero-exterior-1600.webp";
import gUk640 from "@/assets/guides-uk-terrace-640.webp";
import gUk1024 from "@/assets/guides-uk-terrace-1024.webp";
import gUk1600 from "@/assets/guides-uk-terrace-1600.webp";

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

function set(a: string, b: string, c: string, ratio: number): ResponsiveImage {
  return {
    src: b,
    srcSet: `${a} 640w, ${b} 1024w, ${c} 1600w`,
    width: 1600,
    height: Math.round(1600 * ratio),
  };
}

export const IMG = {
  walkExterior: set(walkExt640, walkExt1024, walkExt1600, 1008 / 1600),
  walkKitchen: set(walkKit640, walkKit1024, walkKit1600, 1008 / 1600),
  walkGarden: set(walkGar640, walkGar1024, walkGar1600, 1008 / 1600),
  guidesHero: set(gHero640, gHero1024, gHero1600, 1088 / 1920),
  guidesUk: set(gUk640, gUk1024, gUk1600, 864 / 1280),
};
