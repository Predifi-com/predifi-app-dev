import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Trash2, 
  Loader2,
  Mail,
  Download,
  Check,
  Clock,
  Trophy,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface WaitlistEntry {
  id: string;
  email: string;
  wallet_address: string | null;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  priority_score: number;
  created_at: string;
  approved_at: string | null;
}

interface WhitelistEntry {
  id: string;
  email: string | null;
  wallet_address: string | null;
  added_by: string | null;
  notes: string | null;
  created_at: string;
}

export function WaitlistAdminTab() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newWallet, setNewWallet] = useState("");
  const [addingToWhitelist, setAddingToWhitelist] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproving, setBulkApproving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [waitlistRes, whitelistRes] = await Promise.all([
        supabase
          .from("waitlist_signups")
          .select("*")
          .order("priority_score", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("platform_whitelist")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      setWaitlist((waitlistRes.data || []) as WaitlistEntry[]);
      setWhitelist((whitelistRes.data || []) as WhitelistEntry[]);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load waitlist data");
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (entry: WaitlistEntry) => {
    setApprovingId(entry.id);
    try {
      // Call edge function to add to whitelist and send email
      const { error } = await supabase.functions.invoke("send-waitlist-approval", {
        body: {
          email: entry.email,
          walletAddress: entry.wallet_address,
        },
      });

      if (error) throw error;

      toast.success(`Approved ${entry.email}`, {
        description: "Approval email sent successfully",
      });
      
      fetchData();
    } catch (error: any) {
      console.error("Error approving user:", error);
      toast.error(error.message || "Failed to approve user");
    } finally {
      setApprovingId(null);
    }
  };

  const bulkApprove = async () => {
    if (selectedIds.size === 0) return;
    
    setBulkApproving(true);
    const entriesToApprove = waitlist.filter(
      entry => selectedIds.has(entry.id) && !entry.approved_at
    );
    
    let successCount = 0;
    let failCount = 0;
    
    for (const entry of entriesToApprove) {
      try {
        const { error } = await supabase.functions.invoke("send-waitlist-approval", {
          body: {
            email: entry.email,
            walletAddress: entry.wallet_address,
          },
        });
        
        if (error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch {
        failCount++;
      }
    }
    
    setBulkApproving(false);
    setSelectedIds(new Set());
    
    if (successCount > 0) {
      toast.success(`Approved ${successCount} user${successCount > 1 ? 's' : ''}`, {
        description: failCount > 0 ? `${failCount} failed` : undefined,
      });
    } else if (failCount > 0) {
      toast.error(`Failed to approve ${failCount} users`);
    }
    
    fetchData();
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    const pendingEntries = filteredWaitlist.filter(e => !e.approved_at);
    if (selectedIds.size === pendingEntries.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingEntries.map(e => e.id)));
    }
  };

  const addToWhitelist = async () => {
    if (!newEmail && !newWallet) {
      toast.error("Please enter an email or wallet address");
      return;
    }

    setAddingToWhitelist(true);
    try {
      const { error } = await supabase.from("platform_whitelist").insert({
        email: newEmail?.toLowerCase() || null,
        wallet_address: newWallet?.toLowerCase() || null,
        added_by: "admin",
      });

      if (error) throw error;

      toast.success("Added to whitelist");
      setNewEmail("");
      setNewWallet("");
      fetchData();
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Already whitelisted");
      } else {
        toast.error(error.message || "Failed to add to whitelist");
      }
    } finally {
      setAddingToWhitelist(false);
    }
  };

  const removeFromWhitelist = async (id: string) => {
    try {
      const { error } = await supabase
        .from("platform_whitelist")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Removed from whitelist");
      setWhitelist(whitelist.filter(w => w.id !== id));
    } catch (error) {
      toast.error("Failed to remove from whitelist");
    }
    setDeleteConfirm(null);
  };

  const exportToCSV = () => {
    setExportingCSV(true);
    try {
      const headers = ["Email", "Wallet", "Referral Code", "Referred By", "Referrals", "Priority", "Signed Up", "Approved"];
      const rows = waitlist.map(entry => [
        entry.email,
        entry.wallet_address || "",
        entry.referral_code,
        entry.referred_by || "",
        entry.referral_count.toString(),
        entry.priority_score.toString(),
        new Date(entry.created_at).toISOString(),
        entry.approved_at ? new Date(entry.approved_at).toISOString() : "",
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `waitlist-${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("CSV exported");
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setExportingCSV(false);
    }
  };

  const filteredWaitlist = waitlist.filter(entry => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.wallet_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.referral_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = waitlist.filter(w => !w.approved_at).length;
  const approvedCount = waitlist.filter(w => w.approved_at).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{waitlist.length}</p>
          <p className="text-xs text-muted-foreground">Total Signups</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{pendingCount}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{approvedCount}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{whitelist.length}</p>
          <p className="text-xs text-muted-foreground">Whitelisted</p>
        </Card>
      </div>

      {/* Add to Whitelist */}
      <Card className="p-5 border border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
          Add to Whitelist Directly
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="email@example.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <Input
            placeholder="0x... (wallet address)"
            value={newWallet}
            onChange={(e) => setNewWallet(e.target.value)}
            className="font-mono"
          />
          <Button onClick={addToWhitelist} disabled={addingToWhitelist}>
            {addingToWhitelist ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add
          </Button>
        </div>
      </Card>

      {/* Waitlist Table */}
      <Card className="p-5 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Waitlist Queue
            </h3>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                onClick={bulkApprove}
                disabled={bulkApproving}
                className="gap-2"
              >
                {bulkApproving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve {selectedIds.size} Selected
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={exportToCSV} disabled={exportingCSV}>
              {exportingCSV ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Export
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    filteredWaitlist.filter(e => !e.approved_at).length > 0 &&
                    selectedIds.size === filteredWaitlist.filter(e => !e.approved_at).length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all pending"
                />
              </TableHead>
              <TableHead className="text-[10px] uppercase">#</TableHead>
              <TableHead className="text-[10px] uppercase">Email</TableHead>
              <TableHead className="text-[10px] uppercase">Wallet</TableHead>
              <TableHead className="text-[10px] uppercase">Referrals</TableHead>
              <TableHead className="text-[10px] uppercase">Priority</TableHead>
              <TableHead className="text-[10px] uppercase">Status</TableHead>
              <TableHead className="text-[10px] uppercase">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredWaitlist.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  No signups yet
                </TableCell>
              </TableRow>
            ) : (
              filteredWaitlist.map((entry, index) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {!entry.approved_at && (
                      <Checkbox
                        checked={selectedIds.has(entry.id)}
                        onCheckedChange={() => toggleSelect(entry.id)}
                        aria-label={`Select ${entry.email}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell className="text-xs">{entry.email}</TableCell>
                  <TableCell>
                    {entry.wallet_address ? (
                      <code className="text-xs text-muted-foreground">
                        {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                      </code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs">{entry.referral_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-warning" />
                      <span className="text-xs font-mono">{entry.priority_score}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {entry.approved_at ? (
                      <Badge variant="outline" className="text-[9px] uppercase text-success border-success/30">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[9px] uppercase text-warning border-warning/30">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {!entry.approved_at && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approveUser(entry)}
                        disabled={approvingId === entry.id}
                      >
                        {approvingId === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-3 h-3 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Whitelist Table */}
      <Card className="p-5 border border-border">
        <h3 className="text-sm font-semibold uppercase tracking-wide mb-4">
          Platform Whitelist
        </h3>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[10px] uppercase">Email</TableHead>
              <TableHead className="text-[10px] uppercase">Wallet</TableHead>
              <TableHead className="text-[10px] uppercase">Added</TableHead>
              <TableHead className="text-[10px] uppercase">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whitelist.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No whitelisted users
                </TableCell>
              </TableRow>
            ) : (
              whitelist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-xs">{entry.email || "—"}</TableCell>
                  <TableCell>
                    {entry.wallet_address ? (
                      <code className="text-xs text-muted-foreground">
                        {entry.wallet_address.slice(0, 6)}...{entry.wallet_address.slice(-4)}
                      </code>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(entry.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Whitelist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This user will need to be re-approved to access the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && removeFromWhitelist(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
