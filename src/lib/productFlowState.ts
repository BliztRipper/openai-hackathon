export type ProductStage = 'landing' | 'personas' | 'companion' | 'architecture' | 'dashboard';

export const productStages: ProductStage[] = ['landing', 'personas', 'companion', 'architecture', 'dashboard'];

export const stageLabels: Record<ProductStage, string> = {
  landing: 'Overview',
  personas: 'Choose support',
  companion: 'Get help',
  architecture: 'Memory map',
  dashboard: 'Care review',
};

export function nextStage(stage: ProductStage): ProductStage {
  const index = productStages.indexOf(stage);
  return productStages[Math.min(index + 1, productStages.length - 1)];
}

export function previousStage(stage: ProductStage): ProductStage {
  const index = productStages.indexOf(stage);
  return productStages[Math.max(index - 1, 0)];
}
