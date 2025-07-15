import { useQuery } from "@tanstack/react-query";
import type { UserSettings } from "@shared/schema";

export const useSettings = () => {
  return useQuery<UserSettings>({
    queryKey: ["userSettings"],
    queryFn: async () => {
      const response = await fetch("/api/user/settings");
      if (!response.ok) {
        throw new Error("Failed to fetch user settings");
      }
      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchOnWindowFocus: true,
  });
};