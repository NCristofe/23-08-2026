import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, ArrowRight, Lock } from "lucide-react";
import { motion } from "motion/react";
import { motion } from "framer-motion";
import { isAuthenticated, saveAuthentication, validatePassword } from "../auth";

const users = [
  { id: 1, name: "Geovanna", emoji: "👩🏻", color: "bg-pink-100" },
  { id: 2, name: "Natanael", emoji: "👨🏻", color: "bg-blue-100" },
];

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/app", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (selectedUser) {
      const user = users.find((u) => u.id === selectedUser);
      if (user) {
        if (!validatePassword(password)) {
          setError("Senha incorreta. Tente novamente.");
          return;
        }

        localStorage.setItem("currentUser", user.name);
        saveAuthentication();
        navigate("/app", { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen w-full max-w-md mx-auto bg-gradient-to-br from-pink-50 via-rose-50 to-red-50 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 0.15, y: 0 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
        className="absolute top-20 left-10"
      >
        <Heart className="w-16 h-16 text-primary fill-current" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.15, y: 0 }}
        transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", delay: 1 }}
        className="absolute bottom-32 right-10"
      >
        <Heart className="w-20 h-20 text-primary fill-current" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <motion.div
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="inline-block mb-4"
        >
          <Heart className="w-20 h-20 text-primary fill-current mx-auto" />
        </motion.div>
        <h1 className="font-romantic text-6xl text-primary mb-2">Nosso Amor</h1>
        <p className="text-foreground/70">em tempo real</p>
      </motion.div>

      <motion.form
        onSubmit={handleLogin}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full"
      >
        <p className="text-center text-foreground/80 mb-6">Entrar como:</p>
        <div className="flex gap-4 mb-8">
          {users.map((user, index) => (
            <motion.button
              type="button"
              key={user.id}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
              onClick={() => setSelectedUser(user.id)}
              className={`flex-1 ${user.color} rounded-3xl p-6 transition-all duration-300 ${
                selectedUser === user.id
                  ? "ring-4 ring-primary shadow-lg scale-105"
                  : "shadow-md hover:scale-102"
              }`}
            >
              <div className="text-5xl mb-3">{user.emoji}</div>
              <p className="text-foreground">{user.name}</p>
            </motion.button>
          ))}
        </div>

        <label className="block text-foreground/80 mb-3" htmlFor="password">
          Insira a senha
        </label>
        <div className="relative mb-3">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            placeholder="Digite a senha"
            className="w-full rounded-full bg-white/80 border border-border py-4 pl-12 pr-4 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
            autoComplete="current-password"
          />
        </div>

        {error && (
          <p className="mb-5 text-center text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          type="submit"
          disabled={!selectedUser || !password}
          className={`w-full bg-primary text-primary-foreground rounded-full py-4 px-6 flex items-center justify-center gap-2 transition-all duration-300 ${
            selectedUser && password
              ? "opacity-100 hover:bg-primary/90 hover:scale-105 shadow-lg"
              : "opacity-50 cursor-not-allowed"
          }`}
        >
          <span>Entrar no nosso mundo</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
      </motion.form>
    </div>
  );
} 
