import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import SpeciesStrip from '@/components/home/SpeciesStrip'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950">
      <HeroSection />
      <FeaturesSection />
      <SpeciesStrip />
    </main>
  )
}
