import { createBrowserRouter, RouterProvider, Outlet, useNavigate } from "react-router";
import { NAVY, LogoIcon, LimeBtn } from "./ui/primitives";
import { IntroSplash } from "./IntroSplash";
import { AppContextProvider } from "./context/AppContext";
import { LandingPage } from "./landing/LandingPage";
import { ClientePortal } from "./client/ClientePortal";
import { ProfesionalPortal } from "./pro/ProfesionalPortal";
import { AdminPortal } from "./admin/AdminPortal";
import { PrivacyPolicyPage } from "./legal/PrivacyPolicyPage";
import { TermsPage } from "./legal/TermsPage";
import { ArrowRight } from "lucide-react";

// ─── PAGE: 404 ────────────────────────────────────────────────────────────────
function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
      style={{ background: NAVY, fontFamily: "Inter, sans-serif" }}>
      <LogoIcon size="lg" />
      <h1 className="text-8xl font-black text-white mt-6 mb-3" style={{ letterSpacing: "-0.04em" }}>404</h1>
      <p className="text-slate-400 text-lg mb-2">Esta página no existe.</p>
      <p className="text-slate-600 text-sm mb-10">Quizás la URL cambió o fue escrita incorrectamente.</p>
      <LimeBtn onClick={() => navigate("/")} className="text-base px-8 py-3.5">
        <ArrowRight className="w-4 h-4 rotate-180" />Volver al inicio
      </LimeBtn>
    </div>
  );
}

// ─── Root layout (provides context to all routes) ────────────────────────────
function Root() {
  return (
    <AppContextProvider>
      <Outlet />
    </AppContextProvider>
  );
}

// ─── Router ───────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true,          Component: LandingPage },
      { path: "cliente",      Component: ClientePortal },
      { path: "profesional",  Component: ProfesionalPortal },
      { path: "admin",        Component: AdminPortal },
      { path: "privacidad",   Component: PrivacyPolicyPage },
      { path: "terminos",     Component: TermsPage },
      { path: "*",            Component: NotFoundPage },
    ],
  },
]);

// ─── Entry point ──────────────────────────────────────────────────────────────
export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <IntroSplash />
    </>
  );
}
