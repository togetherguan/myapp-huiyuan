import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getOrCreateMember,
  hasSeenWelcome,
  markWelcomeSeen,
  saveMember,
  type Member,
} from "@/lib/member";

type MemberContextValue = {
  member: Member | null;
  ready: boolean;
  showWelcome: boolean;
  dismissWelcome: () => void;
  updateName: (name: string) => void;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [ready, setReady] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const next = getOrCreateMember();
    setMember(next);
    setShowWelcome(!hasSeenWelcome());
    setReady(true);
  }, []);

  const value = useMemo<MemberContextValue>(
    () => ({
      member,
      ready,
      showWelcome,
      dismissWelcome: () => {
        markWelcomeSeen();
        setShowWelcome(false);
      },
      updateName: (name: string) => {
        setMember((prev) => {
          if (!prev) return prev;
          const next = { ...prev, displayName: name.trim() || "会员" };
          saveMember(next);
          return next;
        });
      },
    }),
    [member, ready, showWelcome],
  );

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>;
}

export function useMember() {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within MemberProvider");
  return ctx;
}
