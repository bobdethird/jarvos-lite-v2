"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import type { DesmosToolAction } from "@/lib/ai/agents/desmos/tools";

type DesmosExpression = {
  id?: string;
  latex?: string;
  color?: string;
  type?: string;
  hidden?: boolean;
  [key: string]: unknown;
};

type DesmosCalculatorInstance = {
  setExpression: (expr: Record<string, unknown>) => void;
  setExpressions: (exprs: Record<string, unknown>[]) => void;
  removeExpression: (expr: { id: string }) => void;
  getExpressions: () => DesmosExpression[];
  getState: () => unknown;
  setState: (state: unknown, opts?: Record<string, unknown>) => void;
  setBlank: () => void;
  undo: () => void;
  redo: () => void;
  resize: () => void;
  destroy: () => void;
  setMathBounds: (bounds: {
    left: number;
    right: number;
    bottom: number;
    top: number;
  }) => void;
  updateSettings: (settings: Record<string, unknown>) => void;
  observeEvent: (event: string, callback: () => void) => void;
  unobserveEvent: (event: string) => void;
};

type DesmosAPI = {
  GraphingCalculator: (
    element: HTMLElement,
    options?: Record<string, unknown>
  ) => DesmosCalculatorInstance;
};

export type DesmosCalculatorHandle = {
  getExpressions: () => DesmosExpression[];
  applyToolAction: (action: DesmosToolAction) => void;
  getInstance: () => DesmosCalculatorInstance | null;
};

const DESMOS_API_KEY =
  process.env.NEXT_PUBLIC_DESMOS_API_KEY ??
  "dcb31709b452b1cf9dc26972add0fda6";
const DESMOS_SCRIPT_URL = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_API_KEY}`;

function getDesmosAPI(): DesmosAPI | undefined {
  return (window as unknown as { Desmos?: DesmosAPI }).Desmos;
}

function loadDesmosScript(): Promise<void> {
  if (getDesmosAPI()) {
    return Promise.resolve();
  }

  const existing = document.querySelector(
    `script[src^="https://www.desmos.com/api"]`
  );
  if (existing) {
    return new Promise((resolve) => {
      existing.addEventListener("load", () => resolve());
      if (getDesmosAPI()) resolve();
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

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

type DesmosCalculatorProps = {
  className?: string;
  onReady?: () => void;
};

export const DesmosCalculatorStandalone = forwardRef<
  DesmosCalculatorHandle,
  DesmosCalculatorProps
>(function DesmosCalculatorStandalone({ className, onReady }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<DesmosCalculatorInstance | null>(null);

  const applyToolAction = useCallback((action: DesmosToolAction) => {
    const calc = calculatorRef.current;
    if (!calc) return;

    switch (action.action) {
      case "addExpression": {
        const { action: _, ...expr } = action;
        calc.setExpression(stripUndefined(expr as Record<string, unknown>));
        break;
      }
      case "removeExpression": {
        calc.removeExpression({ id: action.id });
        break;
      }
      case "updateExpression": {
        const { action: _, ...updates } = action;
        calc.setExpression(stripUndefined(updates as Record<string, unknown>));
        break;
      }
      case "setExpressions": {
        calc.setBlank();
        for (const expr of action.expressions) {
          calc.setExpression(stripUndefined(expr as Record<string, unknown>));
        }
        break;
      }
      case "clearGraph": {
        calc.setBlank();
        break;
      }
      case "setViewport": {
        calc.setMathBounds({
          left: action.left,
          right: action.right,
          bottom: action.bottom,
          top: action.top,
        });
        break;
      }
      case "updateSettings": {
        const { action: _, ...settings } = action;
        calc.updateSettings(stripUndefined(settings as Record<string, unknown>));
        break;
      }
      case "addTable": {
        calc.setExpression(
          stripUndefined({
            id: action.id,
            type: "table",
            columns: action.columns.map((col: { latex: string; values: (number | string)[]; color?: string }) => stripUndefined({
              latex: col.latex,
              values: col.values,
              color: col.color,
            })),
          })
        );
        break;
      }
      case "addFolder": {
        calc.setExpression(
          stripUndefined({
            id: action.id,
            type: "folder",
            title: action.title,
            collapsed: action.collapsed,
          })
        );
        break;
      }
      case "addNote": {
        calc.setExpression({
          id: action.id,
          type: "text",
          text: action.text,
        });
        break;
      }
    }
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      getExpressions: () => calculatorRef.current?.getExpressions() ?? [],
      applyToolAction,
      getInstance: () => calculatorRef.current,
    }),
    [applyToolAction]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    let mounted = true;

    const init = async () => {
      await loadDesmosScript();
      const desmos = getDesmosAPI();
      if (!mounted || !containerRef.current || !desmos) return;

      const calc = desmos.GraphingCalculator(containerRef.current, {
        expressions: true,
        keypad: true,
        settingsMenu: true,
        zoomButtons: true,
        expressionsCollapsed: false,
        border: false,
        autosize: true,
      });

      calculatorRef.current = calc;
      onReady?.();
    };

    init();

    return () => {
      mounted = false;
      if (calculatorRef.current) {
        calculatorRef.current.destroy();
        calculatorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-full w-full"}
      style={{ minHeight: "400px" }}
    />
  );
});
