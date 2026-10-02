"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { authErrorMessage } from "@/lib/auth";
import { DocumentUploader } from "@/components/upload/DocumentUploader";
import { AttachmentSearch } from "@/components/workspace/AttachmentSearch";
import { Spinner } from "@/components/ui/primitives";

type Workspace = { id: string; name: string };

export function WorkspaceDocuments({ workspaceId }: { workspaceId: string }) {
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
    // The same frame as the rest of the design's pages: a 1441px page with
    // 140px gutters at the size it was drawn at.
    <div className="mx-auto w-full max-w-[1441px] px-5 pb-16 pt-[69px] sm:px-10 xl:px-[140px]">
      <DocumentUploader
        workspaceId={workspaceId}
        description={`Files added to ${workspace.name} for use across chats.`}
      />

      {/* Not in the design, and not droppable: finding the line you half
          remember inside a document is the reason to have put it here. */}
      <div className="mt-12 border-t border-hairline pt-8">
        <AttachmentSearch workspaceId={workspaceId} />
      </div>
    </div>
  );
}
