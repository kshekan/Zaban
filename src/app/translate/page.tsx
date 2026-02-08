"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReferenceMode } from "./reference/reference-mode";
import { PracticeMode } from "./practice/practice-mode";

export default function TranslatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Translation</h1>
      <Tabs defaultValue="reference">
        <TabsList>
          <TabsTrigger value="reference">Reference</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
        </TabsList>
        <TabsContent value="reference">
          <ReferenceMode />
        </TabsContent>
        <TabsContent value="practice">
          <PracticeMode />
        </TabsContent>
      </Tabs>
    </div>
  );
}
