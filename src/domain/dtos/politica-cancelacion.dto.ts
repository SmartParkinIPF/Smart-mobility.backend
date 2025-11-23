export type CreatePoliticaCancelacionDto = {
  descripcion_corta?: string | null;
  reglas_json: unknown; // JSONB requerido
  created_by?: string | null;
};

export type UpdatePoliticaCancelacionDto =
  Partial<CreatePoliticaCancelacionDto>;
