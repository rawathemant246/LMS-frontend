"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { TicketKanban } from "@/components/support/ticket-kanban";
import { TicketDetail } from "@/components/support/ticket-detail";
import { useTickets } from "@/hooks/use-support";
import { Skeleton } from "@/components/ui/skeleton";

export default function SupportPage() {
  const { data, isLoading } = useTickets();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  return (
    <div>
      <PageHeader title="Support Tickets" description="Manage support requests from schools" />

      {isLoading ? (
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : (
        <TicketKanban
          tickets={data?.items || []}
          onTicketClick={(ticket) => setSelectedTicket(ticket)}
        />
      )}

      <TicketDetail
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />
    </div>
  );
}
