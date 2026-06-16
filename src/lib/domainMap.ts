const DOMAIN_MAP: Record<string, string> = {
  "user_3ELTsBzM68dmEFpBMnq1VEhtZBs": "parikshe.in"
};

export function getUserDomain(userId: string): string {
  return DOMAIN_MAP[userId] || "snsh.vercel.app";
}
