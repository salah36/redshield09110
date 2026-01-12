import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Server, Activity } from "lucide-react";

interface StatItemProps {
  value: number;
  suffix?: string;
  label: string;
  delay?: number;
  icon: React.ComponentType<{ className?: string }>;
}

const StatItem = ({ value, suffix = "", label, delay = 0, icon: Icon }: StatItemProps) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const counter = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(counter);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(counter);
    }, delay);

    return () => clearTimeout(timeout);
  }, [value, isInView, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: delay / 1000, ease: "easeOut" }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="text-center group cursor-default"
    >
      <motion.div
        className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/50 transition-all duration-300"
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.4 }}
      >
        <Icon className="w-10 h-10 text-primary drop-shadow-[0_0_15px_hsl(var(--primary)/0.6)]" />
      </motion.div>
      <div className="stat-number mb-3 text-6xl md:text-7xl">
        {count.toLocaleString()}{suffix}
      </div>
      <p className="text-muted-foreground text-lg font-medium tracking-wide">{label}</p>
    </motion.div>
  );
};

const StatsSection = () => {
  // Use public stats endpoint - no authentication required
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => api.getPublicStats(),
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnMount: true,
  });

  if (error) {
    // Silently show zero stats if not authenticated or API error
    return (
      <section className="relative py-28 section-fade overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-crimson/5 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-12 md:p-16 relative overflow-hidden"
          >
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30 rounded-br-xl" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
              <StatItem value={0} icon={Users} label="Blacklisted Players" delay={0} />
              <StatItem value={0} icon={Server} label="Protected Servers" delay={200} />
              <StatItem value={0} icon={Activity} label="Daily Checks" delay={400} />
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="relative py-28 section-fade overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-crimson/5 rounded-full blur-[100px] -translate-y-1/2" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-card p-12 md:p-16 relative overflow-hidden"
          >
            {/* Decorative corner elements */}
            <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30 rounded-tl-xl" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30 rounded-br-xl" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-20 w-20 mx-auto mb-6 rounded-2xl" />
                  <Skeleton className="h-16 w-32 mx-auto mb-3" />
                  <Skeleton className="h-6 w-40 mx-auto" />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-28 section-fade overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-red-crimson/5 rounded-full blur-[100px] -translate-y-1/2" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card p-12 md:p-16 relative overflow-hidden"
        >
          {/* Decorative corner elements */}
          <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/30 rounded-tl-xl" />
          <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/30 rounded-br-xl" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
            <StatItem
              value={stats?.blacklist.active || 0}
              icon={Users}
              label="Blacklisted Players"
              delay={0}
            />
            <StatItem
              value={stats?.guilds.enabled || 0}
              icon={Server}
              label="Protected Servers"
              delay={200}
            />
            <StatItem
              value={stats?.blacklist.recentWeek || 0}
              icon={Activity}
              label="Recent Entries (7d)"
              delay={400}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default StatsSection;
