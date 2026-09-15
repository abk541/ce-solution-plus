import { Footer } from '@/components/layout/Footer';
import { Nav } from '@/components/layout/Nav';
import { LogoPreloader } from '@/components/motion/LogoPreloader';
import { ScrollLogo } from '@/components/motion/ScrollLogo';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { About } from '@/components/sections/About';
import { Capabilities } from '@/components/sections/Capabilities';
import { Contact } from '@/components/sections/Contact';
import { Differentiators } from '@/components/sections/Differentiators';
import { Hero } from '@/components/sections/Hero';
import { MarketsWeServe } from '@/components/sections/MarketsWeServe';
import { TrustStatement } from '@/components/sections/TrustStatement';
import { Backdrop } from '@/components/ui/Backdrop';

export default function HomePage() {
  return (
    <>
      <LogoPreloader />
      <SmoothScroll />
      <Backdrop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-xs focus:bg-accent focus:px-5 focus:py-3 focus:font-mono focus:text-[0.7rem] focus:uppercase focus:tracking-[0.2em] focus:text-ink-950"
      >
        Skip to content
      </a>
      <Nav />
      <ScrollLogo />
      <main id="main" className="relative">
        <Hero />
        <About />
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
