import z from "zod";

export const instituteApplicationSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),
})
    .superRefine(({ email }, ctx) => {
        if (!email) {
            ctx.addIssue({
                path: ["email"],
                code: z.ZodIssueCode.custom,
                message: "Email is required",
            });
        }
    })
