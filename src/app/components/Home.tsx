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

export default function Home() {
  const startDate = new Date("2025-08-23T00:00:00");

  const [timeElapsed, setTimeElapsed] = useState<TimeElapsed>(calculateTimeElapsed());
  const [countdown, setCountdown] = useState<Countdown>(calculateCountdown());
  const [showCountdown, setShowCountdown] = useState(false);

  function calculateTimeElapsed(): TimeElapsed {
    const now = new Date();

    let years = now.getFullYear() - startDate.getFullYear();
    let months = now.getMonth() - startDate.getMonth();
    let days = now.getDate() - startDate.getDate();

    let hours = now.getHours() - startDate.getHours();
    let minutes = now.getMinutes() - startDate.getMinutes();
    let seconds = now.getSeconds() - startDate.getSeconds();

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
      const lastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += lastMonth.getDate();
      months--;
    }

    if (months < 0) {
      months += 12;
      years--;
    }

    return { years, months, days, hours, minutes, seconds };
  }

  function calculateCountdown(): Countdown {
    const now = new Date();

    let nextAnniversary = new Date(startDate);
    nextAnniversary.setFullYear(now.getFullYear());

    if (nextAnniversary < now) {
      nextAnniversary.setFullYear(now.getFullYear() + 1);
    }

    const diff = nextAnniversary.getTime() - now.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return {
      days,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(calculateTimeElapsed());
      setCountdown(calculateCountdown());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const years = new Date().getFullYear() - startDate.getFullYear();

  return (
    <div className="min-h-screen w-full p-6 pt-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-romantic text-5xl text-primary mb-1">
          Nosso Amor
        </h1>
        <p className="text-muted-foreground text-sm">
          Cada segundo ao seu lado é especial
        </p>
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
        className="w-full bg-pink-400 text-white rounded-full py-4"
      >
        {showCountdown ? "Ocultar contagem" : "Ver contagem regressiva"}
      </button>

      {showCountdown && (
        <div className="mt-6 bg-white rounded-3xl shadow-lg p-8">
          <h3 className="text-center mb-6">
            Faltam para {years + 0} ano de amor 💕
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <TimeUnit value={countdown.days} label="Dias" />
            <TimeUnit value={countdown.hours} label="Horas" />
            <TimeUnit value={countdown.minutes} label="Minutos" />
            <TimeUnit value={countdown.seconds} label="Segundos" />
          </div>
        </div>
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