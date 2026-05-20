import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import { Heart, MessageCircle, Image, Clock, Sparkles, LogOut } from "lucide-react";
import { clearAuthentication, isAuthenticated } from "../auth";
import { db, ensureAuth } from "../../Firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";
import toast from "react-hot-toast";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Garante que o Firebase esteja autenticado sempre que o layout carregar
    if (isAuthenticated()) {
      ensureAuth().catch(console.error);
    }
  }, []);

  // Listeners para notificações globais
  useEffect(() => {
    if (!isAuthenticated()) return;

    const currentUser = localStorage.getItem("currentUser");
    
    // Refs para ignorar a carga inicial de dados (não disparar toast para o passado)
    let isFirstMsgs = true;
    let isFirstPhotos = true;
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

    // Ouvir novas Fotos
    const qPhotos = query(collection(db, "photos"), orderBy("createdAt", "desc"), limit(1));
    const unsubPhotos = onSnapshot(qPhotos, (snapshot) => {
      if (isFirstPhotos) {
        isFirstPhotos = false;
        return;
      }
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (data.createdBy !== currentUser) {
            toast.success("Nova foto adicionada na galeria! ❤️", { icon: "📸" });
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
      unsubPhotos();
      unsubMilestones();
    };
  }, []);

  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const navItems = [
    { path: "/app", icon: Heart, label: "Amor" },
    { path: "/app/messages", icon: MessageCircle, label: "Chat" },
    { path: "/app/gallery", icon: Image, label: "Fotos" },
    { path: "/app/timeline", icon: Clock, label: "Marcos" },
    { path: "/app/extras", icon: Sparkles, label: "Extras" },
  ];

  const handleLogout = () => {
    clearAuthentication();
    localStorage.removeItem("currentUser");
    navigate("/", { replace: true });
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-background flex flex-col relative overflow-hidden">
      {/* Floating hearts decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-8 text-primary/10 animate-float">
          <Heart className="w-12 h-12 fill-current" />
        </div>
        <div className="absolute top-32 right-12 text-primary/10 animate-float-delayed">
          <Heart className="w-8 h-8 fill-current" />
        </div>
        <div className="absolute bottom-48 left-16 text-primary/10 animate-float">
          <Heart className="w-10 h-10 fill-current" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/80 backdrop-blur-lg border-t border-border">
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? "text-primary scale-110" : "text-muted-foreground"
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
            className="flex flex-col items-center gap-1 text-muted-foreground transition-all duration-300 hover:text-primary"
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
