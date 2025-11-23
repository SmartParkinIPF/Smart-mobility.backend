export type CreateOpinionDto = {
  establecimiento_id: string;
  rating: number;
  comentario?: string | null;
};

export type UpdateOpinionDto = {
  rating?: number;
  comentario?: string | null;
};
