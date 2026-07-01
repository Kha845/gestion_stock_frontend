import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  
  const { user, login, refreshStores } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [u, setU] = useState("774046983");
  const [p, setP] = useState("password");


  /* =========================
     REDIRECTION SI CONNECTÉ
  ========================= */
  useEffect(() => {
    if (user) {
      navigate({ to: "/" });
    }
  }, [user, navigate]);

  /* =========================
     SUBMIT LOGIN
  ========================= */
 const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const res = await login(u, p);

    if (!res) {
      toast.error("Identifiants invalides");
      return;
    }
    toast.success("Connexion réussie");
    navigate({ to: "/" });
  } catch (error) {
    // console.error("Erreur lors de la connexion :", error);
    toast.error("Une erreur est survenue lors de la connexion");
  }
};

useEffect(() => {
  const loadStores = async () => {
    try {
      await refreshStores();
    } catch (error) {
      console.error("Erreur lors du chargement des magasins :", error);
    }
  };

  loadStores();
}, []);

return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background overflow-hidden">

      {/* ── Panneau gauche ── */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 text-white relative overflow-hidden"
        style={{
          backgroundImage: "url('https://mgx-backend-cdn.metadl.com/generate/images/470876/2026-06-02/pxrurbqaahia/decoration-store-no-candles.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay sombre */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Bulles décoratives animées */}
        <div className="absolute -top-16 -left-16 w-64 h-64 rounded-full bg-white/5 animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-white/5 animate-pulse delay-700" />
        <div className="absolute -bottom-10 left-1/4 w-48 h-48 rounded-full bg-white/5 animate-pulse delay-1000" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center font-bold text-lg">
            E
          </div>
          <span className="font-semibold tracking-wide">ERP Multi-Magasin</span>
        </div>

        {/* Badges stats flottants */}
        <div className="relative z-10 space-y-5">
          <h2 className="text-3xl font-semibold leading-tight">
            Pilotez vos magasins<br />
            <span className="text-white/70">en toute sérénité.</span>
          </h2>
          <p className="text-white/60 max-w-md text-sm leading-relaxed">
            Stock, ventes, achats, caisse, dettes, inventaire et reporting — tout au même endroit.
          </p>

          {/* Tags features */}
          <div className="flex flex-wrap gap-2 mt-2">
            {["📦 Stock", "💰 Caisse", "📊 Reporting", "🔄 Inventaire"].map((tag) => (
              <span
                key={tag}
                className="text-xs bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-white/40">
          © {new Date().getFullYear()} copyright
        </p>
      </div>

      {/* ── Panneau droit : formulaire ── */}
      <div className="flex items-center justify-center p-6 relative">

        {/* Cercles décoratifs subtils en arrière-plan */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-sidebar/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-sidebar/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">

          {/* Logo mobile */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-sidebar text-sidebar-foreground flex items-center justify-center font-bold">E</div>
            <span className="font-semibold text-sm">ERP Multi-Magasin</span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Bon retour 👋</h1>
            <p className="text-muted-foreground text-sm mt-1">Accédez à votre espace de gestion.</p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="u" className="text-sm font-medium">Téléphone</Label>
              <Input
                id="u"
                value={u}
                onChange={(e) => setU(e.target.value)}
                autoFocus
                className="h-11 rounded-xl"
                placeholder="Votre identifiant"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="p" className="text-sm font-medium">Mot de passe</Label>
                {/* <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Mot de passe oublié ?
                </span> */}
              </div>
              <div className="relative">
                <Input
                  id="p"
                  type={showPassword ? "text" : "password"}
                  value={p}
                  onChange={(e) => setP(e.target.value)}
                  className="h-11 rounded-xl pr-12"
                  placeholder="••••••••"
                />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-9 w-9 -translate-y-1/2"
                onClick={() =>
                  setShowPassword((prev) => !prev)
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              </div>
            </div>

            <Button type="submit" className="w-full h-11 rounded-xl font-semibold text-sm mt-2">
              Se connecter →
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}