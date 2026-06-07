"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";

function DashboardContent() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const searchParams = useSearchParams();
  const highlightJob = searchParams.get("job");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`);
        if (res.ok) {
          const data = await res.json();
          setJobs(Array.isArray(data) ? data : []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!highlightJob) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${highlightJob}`);
        if (res.ok) {
          const data = await res.json();
          setJobStatus(data);
          if (data.status === "completed" || data.status === "failed") clearInterval(interval);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [highlightJob]);

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><h1 className="text-2xl font-bold">Dashboard</h1><p className="text-muted-foreground mt-4">Loading...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <Card className="p-4 mb-6 flex items-center justify-between">
        <span className="font-semibold">Projects: {jobs.length}</span>
        <a href="/pricing" className="inline-flex items-center justify-center rounded-md text-sm font-medium border px-3 py-1.5 hover:bg-muted">Buy Credits</a>
      </Card>
      {highlightJob && jobStatus && (
        <div className="mb-6">
          <h2 className="font-semibold mb-3">Current Job</h2>
          <Card className="p-4">
            <span className="font-medium capitalize">{jobStatus.status || "processing"}</span>
            {jobStatus.output_url && (
              <img src={jobStatus.output_url} alt="Result" className="mt-3 rounded-lg max-h-64" />
            )}
          </Card>
        </div>
      )}
      <h2 className="font-semibold mb-3">Recent Projects</h2>
      <div className="grid gap-4">
        {jobs.map((job: any) => (
          <Card key={job.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium capitalize">{job.media_type || "photo"} - {job.status}</p>
              <p className="text-sm text-muted-foreground">{job.created_at ? new Date(job.created_at).toLocaleDateString() : "—"}</p>
            </div>
            {job.output_url && (
              <img src={job.output_url} alt="Result" className="w-20 h-20 object-cover rounded" />
            )}
          </Card>
        ))}
        {jobs.length === 0 && !loading && (
          <p className="text-muted-foreground">No projects yet. <a href="/upload" className="underline">Start one!</a></p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
