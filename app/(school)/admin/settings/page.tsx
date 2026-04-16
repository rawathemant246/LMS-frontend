"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Palette,
  GraduationCap,
  Upload,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useSchoolProfile,
  useCurrentAcademicYear,
  useUpdateSchoolProfile,
} from "@/hooks/use-school";
import { useSchoolStore } from "@/lib/school-store";

// ── Animation variants ────────────────────────────────────────────────────────

const tabFade = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.12 } },
};

// ── School Profile Tab ────────────────────────────────────────────────────────

function SchoolProfileTab() {
  const { data: profile, isLoading } = useSchoolProfile();
  const mutation = useUpdateSchoolProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    school_name: "",
    board: "",
    affiliation_number: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    logo_url: "",
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        school_name: profile.school_name ?? profile.name ?? "",
        board: profile.board ?? "",
        affiliation_number: profile.affiliation_number ?? "",
        address: profile.address ?? "",
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: profile.website ?? "",
        logo_url: profile.logo_url ?? "",
      });
    }
  }, [profile]);

  const updateField = (field: string, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      updateField("logo_url", url);
    }
  };

  const handleSave = () => {
    mutation.mutate(profileForm);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
          {profileForm.logo_url ? (
            <img
              src={profileForm.logo_url}
              alt="School logo"
              className="h-full w-full object-cover"
            />
          ) : (
            <Upload className="h-8 w-8 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700">School Logo</p>
          <p className="text-xs text-gray-500 mb-2">PNG, JPG up to 2MB</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Logo
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Form fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="school_name">School Name</Label>
          <Input
            id="school_name"
            value={profileForm.school_name}
            onChange={(e) => updateField("school_name", e.target.value)}
            placeholder="Enter school name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="board">Board</Label>
          <Select
            value={profileForm.board}
            onValueChange={(val) => updateField("board", val ?? "")}
          >
            <SelectTrigger id="board" className="w-full">
              <SelectValue placeholder="Select board" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CBSE">CBSE</SelectItem>
              <SelectItem value="ICSE">ICSE</SelectItem>
              <SelectItem value="State Board">State Board</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="affiliation_number">Affiliation Number</Label>
          <Input
            id="affiliation_number"
            value={profileForm.affiliation_number}
            onChange={(e) => updateField("affiliation_number", e.target.value)}
            placeholder="e.g. 2130123"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={profileForm.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+91 98765 43210"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profileForm.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="admin@school.edu.in"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            value={profileForm.website}
            onChange={(e) => updateField("website", e.target.value)}
            placeholder="https://school.edu.in"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            rows={3}
            value={profileForm.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Full school address"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Branding Tab ──────────────────────────────────────────────────────────────

function BrandingTab() {
  const { data: profile } = useSchoolProfile();
  const mutation = useUpdateSchoolProfile();

  const [branding, setBranding] = useState({
    primary_color: "#4F46E5",
    accent_color: "#F97316",
    sidebar_color: "#1E1B4B",
  });

  useEffect(() => {
    if (profile?.branding) {
      setBranding({
        primary_color: profile.branding.primary_color ?? "#4F46E5",
        accent_color: profile.branding.accent_color ?? "#F97316",
        sidebar_color: profile.branding.sidebar_color ?? "#1E1B4B",
      });
    }
  }, [profile]);

  const updateColor = (key: keyof typeof branding, value: string) => {
    setBranding((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setBranding({
      primary_color: "#4F46E5",
      accent_color: "#F97316",
      sidebar_color: "#1E1B4B",
    });
  };

  const handleSave = () => {
    mutation.mutate(
      { branding },
      {
        onSuccess: () => {
          useSchoolStore.getState().setSchool({
            ...(profile ?? { name: "", board: "", logo_url: "" }),
            name: profile?.school_name ?? profile?.name ?? "",
            board: profile?.board ?? "",
            logo_url: profile?.logo_url ?? "",
            branding: {
              primary_color: branding.primary_color,
              accent_color: branding.accent_color,
              sidebar_color: branding.sidebar_color,
            },
          });
        },
      }
    );
  };

  const colorFields: { key: keyof typeof branding; label: string }[] = [
    { key: "primary_color", label: "Primary Color" },
    { key: "accent_color", label: "Accent Color" },
    { key: "sidebar_color", label: "Sidebar Color" },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Color pickers */}
        <div className="space-y-6">
          {colorFields.map(({ key, label }) => (
            <div key={key} className="space-y-2">
              <Label className="text-sm font-medium">{label}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={branding[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer p-0.5"
                />
                <Input
                  value={branding[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  className="w-32 font-mono text-sm"
                  maxLength={7}
                />
                <span className="text-xs text-gray-500">Current: {branding[key]}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live preview panel */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Live Preview</Label>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="flex h-[200px]">
                {/* Mini sidebar */}
                <div
                  className="w-16 h-full transition-colors duration-300"
                  style={{ backgroundColor: branding.sidebar_color }}
                >
                  <div className="flex flex-col items-center gap-3 pt-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-2 w-8 rounded-full opacity-40"
                        style={{ backgroundColor: "#ffffff" }}
                      />
                    ))}
                  </div>
                </div>
                {/* Main area */}
                <div className="flex-1 flex flex-col">
                  {/* Mini header */}
                  <div
                    className="h-10 w-full transition-colors duration-300 flex items-center px-3"
                    style={{ backgroundColor: branding.primary_color }}
                  >
                    <div className="h-2.5 w-20 rounded-full bg-white/40" />
                  </div>
                  {/* Content area */}
                  <div className="flex-1 bg-gray-50 p-4 flex flex-col gap-3">
                    <div className="h-2 w-3/4 rounded bg-gray-200" />
                    <div className="h-2 w-1/2 rounded bg-gray-200" />
                    <div className="mt-auto">
                      <div
                        className="h-7 w-20 rounded-md transition-colors duration-300 flex items-center justify-center"
                        style={{ backgroundColor: branding.accent_color }}
                      >
                        <span className="text-[10px] text-white font-medium">Button</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save Branding"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Academic Config Tab ───────────────────────────────────────────────────────

function AcademicConfigTab() {
  const { data: year, isLoading: yearLoading } = useCurrentAcademicYear();
  const { data: profile } = useSchoolProfile();
  const mutation = useUpdateSchoolProfile();

  const [config, setConfig] = useState({
    min_attendance_pct: 75,
    internal_weightage: 20,
    external_weightage: 80,
  });

  useEffect(() => {
    if (profile?.config) {
      setConfig({
        min_attendance_pct: profile.config.min_attendance_pct ?? 75,
        internal_weightage: profile.config.internal_weightage ?? 20,
        external_weightage: profile.config.external_weightage ?? 80,
      });
    }
  }, [profile]);

  const weightageError =
    config.internal_weightage + config.external_weightage !== 100
      ? "Internal + External weightage must equal 100%"
      : null;

  const updateConfig = (key: keyof typeof config, value: number) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (weightageError) return;
    mutation.mutate({ config });
  };

  return (
    <div className="space-y-8">
      {/* Current academic year */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Current Academic Year</p>
              {yearLoading ? (
                <Skeleton className="h-6 w-32 mt-1" />
              ) : (
                <p className="text-lg font-semibold mt-1">
                  {year?.label ?? year?.name ?? "Not configured"}
                </p>
              )}
            </div>
            <Link href="/admin/academic">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Manage Academic Years
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Grading system link */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Grading System</p>
              <p className="text-sm mt-1">Configure grade scales and grading policies</p>
            </div>
            <Link href="/admin/gradebook">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Grade Scales
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Editable config */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="min_attendance">Minimum Attendance %</Label>
          <Input
            id="min_attendance"
            type="number"
            min={0}
            max={100}
            value={config.min_attendance_pct}
            onChange={(e) => updateConfig("min_attendance_pct", Number(e.target.value))}
          />
          <p className="text-xs text-gray-500">
            Students below this will be flagged
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="internal_weightage">Internal Assessment Weightage %</Label>
          <Input
            id="internal_weightage"
            type="number"
            min={0}
            max={100}
            value={config.internal_weightage}
            onChange={(e) => updateConfig("internal_weightage", Number(e.target.value))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="external_weightage">External Exam Weightage %</Label>
          <Input
            id="external_weightage"
            type="number"
            min={0}
            max={100}
            value={config.external_weightage}
            onChange={(e) => updateConfig("external_weightage", Number(e.target.value))}
          />
        </div>
      </div>

      {weightageError && (
        <p className="text-sm text-red-600 font-medium">{weightageError}</p>
      )}

      <div className="flex justify-end">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            onClick={handleSave}
            disabled={mutation.isPending || !!weightageError}
          >
            {mutation.isPending ? "Saving..." : "Save Config"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage school profile, branding, and academic configuration"
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <Settings className="h-4 w-4 mr-2" />
            School Profile
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="academic">
            <GraduationCap className="h-4 w-4 mr-2" />
            Academic Config
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="profile">
            <motion.div
              key="profile-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <SchoolProfileTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="branding">
            <motion.div
              key="branding-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <BrandingTab />
            </motion.div>
          </TabsContent>

          <TabsContent value="academic">
            <motion.div
              key="academic-tab"
              variants={tabFade}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <AcademicConfigTab />
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}
