import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./globals.css";
import { registerMobileAuthHandler } from "./lib/mobileAuth.ts";

registerMobileAuthHandler();
createRoot(document.getElementById("root")!).render(<App />);
