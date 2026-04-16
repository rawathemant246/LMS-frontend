"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus } from "lucide-react";
import { useParents, useCreateParent } from "@/hooks/use-parents";

// ── Create Parent Dialog ───────────────────────────────────────────────────────

function CreateParentDialog() {
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");

  const mutation = useCreateParent();

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhoneNumber("");
    setOccupation("");
    setPreferredLanguage("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
    };
    if (email) payload.email = email;
    if (occupation) payload.occupation = occupation;
    if (preferredLanguage) payload.preferred_language = preferredLanguage;

    mutation.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" />
        Add Parent
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Parent</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="p-first-name">First Name</Label>
              <Input
                id="p-first-name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rajesh"
                required
              />
            </div>
            <div>
              <Label htmlFor="p-last-name">Last Name</Label>
              <Input
                id="p-last-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Kumar"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="p-phone">Phone Number</Label>
            <Input
              id="p-phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 98765 43210"
              required
            />
          </div>
          <div>
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rajesh.kumar@email.com"
            />
          </div>
          <div>
            <Label htmlFor="p-occupation">Occupation</Label>
            <Input
              id="p-occupation"
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
              placeholder="Engineer"
            />
          </div>
          <div>
            <Label>Preferred Language</Label>
            <Select
              value={preferredLanguage}
              onValueChange={(val) => setPreferredLanguage(val ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Add Parent"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Parents Page ───────────────────────────────────────────────────────────────

export default function ParentsPage() {
  const [search, setSearch] = useState("");
  const { data: parentsData, isLoading } = useParents();

  const parents: any[] = Array.isArray(parentsData)
    ? parentsData
    : (parentsData as any)?.items ?? (parentsData as any)?.parents ?? [];

  const filtered = parents.filter((p) => {
    const fullName = `${p.first_name ?? ""} ${p.last_name ?? ""}`.toLowerCase();
    return fullName.includes(search.toLowerCase());
  });

  return (
    <div>
      <PageHeader title="Parents" description="Manage parent and guardian contacts">
        <CreateParentDialog />
      </PageHeader>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search parents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Children</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                  No parents found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((parent: any) => {
                const id = String(parent.parent_id ?? parent.id);
                const fullName =
                  [parent.first_name, parent.last_name].filter(Boolean).join(" ") || "—";
                const childrenCount =
                  parent.children_count ?? parent.children?.length ?? null;
                return (
                  <TableRow key={id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{fullName}</TableCell>
                    <TableCell className="text-gray-500">
                      {parent.phone_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {parent.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {parent.whatsapp_number ?? parent.phone_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {childrenCount != null ? childrenCount : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
