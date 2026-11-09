'use client';
import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
export function ModuleTabs({
  tabs,
  initial,
}: {
  tabs: { id: string; title: string; content: ReactNode }[];
  initial?: string;
}) {
  if (!tabs.length) return null;
  return (
    <Tabs className="group-tabs" defaultValue={initial ?? tabs[0].id}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger value={tab.id} key={tab.id}>
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent value={tab.id} key={tab.id}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
