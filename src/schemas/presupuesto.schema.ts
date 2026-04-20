import { z } from 'zod';

export const createPresupuestoSchema = z.object({
  periodo_id: z.number().int().positive(),
  categoria_id: z.number().int().positive(),
  monto_limite: z.number().positive(),
});

export const patchPresupuestoSchema = z.object({
  monto_limite: z.number().positive(),
});

export type CreatePresupuestoInput = z.infer<typeof createPresupuestoSchema>;
export type PatchPresupuestoInput = z.infer<typeof patchPresupuestoSchema>;
