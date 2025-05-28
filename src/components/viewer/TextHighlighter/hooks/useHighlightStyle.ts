interface UseHighlightStyleProps {
  isSelected: boolean;
  hasSummary: boolean;
}

interface HighlightStyle {
  className: string;
  hasBottomBorder: boolean;
}

export function useHighlightStyle({ isSelected, hasSummary }: UseHighlightStyleProps): HighlightStyle {
  const baseClasses = 'absolute group';
  const backgroundClasses = isSelected
    ? hasSummary
      ? 'bg-green-300/50 ring-2 ring-green-400'
      : 'bg-yellow-300/50 ring-2 ring-yellow-400'
    : hasSummary
      ? 'bg-green-200/50 hover:bg-green-300/50'
      : 'bg-yellow-100/50 hover:bg-yellow-200/50';

  return {
    className: `${baseClasses} ${backgroundClasses}`,
    hasBottomBorder: hasSummary,
  };
}
