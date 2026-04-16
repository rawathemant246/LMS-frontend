import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

interface TicketCardProps {
  ticket: any;
  onClick?: () => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-4">
        <p className="font-medium text-sm text-gray-900 line-clamp-2">{ticket.subject}</p>
        <div className="flex items-center justify-between mt-3">
          <Badge className={priorityColors[ticket.priority] || "bg-gray-100"} variant="outline">
            {ticket.priority}
          </Badge>
          <span className="text-xs text-gray-400">{formatRelativeTime(ticket.created_at)}</span>
        </div>
        {ticket.organization_name && (
          <p className="text-xs text-gray-500 mt-2">{ticket.organization_name}</p>
        )}
      </CardContent>
    </Card>
  );
}
