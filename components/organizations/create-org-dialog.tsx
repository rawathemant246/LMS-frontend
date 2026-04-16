"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function CreateOrgDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/api/v1/orgs", { organization_name: name });
      toast.success("Organization created successfully");
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setOpen(false);
      setName("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create organization";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => setOpen(o)}>
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4 mr-2" /> Add School
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">School Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Delhi Public School" required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
