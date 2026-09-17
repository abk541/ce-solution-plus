import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { LogoPreloader } from '@/components/motion/LogoPreloader';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { About } from '@/components/sections/About';
import { Capabilities } from '@/components/sections/Capabilities';
import { Contact } from '@/components/sections/Contact';
import { Differentiators } from '@/components/sections/Differentiators';
import { Hero } from '@/components/sections/Hero';
import { MarketsWeServe } from '@/components/sections/MarketsWeServe';
import { MissionEnvironmentBand } from '@/components/sections/MissionEnvironmentBand';
import { TrustStatement } from '@/components/sections/TrustStatement';
import { Backdrop } from '@/components/ui/Backdrop';
import { BackToTop } from '@/components/ui/BackToTop';

export default function HomePage() {
  return (
    <>
      <LogoPreloader />
      <SmoothScroll />
      <Backdrop />
      <BackToTop />
      <a
        href="#main"
        data-menu-background
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-xs focus:bg-accent focus:px-5 focus:py-3 focus:font-mono focus:text-[0.7rem] focus:uppercase focus:tracking-[0.2em] focus:text-ink-950"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main" className="relative">
        <Hero />
        <About />
        <MissionEnvironmentBand />
        <Capabilities />
        <Differentiators />
        <MarketsWeServe />
        <TrustStatement />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
