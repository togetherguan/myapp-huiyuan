export type Member = {
  id: string;
  joinedAt: string;
  displayName: string;
};

const MEMBER_KEY = "myapp-member";
const WELCOME_KEY = "myapp-welcomed";

const ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomMemberId(): string {
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  }
  return `MY-${body}`;
}

export function memberQrValue(id: string): string {
  return `MYAPP:M:${id}`;
}

export function getOrCreateMember(): Member {
  if (typeof window === "undefined") {
    return { id: "MY---------", joinedAt: new Date().toISOString(), displayName: "会员" };
  }
  const raw = window.localStorage.getItem(MEMBER_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Member;
      if (parsed?.id && parsed.joinedAt) return parsed;
    } catch {
      /* recreate */
    }
  }
  const member: Member = {
    id: randomMemberId(),
    joinedAt: new Date().toISOString(),
    displayName: "会员",
  };
  window.localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
  return member;
}

export function saveMember(member: Member): void {
  window.localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
}

export function hasSeenWelcome(): boolean {
  return window.localStorage.getItem(WELCOME_KEY) === "1";
}

export function markWelcomeSeen(): void {
  window.localStorage.setItem(WELCOME_KEY, "1");
}

export function isMemberCode(value: string): boolean {
  return /^(?:MYAPP:M:)?MY-[A-Z0-9]{8}$/.test(value.trim().toUpperCase());
}
