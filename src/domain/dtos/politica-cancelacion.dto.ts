export type CreatePoliticaCancelacionDto = {
  descripcion_corta?: string | null;
  reglas_json: unknown; // JSONB requerido
};

export type UpdatePoliticaCancelacionDto = Partial<CreatePoliticaCancelacionDto>;

