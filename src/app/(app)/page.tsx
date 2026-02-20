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
  Crosshair,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";

interface Stats {
  totalCards: number;
  dueCards: number;
  weakCount: number;
  reviewedToday: number;
  totalVocab: number;
  totalVerbs: number;
}

export default function DashboardPage() {
  const { activeLanguage, languages } = useLanguage();
  const [stats, setStats] = useState<Stats | null>(null);

  const langName =
    languages.find((l) => l.code === activeLanguage)?.name || activeLanguage;

  useEffect(() => {
    fetch(`/api/flashcards/stats?lang=${activeLanguage}`)
      .then((res) => res.json())
      .then(setStats);
  }, [activeLanguage]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Learning {langName}</p>
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
            <CardTitle className="text-sm font-medium">Weak Cards</CardTitle>
            <Crosshair className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.weakCount ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">need extra practice</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        {(stats?.totalCards ?? 0) > 0 && (
          <Link href="/flashcards/review">
            <Button size="lg">
              <GraduationCap className="h-4 w-4 mr-2" />
              Start Review
              {(stats?.dueCards ?? 0) > 0 && ` (${stats?.dueCards} due)`}
            </Button>
          </Link>
        )}
        {(stats?.weakCount ?? 0) > 0 && (
          <Link href="/flashcards/review">
            <Button variant="outline" size="lg">
              <Crosshair className="h-4 w-4 mr-2" />
              Drill Weakest ({stats?.weakCount})
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
