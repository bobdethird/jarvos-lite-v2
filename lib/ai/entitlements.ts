import type { UserType } from "@/app/(auth)/auth";
import { isProductionEnvironment } from "@/lib/constants";

type Entitlements = {
  maxMessagesPerHour: number;
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users without an account
   */
  guest: {
    maxMessagesPerHour: isProductionEnvironment ? 10 : 100,
  },

  /*
   * For users with an account
   */
  regular: {
    maxMessagesPerHour: isProductionEnvironment ? 10 : 100,
  },

  /*
   * TODO: For users with an account and a paid membership
   */
};
