import {
  Cloud,
  FlaskConical,
  HardDrive,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";

const featureCards = [
  {
    accent: "text-sky-300",
    body: "Browse verified games and launch compatible titles without installing a desktop engine.",
    icon: <Cloud className="h-5 w-5" />,
    title: "Browser catalog",
  },
  {
    accent: "text-emerald-300",
    body: "Run supported personal ROMs in memory. ROM bytes stay on your device and are never uploaded.",
    icon: <HardDrive className="h-5 w-5" />,
    title: "Personal ROMs",
  },
  {
    accent: "text-amber-300",
    body: "Every hosted ROM is size-limited and checksum-verified before the emulator starts.",
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Verified launches",
  },
  {
    accent: "text-fuchsia-300",
    body: "Capture browser timing, frame pacing, long tasks, and reproducible research exports.",
    icon: <FlaskConical className="h-5 w-5" />,
    title: "WASM research",
  },
  {
    accent: "text-rose-300",
    body: "Keep favorites, discuss games, and submit properly licensed projects for review.",
    icon: <MessageCircle className="h-5 w-5" />,
    title: "Community",
  },
];

const browserSteps = [
  "Choose a browser-compatible game from the shared catalog.",
  "The API issues a short-lived URL for its verified private ROM artifact.",
  "Your browser downloads the ROM and checks its size and SHA-256 digest locally.",
  "The configured emulator core loads on demand and runs the game with WebAssembly.",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-synth-bg text-white">
      <section className="pixel-animated-backdrop border-b border-synth-border/70">
        <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-6 py-12 sm:min-h-[500px] sm:px-10 lg:min-h-[520px] lg:px-14 xl:px-8">
          <div className="relative z-10 max-w-5xl">
            <h1 className="pixel-title-glow text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl xl:whitespace-nowrap">
              Pixelated User Edition
            </h1>
            <p className="mt-4 max-w-4xl text-xl font-extrabold leading-8 text-white sm:text-2xl">
              Fast, verified retro games running directly in your browser.
            </p>
            <p className="mt-3 max-w-4xl text-base leading-7 text-gray-200 sm:text-lg">
              User Edition replaces the desktop streaming path with an on-demand
              WebAssembly emulator. Browse the shared catalog, play eligible NES
              games, open personal ROMs locally, and export browser-focused
              research measurements without pairing a native engine.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-synth-border bg-synth-primary px-5 font-extrabold text-white transition-colors hover:bg-synth-primary-hover"
                to="/home"
              >
                Go to Home Page
              </Link>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-synth-border bg-synth-surface px-5 font-extrabold text-white transition-colors hover:bg-synth-elevated"
                href="https://pixelated-studio-edition.vercel.app/"
              >
                Open Studio Edition
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-synth-border/60 bg-[#090909] px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-4 overflow-visible sm:grid-cols-2 lg:grid-cols-5">
          {featureCards.map((feature) => (
            <article
              className="feature-pop-card rounded-lg border border-synth-border bg-synth-surface/70 p-5 shadow-card"
              key={feature.title}
            >
              <div className={`mb-4 inline-flex ${feature.accent}`}>
                {feature.icon}
              </div>
              <h2 className="text-lg font-extrabold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-300">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div>
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              One browser, one verified launch path
            </h2>
            <p className="mt-5 text-base leading-7 text-gray-300">
              Catalog pages stay lightweight. Emulator code is downloaded only
              after you start a compatible game, while saves and personal-file
              metadata stay under your control in the browser.
            </p>
          </div>

          <div className="grid gap-3">
            {browserSteps.map((step, index) => (
              <div
                className="flex gap-4 rounded-lg border border-synth-border bg-[#120D10] p-4"
                key={step}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-synth-border bg-synth-surface text-sm font-extrabold text-synth-secondary">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-gray-200">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
