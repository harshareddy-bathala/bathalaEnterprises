"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/modal";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase-client";
import { getAdminUser } from "@/lib/admin-auth";
import AdminLayout, { AdminCard, ErrorAlert, LoadingState, EmptyState } from "@/components/admin/admin-layout";

type MessageStatus = "new" | "in-progress" | "resolved";
type MessageQueryType = "properties" | "services" | "other";
type StatusFilter = "all" | MessageStatus;
type QueryTypeFilter = "all" | "properties" | "services";

type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  query_type: MessageQueryType;
  service_type: string | null;
  message: string;
  status: MessageStatus;
  is_read: boolean;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const STATUS_STYLES: Record<MessageStatus, { label: string; badgeClassName: string; dotClassName: string }> = {
  new: {
    label: "New",
    badgeClassName: "bg-[#eff6ff] text-[#2563eb]",
    dotClassName: "bg-[#3b82f6]",
  },
  "in-progress": {
    label: "In Progress",
    badgeClassName: "bg-[#fff7ed] text-[#c2410c]",
    dotClassName: "bg-[#f97316]",
  },
  resolved: {
    label: "Resolved",
    badgeClassName: "bg-[#ecfdf3] text-[#059669]",
    dotClassName: "bg-[#10b981]",
  },
};

function normalizeStatus(value: unknown): MessageStatus {
  if (value === "new" || value === "in-progress" || value === "resolved") {
    return value;
  }

  return "new";
}

function normalizeQueryType(value: unknown): MessageQueryType {
  if (value === "properties" || value === "services") {
    return value;
  }

  return "other";
}

