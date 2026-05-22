import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { intervalToDuration, differenceInSeconds, addYears, isBefore } from "date-fns";
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
  const duration = intervalToDuration({ start, end: now });

  const years = duration.years ?? 0;
  const months = duration.months ?? 0;
  const days = duration.days ?? 0;
  const hours = duration.hours ?? 0;
  const minutes = duration.minutes ?? 0;
  const seconds = duration.seconds ?? 0;

  return { years, months, days, hours, minutes, seconds };
};

/**
 * Calcula quanto tempo falta para o próximo aniversário e qual aniversário será.
 */
const getCountdownData = (start: Date) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Define o próximo aniversário baseado no ano atual
  let nextAnniversary = new Date(start);
  nextAnniversary.setFullYear(currentYear);

  if (isBefore(nextAnniversary, now)) {
    nextAnniversary = addYears(nextAnniversary, 1);
  }

  const diffSeconds = differenceInSeconds(nextAnniversary, now);
  const targetAnniversary = nextAnniversary.getFullYear() - start.getFullYear();

  return {
    countdown: {
      days: Math.floor(diffSeconds / (60 * 60 * 24)),
      hours: Math.floor((diffSeconds / (60 * 60)) % 24),
      minutes: Math.floor((diffSeconds / 60) % 60),
      seconds: diffSeconds % 60,
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
        <p className="text-slate-500 dark:text-slate-400 text-sm">Cada segundo ao seu lado é especial</p>
      </motion.div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg dark:shadow-pink-900/10 p-8 mb-6 transition-colors">
        <div className="flex justify-center mb-4">
          <Heart className="w-12 h-12 text-primary fill-current" />
        </div>

        <h2 className="text-center mb-6 dark:text-slate-200">Juntos há</h2>

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
        className="w-full bg-pink-400 text-white rounded-full py-4 transition-all hover:bg-pink-500 dark:bg-pink-600 dark:hover:bg-pink-500 shadow-md active:scale-95"
      >
        {showCountdown ? "Ocultar contagem" : "Ver contagem regressiva"}
      </button>

      {showCountdown && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-white dark:bg-slate-900 rounded-3xl shadow-lg p-8 transition-colors"
        >
          <h3 className="text-center mb-6 dark:text-slate-200">
            {targetAnniversary === 1 ? "Falta" : "Faltam"} para {targetAnniversary}{" "}
            {targetAnniversary === 1 ? "ano" : "anos"} de Namoro! 💕
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
      <div className={`relative overflow-hidden flex justify-center ${small ? "h-8 text-3xl" : "h-10 text-4xl"}`}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -15, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="font-bold text-primary"
                                                                                                            >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}