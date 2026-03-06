import { cookies } from "next/headers";
import { DesmosAgent } from "@/components/desmos-agent";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { generateUUID } from "@/lib/utils";

export default async function DesmosPage() {
  const cookieStore = await cookies();
  const id = generateUUID();
  const chatModelFromCookie = cookieStore.get("chat-model");

  return (
    <DesmosAgent
      id={id}
      initialChatModel={chatModelFromCookie?.value ?? DEFAULT_CHAT_MODEL}
      key={id}
    />
  );
}
