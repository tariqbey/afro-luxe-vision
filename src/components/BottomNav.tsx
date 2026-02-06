import { motion } from "framer-motion";
import { Home, Compass, Plus, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  isUpload?: boolean;
  hasNotification?: boolean;
}

const navItems: NavItem[] = [
  { id: "home", icon: Home, label: "Home" },
  { id: "discover", icon: Compass, label: "Discover" },
  { id: "upload", icon: Plus, label: "Upload", isUpload: true },
  { id: "notifications", icon: Bell, label: "Alerts", hasNotification: true },
  { id: "profile", icon: User, label: "Profile" },
];

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  notificationCount?: number;
}

export function BottomNav({ activeTab, onTabChange, notificationCount = 3 }: BottomNavProps) {
  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
    >
      {/* Frosted Glass Background */}
      <div className="mx-4 mb-4 rounded-2xl bg-obsidian/80 backdrop-blur-xl border border-chrome-silver/10 shadow-elevated">
        <div className="flex items-center justify-around h-[72px]">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            if (item.isUpload) {
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative -mt-6"
                  whileTap={{ scale: 0.9 }}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-button flex items-center justify-center shadow-glow-magenta">
                    <Plus className="w-7 h-7 text-pure-white" strokeWidth={2.5} />
                  </div>
                </motion.button>
              );
            }

            return (
              <motion.button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className="relative flex flex-col items-center gap-1 px-4 py-2"
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{
                    y: isActive ? -4 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-colors duration-200",
                      isActive ? "text-neon-magenta" : "text-chrome-silver/60"
                    )}
                  />
                </motion.div>

                <span
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-200",
                    isActive ? "text-neon-magenta" : "text-chrome-silver/60"
                  )}
                >
                  {item.label}
                </span>

                {/* Notification Badge */}
                {item.hasNotification && notificationCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-destructive flex items-center justify-center px-1"
                  >
                    <span className="text-[10px] font-bold text-pure-white">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  </motion.div>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-neon-magenta"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
