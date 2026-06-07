"use client";

import { useEffect, useState } from "react";
import { Job } from "@/types";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props { jobId: string }

export default function ProcessingStatus({ jobId }: Props) {
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs/${jobId}`);
      const data = await res.json();
      setJob(data);
      if (data.status === "completed" || data.status === "failed") clearInterval(interval);
    }, 3000);
    return () => clearInterval(interval);
  }, [jobId]);

  if (!job) return <Loader2 className="animate-spin" />;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        {job.status === "processing" && <Loader2 className="animate-spin text-primary" />}
        {job.status === "completed" && <CheckCircle className="text-green-500" />}
        {job.status === "failed" && <XCircle className="text-red-500" />}
        <span className="font-medium capitalize">{job.status}</span>
      </div>
      {job.outputUrl && job.status === "completed" && (
        <img src={job.outputUrl} alt="Result" className="mt-3 rounded-lg max-h-64" />
      )}
    </Card>
  );
}
