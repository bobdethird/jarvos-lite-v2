import { streamObject } from "ai";
import { z } from "zod";
import { desmosPrompt, updateDocumentPrompt } from "@/lib/ai/prompts";
import { getArtifactModel } from "@/lib/ai/providers";
import { createDocumentHandler } from "@/lib/artifacts/server";

const desmosExpressionSchema = z.object({
  expressions: z.array(
    z.object({
      id: z.string().describe("Unique expression ID, e.g. 'expr1'"),
      latex: z.string().describe("LaTeX expression, e.g. 'y=x^2'"),
      color: z
        .string()
        .optional()
        .describe("Hex color, e.g. '#c74440'"),
      hidden: z.boolean().optional().describe("Whether to hide the graph"),
    })
  ),
  settings: z
    .object({
      degreeMode: z.boolean().optional(),
    })
    .optional(),
});

export const desmosDocumentHandler = createDocumentHandler<"desmos">({
  kind: "desmos",
  onCreateDocument: async ({ title, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: getArtifactModel(),
      system: desmosPrompt,
      prompt: title,
      schema: desmosExpressionSchema,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;

        if (object) {
          const serialized = JSON.stringify(object);

          dataStream.write({
            type: "data-desmosDelta",
            data: serialized,
            transient: true,
          });

          draftContent = serialized;
        }
      }
    }

    if (!draftContent) {
      draftContent = JSON.stringify({ expressions: [], settings: {} });
    }

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = "";

    const { fullStream } = streamObject({
      model: getArtifactModel(),
      system: updateDocumentPrompt(document.content, "desmos"),
      prompt: description,
      schema: desmosExpressionSchema,
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === "object") {
        const { object } = delta;

        if (object) {
          const serialized = JSON.stringify(object);

          dataStream.write({
            type: "data-desmosDelta",
            data: serialized,
            transient: true,
          });

          draftContent = serialized;
        }
      }
    }

    if (!draftContent) {
      draftContent = document.content ?? JSON.stringify({ expressions: [], settings: {} });
    }

    return draftContent;
  },
});
