import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Clock, Gamepad2, LogOut, Moon, Sun, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clearAuthentication, isAuthenticated } from "../auth";
import { db, hasFirebaseConfig, missingFirebaseConfig } from "../../Firebase";
import {
  collection, onSnapshot, query, orderBy, limit, doc,
  setDoc, serverTimestamp, QuerySnapshot, DocumentData, DocumentChange
} from "firebase/firestore";
import toast from "react-hot-toast";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Atualiza o status de presença (Online)
  useEffect(() => {
    if (!isAuthenticated() || !db) return;
    const currentUser = localStorage.getItem("currentUser");
    if (!currentUser) return;

    const userStatusRef = doc(db, "users_status", currentUser);
    
    const updatePresence = async () => {
      await setDoc(userStatusRef, {
        lastSeen: serverTimestamp(),
      }, { merge: true });
    };

    updatePresence();
    const interval = setInterval(updatePresence, 30000); // Atualiza a cada 30s

    return () => clearInterval(interval);
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
    const unsubMessages = onSnapshot(qMessages, (snapshot: QuerySnapshot<DocumentData>) => {
      if (isFirstMsgs) {
        isFirstMsgs = false;
        return;
      }
      snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.sender !== currentUser) {
            toast(`Nova mensagem: "${data.text?.substring(0, 30) || ""}..."`, { icon: "💬" });
          }
        }
      });
    });

    // Ouvir novos Marcos (Timeline)
    const qMilestones = query(collection(db, "milestones"), orderBy("createdAt", "desc"), limit(1));
    const unsubMilestones = onSnapshot(qMilestones, (snapshot: QuerySnapshot<DocumentData>) => {
      if (isFirstMilestones) {
        isFirstMilestones = false;
        return;
      }
      snapshot.docChanges().forEach((change: DocumentChange<DocumentData>) => {
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
      <div className="min-h-screen w-full max-w-md mx-auto bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-lg p-6 text-center">
          <Heart className="w-12 h-12 text-primary fill-current mx-auto mb-4" />
          <h1 className="text-2xl text-primary mb-3">Firebase não configurado</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Preencha o arquivo .env.local ou .env com as chaves do seu projeto Firebase e reinicie o servidor.
          </p>
          <div className="rounded-2xl bg-slate-100 p-3 text-left text-xs text-slate-500">
            {missingFirebaseConfig.map((key) => (
              <p key={key}>{key}</p>
            ))}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 w-full rounded-full bg-primary px-4 py-3 text-white"
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
    { path: "/app/timeline", icon: Clock, label: "Momentos" },
    { path: "/app/extras", icon: Gamepad2, label: "Jogos" },
  ];

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col relative overflow-hidden transition-colors duration-300">
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

      {/* Hamburger Button */}
      <button
        onClick={() => setMenuOpen(true)}
        className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700"
        aria-label="Abrir menu"
      >
        <Menu size={22} className="text-slate-700 dark:text-slate-200" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Side Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="absolute top-0 right-0 h-full w-72 z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary fill-current" />
                <span className="font-semibold text-slate-800 dark:text-slate-100">Nosso Amor</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Fechar menu"
              >
                <X size={20} className="text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 p-4 space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-3">Navegação</p>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                      isActive
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "fill-current" : ""}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Config & Logout */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-3">Configurações</p>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                  {theme === "light" ? <Moon size={20} /> : <Sun size={20} className="text-yellow-400" />}
                  <span>{theme === "light" ? "Modo escuro" : "Modo claro"}</span>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                    theme === "dark" ? "bg-primary" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                      theme === "dark" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sair</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(10deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-10deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
