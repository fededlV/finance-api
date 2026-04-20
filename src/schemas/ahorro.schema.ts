import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ahorroBaseSchema = z.object({
  periodo_id: z.number().int().positive(),
  descripcion: z.string().trim().min(1).max(255),
  monto: z.number().positive(),
  moneda: z.enum(['ARS', 'USD']),
  origen: z.string().trim().max(255).nullable().optional(),
  fecha: z.string().regex(fechaRegex, 'La fecha debe tener formato YYYY-MM-DD'),
  nota: z.string().trim().max(1000).nullable().optional(),
});

export const createAhorroSchema = ahorroBaseSchema;

export const patchAhorroSchema = ahorroBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type CreateAhorroInput = z.infer<typeof createAhorroSchema>;
export type PatchAhorroInput = z.infer<typeof patchAhorroSchema>;
