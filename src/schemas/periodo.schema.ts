import { z } from 'zod';

export const createPeriodoSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(1900).max(3000),
  dinero_inicial: z.number().min(0),
  tipo_cambio_usd: z.number().positive().nullable().optional(),
});

export const patchPeriodoSchema = z
  .object({
    dinero_inicial: z.number().min(0).optional(),
    tipo_cambio_usd: z.number().positive().nullable().optional(),
  })
  .refine((value) => value.dinero_inicial !== undefined || value.tipo_cambio_usd !== undefined, {
    message: 'Debes enviar dinero_inicial y/o tipo_cambio_usd.',
  });

export type CreatePeriodoInput = z.infer<typeof createPeriodoSchema>;
export type PatchPeriodoInput = z.infer<typeof patchPeriodoSchema>;
