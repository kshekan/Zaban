import { Languages } from "lucide-react";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-2">
          <Languages className="h-10 w-10 text-primary" />
          <h1 className="text-2xl font-semibold">Zaban</h1>
          <p className="text-sm text-muted-foreground">
            AI-powered language learning
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
