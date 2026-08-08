import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { queryClient } from "./lib/api/queryClient";
import { registerServiceWorker } from "./lib/registerServiceWorker";
import { AppErrorBoundary } from "./components/errors/AppErrorBoundary";

registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </AppErrorBoundary>,
);
