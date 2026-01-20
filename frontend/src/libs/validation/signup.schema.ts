import { z } from "zod";

export const signupSchema = z.object({
    username: z
        .string()
        .min(1, "Username is required")
        .min(3, "Username must be at least 3 characters")
        // Matches Django's UnicodeUsernameValidator: ^[\w.@+-]+$
        // \w = letters, digits, underscore
        // Plus: . @ + -
        .regex(/^[\w.@+-]+$/, "Username can only contain letters, numbers, and @/./+/-/_ characters")
        .refine(
            (val) => !val.includes(' '),
            "Username cannot contain spaces"
        ),

    email: z
        .string()
        .min(1, "Email is required")
        .email("Invalid email address"),

    password: z
        .string()
        .min(1, "Password is required")
        .min(8, "Use 8 or more characters"),

    re_password: z
        .string()
        .min(1, "Confirm password is required"),

    institute: z
        .string()
        .optional()
        .nullable(),

    professional_email: z
        .string()
        .email("Invalid professional email")
        .optional()
        .or(z.literal("")),
})
    .superRefine(({ password, re_password, username }, ctx) => {
        if (password !== re_password) {
            ctx.addIssue({
                path: ["re_password"],
                message: "Passwords do not match",
                code: z.ZodIssueCode.custom,
            });
        }

        // if (password.toLowerCase().includes(username.toLowerCase())) {
        //     ctx.addIssue({
        //         path: ["password"],
        //         message: "Password should not contain username",
        //         code: z.ZodIssueCode.custom,
        //     });
        // }
    });