import { z } from 'zod';

const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;

export const ingresoBaseSchema = z.object({
  periodo_id: z.number().int().positive(),
  descripcion: z.string().trim().min(1).max(255),
  monto: z.number().int().positive(),
  fecha: z.string().regex(fechaRegex, 'La fecha debe tener formato YYYY-MM-DD'),
  nota: z.string().trim().max(1000).nullable().optional(),
});

export const createIngresoSchema = ingresoBaseSchema;

export const putIngresoSchema = ingresoBaseSchema;

export const patchIngresoSchema = ingresoBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Debes enviar al menos un campo para actualizar.',
  });

export type CreateIngresoInput = z.infer<typeof createIngresoSchema>;
export type PutIngresoInput = z.infer<typeof putIngresoSchema>;
export type PatchIngresoInput = z.infer<typeof patchIngresoSchema>;
