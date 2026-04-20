export interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  color: string;
}

export interface Periodo {
  id: number;
  mes: number;
  anio: number;
  dinero_inicial: number;
  tipo_cambio_usd: number | null;
  creado_en: string;
}

export interface Gasto {
  id: number;
  periodo_id: number;
  categoria_id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  nota: string | null;
  creado_en: string;
  modificado_en: string | null;
}

export interface Ahorro {
  id: number;
  periodo_id: number;
  descripcion: string;
  monto: number;
  moneda: 'ARS' | 'USD';
  origen: string | null;
  fecha: string;
  nota: string | null;
  creado_en: string;
}

export interface Presupuesto {
  id: number;
  periodo_id: number;
  categoria_id: number;
  monto_limite: number;
}

export interface GastoPorCategoria {
  categoria_id: number;
  nombre: string;
  total: number;
  porcentaje: number;
}

export interface PresupuestoEstado {
  categoria_id: number;
  limite: number;
  gastado: number;
  porcentaje_usado: number;
}

export interface ResumenPeriodo {
  periodo: Periodo;
  total_gastado: number;
  total_ahorrado_ars: number;
  total_ahorrado_usd: number;
  saldo_disponible: number;
  porcentaje_ahorro: number;
  gastos_por_categoria: GastoPorCategoria[];
  presupuestos_estado: PresupuestoEstado[];
}

export interface ComparativaItem {
  id: number;
  mes: number;
  anio: number;
  total_gastado: number;
  total_ahorrado_ars: number;
}

export interface ComparativaResumen {
  periodo_actual: ComparativaItem;
  periodo_anterior: ComparativaItem;
  variacion_gastos_pct: number;
  variacion_ahorros_pct: number;
}
