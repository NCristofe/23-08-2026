import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Calendar } from "lucide-react";

type TimeElapsed = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const START_DATE = new Date("2025-08-23T00:00:00");

/**
 * Calcula o tempo decorrido desde uma data inicial de forma legível.
 */
const getTimeElapsed = (start: Date): TimeElapsed => {
  const now = new Date();
  if (start > now) return { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();
  let hours = now.getHours() - start.getHours();
  let minutes = now.getMinutes() - start.getMinutes();
  let seconds = now.getSeconds() - start.getSeconds();

  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  if (hours < 0) {
    hours += 24;
    days--;
  }
  if (days < 0) {
    // Pega o último dia do mês anterior para ajuste
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += lastDayOfMonth;
    months--;
  }
  if (months < 0) {
    months += 12;
    years--;
  }

  return { years, months, days, hours, minutes, seconds };
};

/**
 * Calcula quanto tempo falta para o próximo aniversário e qual aniversário será.
 */
const getCountdownData = (start: Date) => {
  const now = new Date();
  const currentYear = now.getFullYear();

  let nextAnniversary = new Date(start);
  nextAnniversary.setFullYear(currentYear);

  // Se o aniversário já passou este ano, calcula para o próximo ano
  if (nextAnniversary <= now) {
    nextAnniversary.setFullYear(currentYear + 1);
  }

  const diff = nextAnniversary.getTime() - now.getTime();
  const targetAnniversary = nextAnniversary.getFullYear() - start.getFullYear();

  return {
    countdown: {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    },
    targetAnniversary,
  };
};

export default function Home() {
  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>(() => getTimeElapsed(START_DATE));
  const [countdownInfo, setCountdownInfo] = useState(() => getCountdownData(START_DATE));
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(getTimeElapsed(START_DATE));
      setCountdownInfo(getCountdownData(START_DATE));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const { countdown, targetAnniversary } = countdownInfo;

  return (
    <div className="min-h-screen w-full p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-romantic text-5xl text-primary mb-1">Nosso Amor</h1>
        <p className="text-muted-foreground text-sm">Cada segundo ao seu lado é especial</p>
      </motion.div>

      <div className="bg-white rounded-3xl shadow-lg p-8 mb-6">
        <div className="flex justify-center mb-4">
          <Heart className="w-12 h-12 text-primary fill-current" />
        </div>

        <h2 className="text-center mb-6">Juntos há</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <TimeUnit value={timeElapsed.years} label="Anos" />
          <TimeUnit value={timeElapsed.months} label="Meses" />
          <TimeUnit value={timeElapsed.days} label="Dias" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <TimeUnit value={timeElapsed.hours} label="Horas" small />
          <TimeUnit value={timeElapsed.minutes} label="Min" small />
          <TimeUnit value={timeElapsed.seconds} label="Seg" small />
        </div>
      </div>

      <button
        onClick={() => setShowCountdown(!showCountdown)}
        className="w-full bg-pink-400 text-white rounded-full py-4 transition-colors hover:bg-pink-500"
      >
        {showCountdown ? "Ocultar contagem" : "Ver contagem regressiva"}
      </button>

      {showCountdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white rounded-3xl shadow-lg p-8"
        >
          <h3 className="text-center mb-6">
            Faltam para {targetAnniversary} {targetAnniversary === 1 ? "ano" : "anos"} de amor 💕
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <TimeUnit value={countdown.days} label="Dias" />
            <TimeUnit value={countdown.hours} label="Horas" />
            <TimeUnit value={countdown.minutes} label="Min" />
            <TimeUnit value={countdown.seconds} label="Seg" />
          </div>
        </motion.div>
      )}
    </div>
  );
}

type TimeUnitProps = {
  value: number;
  label: string;
  small?: boolean;
};

function TimeUnit({ value, label, small = false }: TimeUnitProps) {
  return (
    <div className="text-center">
      <div className={`${small ? "text-3xl" : "text-4xl"}`}>
        {value}
      </div>
      <div>{label}</div>
    </div>
  );
}