function mapMessage(row: Record<string, unknown>): AdminMessage {
  return {
    id: String(row.id),
    name: typeof row.name === "string" ? row.name : "Unknown",
    email: typeof row.email === "string" ? row.email : "",
    phone: typeof row.phone === "string" ? row.phone : null,
    query_type: normalizeQueryType(row.query_type),
    service_type: typeof row.service_type === "string" ? row.service_type : null,
    message: typeof row.message === "string" ? row.message : "",
    status: normalizeStatus(row.status),
    is_read: Boolean(row.is_read),
    admin_notes: typeof row.admin_notes === "string" ? row.admin_notes : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "AD";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function buildReplyMailto(message: AdminMessage): string {
  const queryLabel = message.query_type === "services" ? "Service" : "Property";
  const subject = encodeURIComponent(`Re: Your ${queryLabel} Inquiry - Bathala Enterprises`);
  const body = encodeURIComponent(
    `Hi ${message.name},\n\nThank you for contacting Bathala Enterprises.\n\nReference ID: ${message.id}\n\n` +
      `Regards,\nBathala Enterprises Team`
  );
  return `mailto:${message.email}?subject=${subject}&body=${body}`;
}

function sortByCreatedAtDesc(a: AdminMessage, b: AdminMessage): number {
  const aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
  const bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
  return bValue - aValue;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [queryTypeFilter, setQueryTypeFilter] = useState<QueryTypeFilter>("all");
  const [searchValue, setSearchValue] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [deletingMessage, setDeletingMessage] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const unreadCount = useMemo(() => messages.filter((item) => !item.is_read).length, [messages]);

  const selectedMessage = useMemo(
    () => messages.find((item) => item.id === selectedMessageId) ?? null,
    [messages, selectedMessageId]
  );

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return messages.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (queryTypeFilter !== "all" && item.query_type !== queryTypeFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [messages, queryTypeFilter, searchValue, statusFilter]);

  const fetchMessages = async () => {
    if (!supabase) {
      return;
    }

    const { data, error } = await supabase
      .from("messages")
      .select(
        "id, name, email, phone, query_type, service_type, message, status, is_read, admin_notes, created_at, updated_at"
      )
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("relation") || message.includes("does not exist") || message.includes("schema cache")) {
        setPageError("The messages table is not available yet. Run SUPABASE_UNIVERSAL_SETUP.sql and reload.");
        setMessages([]);
        return;
      }

      throw error;
    }

    const nextRows = (data || []).map(mapMessage).sort(sortByCreatedAtDesc);
    setMessages(nextRows);
  };

  useEffect(() => {
    const initialize = async () => {
      if (!supabase) {
        router.push("/admin/login");
        return;
      }

      try {
        const adminUser = await getAdminUser();
        if (!adminUser) {
          router.push("/admin/login");
          return;
        }

        const nextAdminName =
          adminUser.user_metadata?.full_name ||
          adminUser.user_metadata?.name ||
          adminUser.email?.split("@")[0] ||
          "Admin";

        setAdminName(nextAdminName);
        setIsAuthenticated(true);

        await fetchMessages();
      } catch (error) {
        console.error("Failed to initialize messages page:", error);
        setPageError("Could not load messages right now.");
      } finally {
        setLoading(false);
      }
    };

    void initialize();
  }, [router]);

  useEffect(() => {
    if (!selectedMessage) {
      setNotesDraft("");
      return;
    }

    setNotesDraft(selectedMessage.admin_notes || "");
  }, [selectedMessage]);

  useEffect(() => {
    if (filteredMessages.length === 0) {
      setSelectedMessageId(null);
      return;
    }

    const stillVisible = selectedMessageId && filteredMessages.some((item) => item.id === selectedMessageId);
    if (!stillVisible) {
      setSelectedMessageId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedMessageId]);

  useEffect(() => {
    const client = supabase;
    if (!client || !isAuthenticated) {
      return;
    }

    const channel = client
      .channel("admin-messages-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            if (!payload.old || typeof payload.old !== "object" || !("id" in payload.old)) {
              return;
            }

            const previous = mapMessage(payload.old);
            setMessages((current) => current.filter((item) => item.id !== previous.id));
            return;
          }

          if (!payload.new || typeof payload.new !== "object") {
            return;
          }

          const nextMessage = mapMessage(payload.new);
          setMessages((current) => {
            const remaining = current.filter((item) => item.id !== nextMessage.id);
            return [...remaining, nextMessage].sort(sortByCreatedAtDesc);
          });
        }
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [isAuthenticated]);

  const markAsRead = async (message: AdminMessage) => {
    if (!supabase || message.is_read) {
      return;
    }

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("id", message.id);

    if (error) {
      console.error("Failed to mark message as read:", error);
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? {
              ...item,
              is_read: true,
            }
          : item
      )
    );
  };

  const handleSelectMessage = async (message: AdminMessage) => {
    setSelectedMessageId(message.id);
    setActionStatus(null);
    await markAsRead(message);
  };

  const handleStatusUpdate = async (status: MessageStatus) => {
    if (!supabase || !selectedMessage) {
      return;
    }

    setUpdatingStatus(true);
    setActionStatus(null);

    const { error } = await supabase
      .from("messages")
      .update({ status })
      .eq("id", selectedMessage.id);

    setUpdatingStatus(false);

    if (error) {
      console.error("Failed to update message status:", error);
      setActionStatus("Could not update status right now.");
      return;
    }

    setMessages((current) =>
      current.map((item) => (item.id === selectedMessage.id ? { ...item, status } : item))
    );
    setActionStatus("Status updated.");
  };

  const handleSaveNotes = async () => {
    if (!supabase || !selectedMessage) {
      return;
    }

    setSavingNotes(true);
    setActionStatus(null);

    const value = notesDraft.trim();
    const { error } = await supabase
      .from("messages")
      .update({ admin_notes: value.length > 0 ? value : null })
      .eq("id", selectedMessage.id);

    setSavingNotes(false);

    if (error) {
      console.error("Failed to save admin notes:", error);
      setActionStatus("Could not save notes right now.");
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === selectedMessage.id
          ? {
              ...item,
              admin_notes: value.length > 0 ? value : null,
            }
          : item
      )
    );

    setActionStatus("Notes saved.");
  };

  const handleOpenDeleteDialog = () => {
    if (!selectedMessage || deletingMessage) {
      return;
    }

    setShowDeleteDialog(true);
    setActionStatus(null);
  };

  const handleCloseDeleteDialog = () => {
    if (deletingMessage) {
      return;
    }

    setShowDeleteDialog(false);
  };

  const handleDeleteSelectedMessage = async () => {
    if (!supabase || !selectedMessage) {
      return;
    }

    const messageId = selectedMessage.id;
    setDeletingMessage(true);
    setActionStatus(null);

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId);

    setDeletingMessage(false);

    if (error) {
      console.error("Failed to delete message:", error);
      setActionStatus("Could not delete message right now.");
      return;
    }

    setMessages((current) => current.filter((item) => item.id !== messageId));
    setSelectedMessageId((current) => (current === messageId ? null : current));
    setShowDeleteDialog(false);
    setActionStatus("Message deleted.");
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }

    router.push("/admin/login");
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AdminLayout
      title="Customer Messages"
      description="Track and respond to all website enquiries in one place"
      adminName={adminName}
      action={
        <div className="inline-flex items-center gap-2 rounded-full bg-[#f1ede6] px-3 py-1.5 text-xs font-semibold text-[#7c6442]">
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">mark_email_unread</span>
          {unreadCount} unread
        </div>
      }
    >
      {loading ? (
        <LoadingState message="Loading messages..." />
      ) : pageError ? (
        <ErrorAlert message={pageError} />
      ) : (
        <>
          {/* Filters */}
          <AdminCard className="mb-5 border-none bg-transparent p-0 shadow-none">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <input
                  id="search_messages"
                  type="text"
                  placeholder=" "
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#fcfbf9] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                />
                <label htmlFor="search_messages" className="pointer-events-none absolute left-4 top-[14px] -translate-y-1/2 bg-transparent text-sm text-[#8b97a9] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:text-sm peer-focus:top-[12px] peer-focus:text-[11px] peer-focus:text-[#b89a5e] peer-focus:font-semibold peer-[&:not(:placeholder-shown)]:top-[12px] peer-[&:not(:placeholder-shown)]:text-[11px] peer-[&:not(:placeholder-shown)]:font-semibold">
                  Search Messages
                </label>
              </div>

              <div className="relative">
                <select
                  id="status_filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                  className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#fcfbf9] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                >
                  <option value="all">All statuses</option>
                  <option value="new">New</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <label htmlFor="status_filter" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[11px] font-semibold text-[#8b97a9] transition-all">
                  Status
                </label>
              </div>

              <div className="relative">
                <select
                  id="query_type_filter"
                  value={queryTypeFilter}
                  onChange={(event) => setQueryTypeFilter(event.target.value as QueryTypeFilter)}
                  className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#fcfbf9] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e]"
                >
                  <option value="all">All types</option>
                  <option value="properties">Properties</option>
                  <option value="services">Services</option>
                </select>
                <label htmlFor="query_type_filter" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[11px] font-semibold text-[#8b97a9] transition-all">
                  Query Type
                </label>
              </div>
            </div>
          </AdminCard>

          {/* Message Queue and Details */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:h-[75vh]">
            {/* Message List */}
            <AdminCard className="overflow-hidden p-0 flex flex-col h-full bg-[#fcfbf9] border-[#e8e4dc]">
              <div className="border-b border-[#e8e4dc] bg-white px-4 py-3 flex-shrink-0">
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#8b97a9]">
                  Inbox ({filteredMessages.length})
                </h2>
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredMessages.length === 0 ? (
                  <div className="px-4 py-10 text-center text-sm text-[#8b97a9]">
                    No messages match the current filters.
                  </div>
                ) : (
                  filteredMessages.map((item) => {
                    const statusStyle = STATUS_STYLES[item.status];
                    const isActive = selectedMessageId === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSelectMessage(item)}
                        className={cn(
                          "w-full border-b border-[#f1eee7] px-4 py-4 text-left transition",
                          isActive ? "bg-[#fefcf8]" : "hover:bg-[#fcfbf8]"
                        )}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                item.is_read ? "bg-[#d1d5db]" : "bg-[#ef4444]"
                              )}
                              aria-hidden
                            />
                            <p className="text-sm font-semibold text-[#1a1f2e]">{item.name}</p>
                          </div>
                          <span className="text-xs text-[#9ca3af]">{formatDateTime(item.created_at)}</span>
                        </div>

                        <p className="text-xs text-[#6b7280]">{item.email}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-[#9ca3af]">{item.message}</p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-[3px] text-[11px] font-semibold",
                              statusStyle.badgeClassName
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyle.dotClassName)} />
                            {statusStyle.label}
                          </span>
                          <span className="rounded-full bg-[#f3f4f6] px-2 py-[3px] text-[11px] font-semibold text-[#4b5563]">
                            {item.query_type === "services" ? "Services" : item.query_type === "properties" ? "Properties" : "Other"}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </AdminCard>

            {/* Message Detail */}
            <AdminCard className="h-full flex flex-col bg-white border-[#e8e4dc]">
              {!selectedMessage ? (
                <div className="flex h-full min-h-[420px] items-center justify-center rounded-xl border border-dashed border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#8b97a9]">
                  Select a message to view details.
                </div>
              ) : (
                <div className="flex flex-col h-full space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e8e4dc] pb-5">
                    <div className="flex items-center gap-4">
                      <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-[#f4f1eb] text-lg font-bold text-[#b89a5e]">
                        {getInitials(selectedMessage.name)}
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[#1a1f2e]">{selectedMessage.name}</p>
                        <p className="text-sm font-medium text-[#6b7280]">{selectedMessage.email}</p>
                        <p className="mt-1 text-xs text-[#8b97a9]">Received {formatDateTime(selectedMessage.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={buildReplyMailto(selectedMessage)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#e8e4dc] bg-[#faf9f6] px-4 py-2 text-sm font-semibold text-[#1a1f2e] transition hover:border-[#b89a5e] hover:bg-white hover:text-[#b89a5e] shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[18px]" aria-hidden="true">reply</span>
                        Reply via Email
                      </a>

                      <Button
                        type="button"
                        onClick={handleOpenDeleteDialog}
                        variant="secondary"
                        className="h-[38px] rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 text-sm font-semibold text-[#b91c1c] hover:bg-[#fee2e2]"
                        disabled={deletingMessage}
                      >
                        <span className="material-symbols-outlined text-[16px]" aria-hidden="true">delete</span>
                        {deletingMessage ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 shrink-0">
                    <div className="relative rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b97a9]">Phone Contact</p>
                      <p className="mt-1 text-[15px] font-medium text-[#1a1f2e]">{selectedMessage.phone || "Not provided"}</p>
                    </div>
                    <div className="relative rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8b97a9]">Related Interest</p>
                      <p className="mt-1 text-[15px] font-medium text-[#1a1f2e]">{selectedMessage.service_type || "General inquiry"}</p>
                    </div>
                  </div>

                  <div className="relative flex-1 rounded-xl border border-[#e8e4dc] bg-white p-5 shadow-sm">
                    <p className="absolute -top-3 left-4 bg-white px-1 text-[10px] font-bold uppercase tracking-wider text-[#8b97a9]">Message Body</p>
                    <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-[#4b5563]">
                      {selectedMessage.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 shrink-0 sm:flex-row">
                    <div className="relative flex-1">
                      <select
                        id="message-status"
                        value={selectedMessage.status}
                        onChange={(event) => void handleStatusUpdate(event.target.value as MessageStatus)}
                        disabled={updatingStatus}
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm font-semibold text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        <option value="new">Status: New</option>
                        <option value="in-progress">Status: In Progress</option>
                        <option value="resolved">Status: Resolved</option>
                      </select>
                      <label htmlFor="message-status" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all">
                        Update Status
                      </label>
                      {updatingStatus ? (
                        <span className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#8b97a9]">...</span>
                      ) : null}
                    </div>

                    <div className="relative flex-[2]">
                      <textarea
                        id="admin-notes"
                        value={notesDraft}
                        onChange={(event) => setNotesDraft(event.target.value)}
                        placeholder="Save private context or next steps here..."
                        className="peer pt-5 px-4 h-14 w-full rounded-xl border border-[#e8e4dc] bg-[#faf9f6] text-sm text-[#1a1f2e] outline-none transition focus:border-[#b89a5e] focus:ring-1 focus:ring-[#b89a5e] resize-none"
                      />
                      <label htmlFor="admin-notes" className="pointer-events-none absolute left-4 top-[12px] -translate-y-1/2 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[#8b97a9] transition-all">
                        Admin Notes
                      </label>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        {actionStatus ? <span className="text-[10px] font-bold text-[#b89a5e]">{actionStatus}</span> : null}
                        <Button
                          type="button"
                          onClick={() => void handleSaveNotes()}
                          size="sm"
                          className="h-10 rounded-lg"
                          disabled={savingNotes}
                        >
                          {savingNotes ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </AdminCard>
          </div>

          <Modal
            isOpen={showDeleteDialog}
            onClose={handleCloseDeleteDialog}
            size="sm"
            title="Delete Message"
            description="This action permanently removes the selected inquiry from your inbox."
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCloseDeleteDialog}
                  disabled={deletingMessage}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleDeleteSelectedMessage()}
                  disabled={deletingMessage}
                  className="bg-[#ef4444] text-white hover:bg-[#dc2626]"
                >
                  {deletingMessage ? "Deleting..." : "Delete Permanently"}
                </Button>
              </div>
            }
          >
            {selectedMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4">
                  <p className="text-sm font-semibold text-[#1a1f2e]">{selectedMessage.name}</p>
                  <p className="mt-1 text-xs text-[#6b7280]">{selectedMessage.email}</p>
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#4b5563]">
                    {selectedMessage.message}
                  </p>
                </div>
                <p className="text-xs text-[#8b97a9]">
                  Deleted messages cannot be recovered.
                </p>
              </div>
            ) : null}
          </Modal>
        </>
      )}
    </AdminLayout>
  );
}
