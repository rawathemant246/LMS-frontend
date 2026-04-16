"use client";

import { TicketCard } from "./ticket-card";

interface KanbanProps {
  tickets: any[];
  onTicketClick?: (ticket: any) => void;
}

const columns = [
  { key: "open", label: "Open", color: "border-blue-500" },
  { key: "in_progress", label: "In Progress", color: "border-yellow-500" },
  { key: "resolved", label: "Resolved", color: "border-green-500" },
  { key: "closed", label: "Closed", color: "border-gray-400" },
];

export function TicketKanban({ tickets, onTicketClick }: KanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {columns.map((col) => {
        const colTickets = tickets.filter((t) => t.status === col.key);
        return (
          <div key={col.key} className={`bg-gray-50 rounded-xl p-4 border-t-4 ${col.color}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-gray-700">{col.label}</h3>
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                {colTickets.length}
              </span>
            </div>
            <div className="space-y-3">
              {colTickets.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">No tickets</p>
              ) : (
                colTickets.map((ticket) => (
                  <TicketCard
                    key={ticket.ticket_id}
                    ticket={ticket}
                    onClick={() => onTicketClick?.(ticket)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
