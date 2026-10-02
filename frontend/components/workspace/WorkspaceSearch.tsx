"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { authErrorMessage } from "@/lib/auth";
import { HistorySearch } from "@/components/workspace/HistorySearch";
import { Spinner } from "@/components/ui/primitives";

type Workspace = { id: string; name: string };

export function WorkspaceSearch({ workspaceId }: { workspaceId: string }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<Workspace>(`/workspaces/${workspaceId}`)
      .then((w) => {
        if (!cancelled) setWorkspace(w);
      })
      .catch((err) => {
        if (!cancelled) setError(authErrorMessage(err));
      });
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="rounded-lg border border-band-low-border bg-band-low-bg px-3 py-2 text-sm text-band-low">
          {error}
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="text-ink-muted" />
      </div>
    );
  }

  return (
    // No page title here: the design gives this screen the search box and
    // its results and nothing else, and the breadcrumb above already says
    // which workspace is being searched.
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[106px] sm:px-10">
      <HistorySearch workspaceId={workspaceId} />
    </div>
  );
}
