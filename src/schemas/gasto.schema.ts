import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const gastoBaseSchema = z.object({
  periodo_id: z.number().int().positive(),
  categoria_id: z.number().int().positive(),
  descripcion: z.string().trim().min(1).max(255),
  monto: z.number().positive(),
  fecha: z.string().regex(fechaRegex, 'La fecha debe tener formato YYYY-MM-DD'),
  nota: z.string().trim().max(1000).nullable().optional(),
});

export const createGastoSchema = gastoBaseSchema;

export const putGastoSchema = gastoBaseSchema;

export const patchGastoSchema = gastoBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type CreateGastoInput = z.infer<typeof createGastoSchema>;
export type PutGastoInput = z.infer<typeof putGastoSchema>;
export type PatchGastoInput = z.infer<typeof patchGastoSchema>;
