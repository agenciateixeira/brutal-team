const BRL_FORMATTER = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export const formatCentsToBRL = (valueInCents: number | null | undefined) =>
  BRL_FORMATTER.format((valueInCents ?? 0) / 100);

export const formatToBRL = (value: number | null | undefined) =>
  BRL_FORMATTER.format(value ?? 0);
