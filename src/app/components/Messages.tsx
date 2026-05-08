import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Heart } from "lucide-react";
import { db } from "..//../Firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";

interface Message {
  id: string;
  text: string;
  sender: string;
  time: string;
}

const quickMessages = [
  "Te amo ❤️",
  "Saudades de você 🥰",
  "Pensando em você 💭",
  "Você é especial 💕",
];

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = localStorage.getItem("currentUser") ?? "Geovanna";

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          text: data.text,
          sender: data.sender,
          time: data.time,
        };
      });
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

      await addDoc(collection(db, "messages"), {
        text: newMessage,
        sender: currentUser,
        time,
        createdAt: new Date(),
      });

      setNewMessage("");
    } catch (error) {
      console.error("Erro ao enviar:", error);
    }
  };

  const handleQuickMessage = async (text: string) => {
    try {
      const now = new Date();
      const time = `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`;

      await addDoc(collection(db, "messages"), {
        text,
        sender: currentUser,
        time,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-border p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-400 rounded-full flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-foreground">Nosso Chat</h2>
            <p className="text-xs text-muted-foreground">
              Olá, {currentUser} 💕
            </p>
          </div>
        </div>
      </motion.div>

      {/* MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message, index) => {
            const isMe = message.sender === currentUser;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Nome do remetente */}
                <p className="text-xs text-muted-foreground mb-1 px-2">
                  {isMe ? "Você" : message.sender}
                </p>

                <div
                  className={`max-w-[75%] rounded-3xl p-4 ${
                    isMe
                      ? "bg-primary text-white rounded-tr-sm"
                      : "bg-white text-foreground rounded-tl-sm shadow-md"
                  }`}
                >
                  <p className="text-sm mb-1">{message.text}</p>
                  <p className="text-xs opacity-70 text-right">{message.time}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* QUICK MESSAGES */}
      <div className="px-4 py-2 bg-white/50 border-t">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickMessages.map((msg, i) => (
            <button
              key={i}
              onClick={() => handleQuickMessage(msg)}
              className="bg-secondary px-4 py-2 rounded-full text-sm whitespace-nowrap"
            >
              {msg}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 outline-none"
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