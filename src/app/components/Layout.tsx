import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { Heart, MessageCircle, Clock, Sparkles, LogOut, Moon, Sun } from "lucide-react";
import { clearAuthentication, isAuthenticated } from "../auth";
import { db, ensureAuth, hasFirebaseConfig, missingFirebaseConfig } from "../../Firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    // Garante que o Firebase esteja autenticado sempre que o layout carregar
    if (isAuthenticated() && hasFirebaseConfig) {
      ensureAuth().catch(console.error);
    }
  }, []);

  // Listeners para notificações globais
  useEffect(() => {
    if (!isAuthenticated() || !db) return;

    const currentUser = localStorage.getItem("currentUser");
    
    // Refs para ignorar a carga inicial de dados (não disparar toast para o passado)
    let isFirstMsgs = true;
    let isFirstMilestones = true;

    // Ouvir novas Mensagens
    const qMessages = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(1));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      if (isFirstMsgs) {
        isFirstMsgs = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.sender !== currentUser) {
            toast(`Nova mensagem: "${data.text.substring(0, 30)}..."`, { icon: "💬" });
          }
        }
      });
    });

    // Ouvir novos Marcos (Timeline)
    const qMilestones = query(collection(db, "milestones"), orderBy("createdAt", "desc"), limit(1));
    const unsubMilestones = onSnapshot(qMilestones, (snapshot) => {
      if (isFirstMilestones) {
        isFirstMilestones = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.createdBy !== currentUser) {
            toast(`Novo marco: ${data.title}`, { icon: "📅" });
          }
        }
      });
    });

    return () => {
      unsubMessages();
      unsubMilestones();
    };
  }, []);

  const handleLogout = () => {
    clearAuthentication();
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  if (!hasFirebaseConfig) {
    return (
      <div className="min-h-screen w-full max-w-md mx-auto bg-background flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
          <Heart className="w-12 h-12 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-2xl text-primary mb-3">Firebase não configurado</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Preencha o arquivo .env.local com as chaves do seu projeto Firebase e reinicie o servidor.
          </p>
          <div className="rounded-2xl bg-secondary p-3 text-left text-xs text-muted-foreground">
            {missingFirebaseConfig.map((key) => (
              <p key={key}>{key}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 w-full rounded-full bg-primary px-4 py-3 text-primary-foreground"
          >
            Voltar para login
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/app", icon: Heart, label: "Amor" },
    { path: "/app/messages", icon: MessageCircle, label: "Chat" },
    { path: "/app/timeline", icon: Clock, label: "Marcos" },
    { path: "/app/extras", icon: Sparkles, label: "Extras" },
  ];

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-background dark:bg-slate-950 text-foreground dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-300">
      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-8 text-primary/10 dark:text-primary/20 animate-float">
          <Heart className="w-12 h-12 fill-current" />
        </div>
        <div className="absolute top-32 right-12 text-primary/10 dark:text-primary/20 animate-float-delayed">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <div className="absolute bottom-48 left-16 text-primary/10 dark:text-primary/20 animate-float">
          <Heart className="w-10 h-10 fill-current" />
        </div>
      </div>

      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/20 backdrop-blur-md shadow-sm border border-white/30 dark:border-slate-800"
      >
        {theme === "light" ? <Moon size={20} className="text-slate-700" /> : <Sun size={20} className="text-yellow-400" />}
      </button>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-border dark:border-slate-800">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground dark:text-slate-400"
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            className="flex flex-col items-center gap-1 text-muted-foreground dark:text-slate-400 transition-all duration-300 hover:text-primary"
          >
            <LogOut className="w-6 h-6" />
            <span className="text-xs">Sair</span>
          </button>
        </div>
      </nav>

      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(10deg);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(-10deg);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
