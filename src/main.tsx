
  import { createRoot } from "react-dom/client";
  import * as Sentry from "@sentry/react";
  import App from "./app/App.tsx";
  import { config } from "./lib/config";
  import "./styles/index.css";

  if (config.SENTRY_DSN) {
    Sentry.init({
      dsn: config.SENTRY_DSN,
      environment: config.MOCK_MODE ? "development" : "production",
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);
