import { tool } from "ai";
import { z } from "zod";

const expressionPropsSchema = z.object({
  id: z.string().describe("Unique expression ID, e.g. 'expr1', 'line_a'"),
  latex: z.string().describe("Desmos LaTeX expression, e.g. 'y=x^2', 'y=\\\\sin(x)'"),
  color: z
    .string()
    .optional()
    .describe("Hex color, e.g. '#c74440', '#2d70b3', '#388c46'"),
  hidden: z.boolean().optional().describe("Whether to hide the expression from the graph"),
  lineStyle: z
    .enum(["SOLID", "DASHED", "DOTTED"])
    .optional()
    .describe("Line drawing style"),
  lineWidth: z.number().optional().describe("Line width in pixels, e.g. 2.5"),
  lineOpacity: z.number().min(0).max(1).optional().describe("Line opacity 0-1"),
  pointStyle: z
    .enum(["POINT", "OPEN", "CROSS"])
    .optional()
    .describe("Point drawing style"),
  pointSize: z.number().optional().describe("Point size in pixels"),
  pointOpacity: z.number().min(0).max(1).optional().describe("Point opacity 0-1"),
  fill: z.boolean().optional().describe("Whether to fill the area under the curve"),
  fillOpacity: z.number().min(0).max(1).optional().describe("Fill opacity 0-1"),
  label: z.string().optional().describe("Label text shown on the expression"),
  showLabel: z.boolean().optional().describe("Whether to display the label"),
  dragMode: z
    .enum(["NONE", "X", "Y", "XY", "AUTO"])
    .optional()
    .describe("Drag constraint mode for points"),
  domain: z
    .object({
      min: z.string().optional().describe("Domain min as LaTeX, e.g. '0'"),
      max: z.string().optional().describe("Domain max as LaTeX, e.g. '2\\\\pi'"),
    })
    .optional()
    .describe("Restrict the domain of the expression"),
});

const updateExpressionSchema = expressionPropsSchema.partial().extend({
  id: z.string().describe("ID of the expression to update"),
});

export const desmosTools = {
  addExpression: tool({
    description:
      "Add a mathematical expression, equation, inequality, point, slider, or parametric curve to the Desmos graph. Use Desmos LaTeX syntax.",
    inputSchema: expressionPropsSchema,
    execute: async (params) => ({
      action: "addExpression" as const,
      ...params,
    }),
  }),

  removeExpression: tool({
    description: "Remove an expression from the Desmos graph by its ID.",
    inputSchema: z.object({
      id: z.string().describe("ID of the expression to remove"),
    }),
    execute: async (params) => ({
      action: "removeExpression" as const,
      ...params,
    }),
  }),

  updateExpression: tool({
    description:
      "Update properties of an existing expression (latex, color, visibility, style, etc.). Only include the properties you want to change.",
    inputSchema: updateExpressionSchema,
    execute: async (params) => ({
      action: "updateExpression" as const,
      ...params,
    }),
  }),

  setExpressions: tool({
    description:
      "Replace ALL expressions on the graph. Use this for bulk operations like setting up a complex scene from scratch. Clears existing expressions first.",
    inputSchema: z.object({
      expressions: z
        .array(expressionPropsSchema)
        .describe("Complete list of expressions to set on the graph"),
    }),
    execute: async (params) => ({
      action: "setExpressions" as const,
      ...params,
    }),
  }),

  clearGraph: tool({
    description:
      "Clear all expressions from the graph, resetting it to a blank state.",
    inputSchema: z.object({}),
    execute: async () => ({
      action: "clearGraph" as const,
    }),
  }),

  setViewport: tool({
    description:
      "Set the visible coordinate range of the graph (zoom/pan). All values are in math coordinates.",
    inputSchema: z.object({
      left: z.number().describe("Left bound of the viewport, e.g. -10"),
      right: z.number().describe("Right bound of the viewport, e.g. 10"),
      bottom: z.number().describe("Bottom bound of the viewport, e.g. -10"),
      top: z.number().describe("Top bound of the viewport, e.g. 10"),
    }),
    execute: async (params) => ({
      action: "setViewport" as const,
      ...params,
    }),
  }),

  updateSettings: tool({
    description:
      "Update calculator settings like degree mode, grid visibility, axis labels, and polar mode.",
    inputSchema: z.object({
      degreeMode: z
        .boolean()
        .optional()
        .describe("true for degrees, false for radians"),
      showGrid: z.boolean().optional().describe("Show/hide the background grid"),
      showXAxis: z.boolean().optional().describe("Show/hide the x-axis"),
      showYAxis: z.boolean().optional().describe("Show/hide the y-axis"),
      xAxisLabel: z.string().optional().describe("Label for the x-axis"),
      yAxisLabel: z.string().optional().describe("Label for the y-axis"),
      polarMode: z.boolean().optional().describe("Enable/disable polar grid"),
      lockViewport: z
        .boolean()
        .optional()
        .describe("Lock the viewport so the user cannot pan/zoom"),
      squareAxes: z
        .boolean()
        .optional()
        .describe("Force equal scaling on both axes"),
    }),
    execute: async (params) => ({
      action: "updateSettings" as const,
      ...params,
    }),
  }),

  addTable: tool({
    description:
      "Add a data table to the graph. Each column has a LaTeX header and numeric values.",
    inputSchema: z.object({
      id: z.string().describe("Unique ID for this table expression"),
      columns: z
        .array(
          z.object({
            latex: z
              .string()
              .describe("Column header as LaTeX variable, e.g. 'x_1', 'y_1'"),
            values: z
              .array(z.union([z.number(), z.string()]))
              .describe("Column values"),
            color: z.string().optional().describe("Hex color for this column"),
          })
        )
        .min(1)
        .describe("Table columns (at least one)"),
    }),
    execute: async (params) => ({
      action: "addTable" as const,
      ...params,
    }),
  }),

  addFolder: tool({
    description:
      "Add an organizational folder to group expressions in the expression list.",
    inputSchema: z.object({
      id: z.string().describe("Unique folder ID"),
      title: z.string().describe("Folder title displayed in the list"),
      collapsed: z
        .boolean()
        .optional()
        .describe("Whether the folder starts collapsed"),
    }),
    execute: async (params) => ({
      action: "addFolder" as const,
      ...params,
    }),
  }),

  addNote: tool({
    description:
      "Add a text note to the expression list. Useful for explanations or labels visible in the sidebar.",
    inputSchema: z.object({
      id: z.string().describe("Unique note ID"),
      text: z.string().describe("Note text content"),
    }),
    execute: async (params) => ({
      action: "addNote" as const,
      ...params,
    }),
  }),
};

export type DesmosToolAction =
  | { action: "addExpression"; id: string; latex: string; [key: string]: unknown }
  | { action: "removeExpression"; id: string }
  | { action: "updateExpression"; id: string; [key: string]: unknown }
  | { action: "setExpressions"; expressions: Array<{ id: string; latex: string; [key: string]: unknown }> }
  | { action: "clearGraph" }
  | { action: "setViewport"; left: number; right: number; bottom: number; top: number }
  | { action: "updateSettings"; [key: string]: unknown }
  | { action: "addTable"; id: string; columns: Array<{ latex: string; values: (number | string)[]; color?: string }> }
  | { action: "addFolder"; id: string; title: string; collapsed?: boolean }
  | { action: "addNote"; id: string; text: string };
