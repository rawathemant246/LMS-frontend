"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface TicketDetailProps {
  ticket: any | null;
  open: boolean;
  onClose: () => void;
}

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
};

export function TicketDetail({ ticket, open, onClose }: TicketDetailProps) {
  if (!ticket) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent className="w-[500px] sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle className="text-left">{ticket.subject}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-6 px-4">
          <div className="flex items-center gap-3">
            <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            <Badge className={statusColors[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
          </div>

          {ticket.organization_name && (
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">School</p>
              <p className="text-sm">{ticket.organization_name}</p>
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 uppercase font-medium">Description</p>
            <p className="text-sm text-gray-700 mt-1">{ticket.description}</p>
          </div>

          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-medium">Created</p>
              <p className="text-sm">{formatDate(ticket.created_at)}</p>
            </div>
            {ticket.first_name && (
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">Raised By</p>
                <p className="text-sm">{ticket.first_name} {ticket.last_name}</p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
