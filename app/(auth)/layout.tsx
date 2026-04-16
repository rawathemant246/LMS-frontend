export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1E1B4B] to-[#4F46E5]">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
