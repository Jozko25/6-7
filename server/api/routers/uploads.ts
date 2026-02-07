import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getUploadUrl } from "@/server/services/s3.service";

export const uploadsRouter = createTRPCRouter({
  // Get pre-signed URL for image upload
  getUploadUrl: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { uploadUrl, fileUrl } = await getUploadUrl(
        input.fileName,
        input.contentType
      );

      return {
        uploadUrl,
        fileUrl,
      };
    }),
});
