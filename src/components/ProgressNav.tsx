import { productStages, stageLabels, type ProductStage } from '../lib/productFlowState';

type Props = {
  current: ProductStage;
  onSelect: (stage: ProductStage) => void;
};

export function ProgressNav({ current, onSelect }: Props) {
  const currentIndex = productStages.indexOf(current);
  return (
    <nav className="progress-nav" aria-label="Care flow progress">
      {productStages.map((stage, index) => (
        <button
          key={stage}
          className={`progress-step ${stage === current ? 'active' : ''} ${index < currentIndex ? 'done' : ''}`}
          onClick={() => onSelect(stage)}
          aria-current={stage === current ? 'step' : undefined}
        >
          <span className="step-number">{index + 1}</span>
          <span>{stageLabels[stage]}</span>
        </button>
      ))}
    </nav>
  );
}
