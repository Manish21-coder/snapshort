export const PARIKSHE_USER_ID = "user_3ELTsBzM68dmEFpBMnq1VEhtZBs";

const DOMAIN_MAP: Record<string, string> = {
  [PARIKSHE_USER_ID]: "parikshe.in",
};

export function getUserDomain(userId: string): string {
  return DOMAIN_MAP[userId] || "snsh.vercel.app";
}
