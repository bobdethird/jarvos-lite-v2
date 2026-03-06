"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDownIcon,
  MessageSquareIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DesmosToolAction } from "@/lib/ai/agents/desmos/tools";
import { ChatbotError } from "@/lib/errors";
import type { Attachment, ChatMessage } from "@/lib/types";
import { fetchWithErrorHandlers, generateUUID } from "@/lib/utils";
import { DesmosHeader } from "./desmos-header";
import {
  DesmosCalculatorStandalone,
  type DesmosCalculatorHandle,
} from "./desmos-calculator-standalone";
import { PreviewMessage, ThinkingMessage } from "./message";
import { MultimodalInput } from "./multimodal-input";
import { Button } from "./ui/button";

type DesmosAgentProps = {
  id: string;
  initialChatModel: string;
  initialMessages?: ChatMessage[];
};

export function DesmosAgent({
  id,
  initialChatModel,
  initialMessages = [],
}: DesmosAgentProps) {
  const calculatorRef = useRef<DesmosCalculatorHandle>(null);
  const appliedToolsRef = useRef(new Set<string>());
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isCalculatorReady, setIsCalculatorReady] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(initialChatModel);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedModelIdRef = useRef(selectedModelId);

  useEffect(() => {
    selectedModelIdRef.current = selectedModelId;
  }, [selectedModelId]);

  const {
    messages,
    setMessages,
    sendMessage,
    status,
    stop,
    regenerate,
    addToolApprovalResponse,
  } = useChat<ChatMessage>({
    id,
    messages: initialMessages,
    generateId: generateUUID,
    transport: new DefaultChatTransport({
      api: "/api/desmos-agent",
      fetch: fetchWithErrorHandlers,
      prepareSendMessagesRequest(request) {
        const lastMessage = request.messages.at(-1);

        let desmosState: string | undefined;
        if (calculatorRef.current) {
          const expressions = calculatorRef.current.getExpressions();
          if (expressions.length > 0) {
            const errors = calculatorRef.current.getExpressionErrors();
            const errorMap = new Map(errors.map((e) => [e.id, e.error]));
            desmosState = JSON.stringify({
              expressions: expressions.map((e) => ({
                id: e.id,
                latex: e.latex,
                color: e.color,
                hidden: e.hidden,
                type: e.type,
                ...(errorMap.has(e.id ?? "") ? { error: errorMap.get(e.id ?? "") } : {}),
              })),
            });
          }
        }

        return {
          body: {
            id: request.id,
            message: lastMessage,
            desmosState,
            selectedChatModel: selectedModelIdRef.current,
            ...request.body,
          },
        };
      },
    }),
    onError: (error) => {
      if (error instanceof ChatbotError) {
        toast.error(error.message);
      } else {
        toast.error(error.message || "Oops, an error occurred!");
      }
    },
  });

  useEffect(() => {
    if (!calculatorRef.current) return;

    for (const message of messages) {
      if (message.role !== "assistant") continue;
      for (const part of message.parts) {
        if (
          part.type.startsWith("tool-") &&
          "state" in part &&
          part.state === "output-available" &&
          "output" in part &&
          part.output
        ) {
          const toolId = (part as { toolCallId: string }).toolCallId;
          if (appliedToolsRef.current.has(toolId)) continue;
          appliedToolsRef.current.add(toolId);

          const action = part.output as DesmosToolAction;
          if (action && typeof action === "object" && "action" in action) {
            calculatorRef.current.applyToolAction(action);
          }
        }
      }
    }
  }, [messages]);

  const prevMessageCount = useRef(messages.length);
  useEffect(() => {
    if (messages.length > prevMessageCount.current && messages.length > 0) {
      setIsChatOpen(true);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const messageCount = messages.length;

  return (
    <div className="flex h-dvh w-full flex-col">
      <DesmosHeader />

      <div className="relative min-h-0 flex-1">
        <DesmosCalculatorStandalone
          ref={calculatorRef}
          className="h-full w-full"
          onReady={() => setIsCalculatorReady(true)}
        />

        {/* Floating overlay at bottom center */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-4 pb-4">
          {/* Expandable chat popup */}
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="pointer-events-auto mb-3 w-full max-w-2xl"
                exit={{ opacity: 0, y: 20 }}
                initial={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className="flex max-h-[50vh] flex-col overflow-hidden rounded-xl border bg-background/95 shadow-lg backdrop-blur-sm">
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground text-sm">
                        <p>
                          Ask about math or request a graph to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {messages.map((message, index) => (
                          <PreviewMessage
                            addToolApprovalResponse={addToolApprovalResponse}
                            chatId={id}
                            isLoading={
                              status === "streaming" &&
                              index === messages.length - 1
                            }
                            isReadonly={false}
                            key={message.id}
                            message={message}
                            regenerate={regenerate}
                            requiresScrollPadding={false}
                            setMessages={setMessages}
                            vote={undefined}
                          />
                        ))}

                        {status === "submitted" && <ThinkingMessage />}

                        <div
                          ref={messagesEndRef}
                          className="min-h-[4px] shrink-0"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating input bar */}
          <div className="pointer-events-auto flex w-full max-w-2xl items-end gap-2">
            <ChatToggleButton
              isChatOpen={isChatOpen}
              messageCount={messageCount}
              onToggle={() => setIsChatOpen((v) => !v)}
            />
            <div className="min-w-0 flex-1">
              <MultimodalInput
                attachments={attachments}
                chatId={id}
                className="rounded-xl shadow-lg backdrop-blur-sm"
                input={input}
                messages={messages}
                onModelChange={setSelectedModelId}
                selectedModelId={selectedModelId}
                sendMessage={sendMessage}
                setAttachments={setAttachments}
                setInput={setInput}
                setMessages={setMessages}
                skipNavigation
                status={status}
                stop={stop}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatToggleButton({
  isChatOpen,
  messageCount,
  onToggle,
}: {
  isChatOpen: boolean;
  messageCount: number;
  onToggle: () => void;
}) {
  return (
    <Button
      className="relative h-8 gap-1.5 rounded-lg px-2 transition-colors hover:bg-accent"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
      variant="ghost"
      type="button"
    >
      {isChatOpen ? (
        <ChevronDownIcon className="size-4" />
      ) : (
        <MessageSquareIcon className="size-4" />
      )}
      {!isChatOpen && messageCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
          {messageCount > 9 ? "9+" : messageCount}
        </span>
      )}
    </Button>
  );
}

