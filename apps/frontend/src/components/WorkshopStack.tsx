import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { STACK } from "@/workshop-config";

type WorkshopStackProps = {
  className?: string;
};

export function WorkshopStack({ className }: WorkshopStackProps) {
  return (
    <ul className={cn("grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6", className)}>
      {STACK.map(({ name, role }) => (
        <li key={name}>
          <Card className="h-full border-white/10 bg-[#161922]/80 shadow-none">
            <CardHeader className="space-y-2 pb-2">
              <CardTitle className="font-mono text-sm font-medium text-primary">{name}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-zinc-400">{role}</CardDescription>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
