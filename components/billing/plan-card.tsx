import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";

interface PlanCardProps {
  name: string;
  price: number;
  billingCycle: string;
  maxUsers?: number;
  supportLevel?: string;
}

export function PlanCard({ name, price, billingCycle, maxUsers, supportLevel }: PlanCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {name}
          <Badge variant="outline">{billingCycle}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold text-brand-primary">{formatCurrency(price)}</p>
        <p className="text-sm text-gray-500 mt-1">per {billingCycle}</p>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          {maxUsers && <p>Up to {maxUsers} users</p>}
          {supportLevel && <p>{supportLevel} support</p>}
        </div>
      </CardContent>
    </Card>
  );
}
