import type { CSSProperties } from "react";
import {
  LayoutGrid,
  Box,
  Terminal,
  KeyRound,
  ChartNoAxesColumnIncreasing,
  Settings,
  BookOpen,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Bell,
  Check,
  Copy,
  X,
  Clock3,
  Zap,
  Download,
  Menu,
  ShieldCheck,
  Trash2,
  Code2,
} from "lucide-react";

export type IconName = keyof typeof icons;
const icons = {
  grid: LayoutGrid,
  cube: Box,
  terminal: Terminal,
  key: KeyRound,
  chart: ChartNoAxesColumnIncreasing,
  settings: Settings,
  book: BookOpen,
  arrow: ArrowRight,
  external: ExternalLink,
  chevron: ChevronRight,
  down: ChevronDown,
  plus: Plus,
  search: Search,
  bell: Bell,
  check: Check,
  copy: Copy,
  close: X,
  clock: Clock3,
  bolt: Zap,
  download: Download,
  menu: Menu,
  shield: ShieldCheck,
  trash: Trash2,
  code: Code2,
};
export function Icon({
  name,
  size = 18,
  style,
}: {
  name: IconName;
  size?: number;
  style?: CSSProperties;
}) {
  const Component = icons[name];
  return (
    <Component
      size={size}
      strokeWidth={1.65}
      aria-hidden="true"
      style={style}
    />
  );
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-symbol" aria-hidden="true">
        <Zap size={21} fill="currentColor" strokeWidth={1} />
      </span>
      {!compact && (
        <span>
          inference<span className="brand-period">.</span>
        </span>
      )}
    </span>
  );
}
