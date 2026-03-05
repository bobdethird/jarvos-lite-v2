"use client";

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Artifact } from "@/components/create-artifact";
import {
  CopyIcon,
  MessageIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/icons";
import { DocumentSkeleton } from "@/components/document-skeleton";

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        element: HTMLElement,
        options?: Record<string, unknown>
      ) => DesmosCalculator;
    };
  }
}

type DesmosExpression = {
  id?: string;
  latex?: string;
  color?: string;
  type?: string;
  hidden?: boolean;
  [key: string]: unknown;
};

type DesmosState = {
  expressions: DesmosExpression[];
  settings?: Record<string, unknown>;
};

type DesmosCalculator = {
  setExpression: (expr: DesmosExpression) => void;
  setExpressions: (exprs: DesmosExpression[]) => void;
  removeExpression: (expr: { id: string }) => void;
  getExpressions: () => DesmosExpression[];
  getState: () => unknown;
  setState: (state: unknown, opts?: Record<string, unknown>) => void;
  setBlank: () => void;
  undo: () => void;
  redo: () => void;
  resize: () => void;
  destroy: () => void;
  observeEvent: (event: string, callback: () => void) => void;
  unobserveEvent: (event: string) => void;
};

const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY ?? "dcb31709b452b1cf9dc26972add0fda6";
const DESMOS_SCRIPT_URL = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_API_KEY}`;

function loadDesmosScript(): Promise<void> {
  if (window.Desmos) {
    return Promise.resolve();
  }

  const existing = document.querySelector(
    `script[src^="https://www.desmos.com/api"]`
  );
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve());
      if (window.Desmos) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = DESMOS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Desmos SDK"));
    document.head.appendChild(script);
  });
}

function parseDesmosContent(content: string): DesmosState | null {
  if (!content || content.trim() === "") {
    return null;
  }
  try {
    return JSON.parse(content) as DesmosState;
  } catch {
    return null;
  }
}

function serializeDesmosState(
  calculator: DesmosCalculator
): string {
  const expressions = calculator.getExpressions();
  const state: DesmosState = {
    expressions: expressions.map((expr) => ({
      id: expr.id,
      latex: expr.latex,
      color: expr.color,
      type: expr.type,
      hidden: expr.hidden,
    })),
  };
  return JSON.stringify(state);
}

function DesmosEditor({
  content,
  status,
  isCurrentVersion,
  onSaveContent,
  isLoading,
}: {
  title: string;
  content: string;
  mode: "edit" | "diff";
  isCurrentVersion: boolean;
  currentVersionIndex: number;
  status: "streaming" | "idle";
  suggestions: unknown[];
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
  isInline: boolean;
  getDocumentContentById: (index: number) => string;
  isLoading: boolean;
  metadata: unknown;
  setMetadata: unknown;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculator | null>(null);
  const isApplyingRef = useRef(false);
  const lastSavedContentRef = useRef<string>("");

  const handleChange = useCallback(() => {
    if (isApplyingRef.current || !calculatorRef.current || !isCurrentVersion) {
      return;
    }
    const serialized = serializeDesmosState(calculatorRef.current);
    if (serialized !== lastSavedContentRef.current) {
      lastSavedContentRef.current = serialized;
      onSaveContent(serialized, true);
    }
  }, [isCurrentVersion, onSaveContent]);

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const initCalculator = async () => {
      await loadDesmosScript();
      if (!mounted || !containerRef.current || !window.Desmos) return;

      const calc = window.Desmos.GraphingCalculator(containerRef.current, {
        expressions: true,
        keypad: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsCollapsed: false,
        border: false,
        autosize: true,
      });

      calculatorRef.current = calc;

      const parsed = parseDesmosContent(content);
      if (parsed?.expressions?.length) {
        isApplyingRef.current = true;
        for (const expr of parsed.expressions) {
          calc.setExpression(expr);
        }
        isApplyingRef.current = false;
      }

      lastSavedContentRef.current = content;

      calc.observeEvent("change", handleChange);
    };

    initCalculator();

    return () => {
      mounted = false;
      if (calculatorRef.current) {
        calculatorRef.current.unobserveEvent("change");
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!calculatorRef.current || !isCurrentVersion) return;
    if (status !== "idle") return;

    const parsed = parseDesmosContent(content);
    if (!parsed) return;

    if (content === lastSavedContentRef.current) return;

    isApplyingRef.current = true;
    calculatorRef.current.setBlank();
    for (const expr of parsed.expressions) {
      calculatorRef.current.setExpression(expr);
    }
    lastSavedContentRef.current = content;
    isApplyingRef.current = false;
  }, [content, status, isCurrentVersion]);

  if (isLoading) {
    return <DocumentSkeleton artifactKind="text" />;
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full"
      style={{ minHeight: "500px" }}
    />
  );
}

export const desmosArtifact = new Artifact<"desmos">({
  kind: "desmos",
  description:
    "Useful for graphing equations, visualizing math, and interactive calculator.",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-desmosDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible: true,
        status: "streaming",
      }));
    }
  },
  content: DesmosEditor,
  actions: [
    {
      icon: <UndoIcon size={18} />,
      description: "View Previous version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
      isDisabled: ({ currentVersionIndex }) => currentVersionIndex === 0,
    },
    {
      icon: <RedoIcon size={18} />,
      description: "View Next version",
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
      isDisabled: ({ isCurrentVersion }) => isCurrentVersion,
    },
    {
      icon: <CopyIcon size={18} />,
      description: "Copy expressions to clipboard",
      onClick: ({ content }) => {
        const parsed = parseDesmosContent(content);
        if (parsed?.expressions) {
          const text = parsed.expressions
            .filter((e) => e.latex)
            .map((e) => e.latex)
            .join("\n");
          navigator.clipboard.writeText(text);
        } else {
          navigator.clipboard.writeText(content);
        }
        toast.success("Copied to clipboard!");
      },
    },
  ],
  toolbar: [
    {
      icon: <MessageIcon />,
      description: "Add an equation",
      onClick: ({ sendMessage }) => {
        sendMessage({
          role: "user",
          parts: [
            {
              type: "text",
              text: "Add an interesting equation to the Desmos graph that complements what's already there.",
            },
          ],
        });
      },
    },
  ],
});
