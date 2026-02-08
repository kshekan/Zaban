"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Languages,
  GraduationCap,
  TrendingUp,
} from "lucide-react";

interface Stats {
  totalCards: number;
  dueCards: number;
  reviewedToday: number;
  totalVocab: number;
  totalVerbs: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/flashcards/stats")
      .then((res) => res.json())
      .then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to Zaban. Your language learning overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Vocabulary
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalVocab ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">words added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verbs</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalVerbs ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              conjugation tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Today</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.dueCards ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">cards to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reviewed Today
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.reviewedToday ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">reviews completed</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {(stats?.dueCards ?? 0) > 0 && (
          <Link href="/flashcards/review">
            <Button size="lg">
              <GraduationCap className="h-4 w-4 mr-2" />
              Start Review ({stats?.dueCards} cards)
            </Button>
          </Link>
        )}
        <Link href="/vocab">
          <Button variant="outline" size="lg">
            <BookOpen className="h-4 w-4 mr-2" />
            Add Vocabulary
          </Button>
        </Link>
      </div>
    </div>
  );
}
