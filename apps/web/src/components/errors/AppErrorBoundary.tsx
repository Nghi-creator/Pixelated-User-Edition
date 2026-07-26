import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Pixelated frontend render failure", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-synth-bg px-6 text-white">
        <section className="max-w-lg rounded-lg border border-red-500/40 bg-synth-surface p-8 text-center">
          <h1 className="text-2xl font-bold">The page could not be displayed</h1>
          <p className="mt-3 text-sm text-gray-300">
            A frontend error interrupted this page. Reload to start from a clean state.
          </p>
          <button
            className="mt-6 rounded-md border border-synth-border bg-synth-primary px-4 py-2 font-bold"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload page
          </button>
        </section>
      </main>
    );
  }
}
