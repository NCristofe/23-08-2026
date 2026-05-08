import { Outlet, useLocation, useNavigate } from "react-router";
import { Heart, MessageCircle, Image, Clock, Sparkles } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: "/app", icon: Heart, label: "Amor" },
    { path: "/app/messages", icon: MessageCircle, label: "Chat" },
    { path: "/app/gallery", icon: Image, label: "Fotos" },
    { path: "/app/timeline", icon: Clock, label: "Marcos" },
    { path: "/app/extras", icon: Sparkles, label: "Extras" },
  ];

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
