import {
  Brain,
  Dumbbell,
  Home,
  Layers,
  type LucideIcon,
  PawPrint,
  Scale,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  barbearia: Scissors,
  salao_estetica: Sparkles,
  odontologia: Smile,
  medico: Stethoscope,
  veterinario: PawPrint,
  advocacia: Scale,
  imobiliaria: Home,
  academia: Dumbbell,
  psicologia: Brain,
};

export function resolveVerticalIcon(id: string): LucideIcon {
  return ICONS[id] ?? Layers;
}
