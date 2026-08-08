import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <p className="text-sm font-black uppercase tracking-[0.25em] text-synth-secondary">404</p>
      <h1 className="mt-3 text-4xl font-extrabold text-white">Page not found</h1>
      <p className="mt-3 text-gray-400">That route does not exist in Pixelated User Edition.</p>
      <Link
        className="mt-6 rounded-md border border-synth-border bg-synth-primary px-5 py-2.5 font-bold text-white"
        to="/home"
      >
        Return to the library
      </Link>
    </section>
  );
}
