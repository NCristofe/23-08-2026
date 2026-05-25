import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Heart } from "lucide-react";
import { format } from "date-fns";
import { db } from "../../Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  doc,
  QuerySnapshot,
  DocumentData,
  DocumentSnapshot
} from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  sender: string;
  time: string;
}

function getFirebaseErrorMessage(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };

  if (firebaseError.code === "permission-denied") {
    return "Permissão negada no Firestore. Publique as regras liberando leitura e escrita em messages.";
  }

  return `Não foi possível enviar. ${firebaseError.code || firebaseError.message || "Veja o console para mais detalhes."}`;
}

const quickMessages = [
  "Te amo ❤️",
  "Saudades de você 🥰",
  "Pensando em você 💭",
  "Você é especial 💕",
];

// Define users here for easy access
const allUsers = [
  { id: 1, name: "Geovanna", emoji: "👩🏻" },
  { id: 2, name: "Natanael", emoji: "👨🏻" },
];

export default function Messages() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [partnerStatus, setPartnerStatus] = useState<any>(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = localStorage.getItem("currentUser");
  // Determine the other user
  const otherUser = allUsers.find(user => user.name !== currentUser);

  useEffect(() => {
    if (!currentUser) navigate("/");
  }, [currentUser, navigate]);

  // Ouvir status do parceiro
  useEffect(() => {
    if (!db || !otherUser) return;
    const unsub = onSnapshot(doc(db, "users_status", otherUser.name), (snapshot: DocumentSnapshot<DocumentData>) => {
      if (snapshot.exists()) setPartnerStatus(snapshot.data());
    }, (error: any) => {
      console.error("Erro ao carregar status:", error);
    });
    return () => unsub();
  }, [otherUser]);

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      setError("");
      const msgs: Message[] = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          sender: data.sender,
          time: data.time,
        };
      });
      setMessages(msgs);
    }, (error: any) => {
      console.error("Erro ao carregar mensagens:", error);
      setError(getFirebaseErrorMessage(error));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !db) return;

    try {
      setError("");
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        sender: currentUser ?? "Anônimo",
        time: format(new Date(), "HH:mm"),
        createdAt: new Date(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar:", error);
      setError(getFirebaseErrorMessage(error));
    }
  };

  const handleQuickMessage = async (text: string) => {
    if (!db) return;

    try {
      setError("");
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

      await addDoc(collection(db, "messages"), {
        text,
        sender: currentUser ?? "Anônimo",
        time,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem rápida:", error);
      setError(getFirebaseErrorMessage(error));
    }
  };

  const getStatusDisplay = () => {
    if (!partnerStatus?.lastSeen) return "Offline";
    
    const lastSeenDate = partnerStatus.lastSeen.toDate();
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - lastSeenDate.getTime()) / 1000);

    // Se a última atualização foi há menos de 70 segundos, consideramos Online
    if (diffInSeconds < 70) return "Online 💕";
    
    return `Visto por último: ${format(lastSeenDate, "HH:mm")}`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-400 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-current" />
            {/* Display other user's emoji or a default heart */}
            {otherUser?.emoji ? (
              <span className="text-2xl">{otherUser.emoji}</span>
            ) : (
              <Heart className="w-6 h-6 text-white fill-current" />
            )}
          </div>
          <div>
            <h2 className="text-slate-900 dark:text-slate-100 font-bold">{otherUser?.name || "Parceiro"}</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">{getStatusDisplay()}</p>
          </div>
        </div>
      </motion.div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <AnimatePresence>
          {messages.map((message, index) => {
            const isMe = currentUser !== null && message.sender === currentUser;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Nome do remetente */}
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-1 px-2 font-medium">
                  {isMe ? "Você" : message.sender}
                </p>

                <div
                  className={`max-w-[75%] rounded-3xl p-4 ${
                    isMe
                      ? "bg-pink-500 text-white rounded-tr-sm"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-md"
                  }`}
                >
                  <p className="text-sm mb-1 leading-relaxed">{message.text}</p>
                  <p className={`text-[10px] opacity-70 text-right ${isMe ? "text-white" : "text-slate-600 dark:text-slate-300"}`}>{message.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK MESSAGES */}
      <div className="px-4 py-2 bg-white/50 dark:bg-slate-900/50 border-t dark:border-slate-800 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickMessages.map((msg, i) => (
            <button
              key={i}
              onClick={() => handleQuickMessage(msg)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-sm whitespace-nowrap border border-slate-200 dark:border-slate-700"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t dark:border-slate-800 transition-colors">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none border border-slate-200 dark:border-slate-700"
          />
          <button
            onClick={handleSend}
            className="bg-primary text-white w-12 h-12 rounded-full flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
