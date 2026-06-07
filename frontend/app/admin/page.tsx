"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Stats {
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  totalRevenue: number;
  recentJobs: any[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`);
        if (res.ok) setStats(await res.json());
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Jobs</p>
          <p className="text-3xl font-bold">{stats?.totalJobs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600">{stats?.completedJobs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Failed</p>
          <p className="text-3xl font-bold text-red-600">{stats?.failedJobs ?? 0}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Est. Revenue</p>
          <p className="text-3xl font-bold text-primary">${stats?.totalRevenue ?? 0}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Jobs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2">ID</th>
                <th className="pb-2">User</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Credits</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentJobs?.map((job: any) => (
                <tr key={job.id} className="border-b last:border-0">
                  <td className="py-2 text-xs font-mono">{job.id?.slice(0, 8)}</td>
                  <td className="py-2 text-xs">{job.user_id?.slice(0, 8)}</td>
                  <td className="py-2 capitalize">{job.media_type}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      job.status === "completed" ? "bg-green-100 text-green-800" :
                      job.status === "failed" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{job.status}</span>
                  </td>
                  <td className="py-2 text-xs">{job.created_at ? new Date(job.created_at).toLocaleDateString() : "\u2014"}</td>
                  <td className="py-2">{job.credit_cost}</td>
                </tr>
              ))}
              {(!stats?.recentJobs || stats.recentJobs.length === 0) && (
                <tr><td colSpan={6} className="py-4 text-center text-muted-foreground">No jobs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
