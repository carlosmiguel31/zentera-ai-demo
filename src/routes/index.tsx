import { createFileRoute } from '@tanstack/react-router'

import { ChatDemo } from '#/components/demo/ChatDemo'
import { Capabilities } from '#/components/zentera/Capabilities'
import { FinalCTA } from '#/components/zentera/FinalCTA'
import { Footer } from '#/components/zentera/Footer'
import { Header } from '#/components/zentera/Header'
import { Hero } from '#/components/zentera/Hero'

export const Route = createFileRoute('/')({ component: LandingPage })

function LandingPage() {
  return (
    <>
      <Header />

      <main>
        <Hero />
        <ChatDemo />
        <Capabilities />
        <FinalCTA />
      </main>

      <Footer />
    </>
  )
}
