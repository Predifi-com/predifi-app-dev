import { useState, useEffect, useCallback, useRef } from "react";
import { ArenaLayout } from "@/components/arena/ArenaLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Shield, 
  Users, 
  Settings, 
  Plus, 
  Trash2, 
  Lock, 
  Unlock,
  Loader2,
  AlertTriangle,
  FileText,
  Bell,
  Download,
  Mail,
  LogIn,
  UserPlus,
  LogOut,
  Key,
  Clock
} from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

interface Competition {
  id: string;
  competition_number: number;
  is_finale: boolean;
  status: string;
  is_whitelist_only: boolean;
  registration_start: string | null;
  registration_end: string | null;
}

interface WhitelistEntry {
  id: string;
  competition_id: string;
  wallet_address: string;
  added_at: string;
  added_by: string | null;
}

interface Registration {
  id: string;
  wallet_address: string;
  arena_wallet_address: string | null;
  deposit_amount: number;
  status: string;
  admission_type: string;
  registered_at: string;
}

interface AdminLog {
  id: string;
  action: string;
  target_type: string;
  details: any;
  created_at: string;
}

interface NotificationSignup {
  id: string;
  email: string;
  wallet_address: string | null;
  created_at: string;
  notified_at: string | null;
  unsubscribed_at: string | null;
}

export default function ArenaAdmin() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<string>("");
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [notificationSignups, setNotificationSignups] = useState<NotificationSignup[]>([]);
  const [newAddress, setNewAddress] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [exportingCSV, setExportingCSV] = useState(false);
  
  // Auth form state
  const [authMode, setAuthMode] = useState<"login" | "signup" | "reset" | "update-password">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  // Session timeout (30 minutes)
  const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
  const lastActivityRef = useRef<number>(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Bulk notification state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("🎯 Registration is NOW OPEN for Predifi Arena Season 0!");
  const [bulkType, setBulkType] = useState<"registration_open" | "reminder" | "custom">("registration_open");
  const [bulkCustomMessage, setBulkCustomMessage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);

  // Handle session timeout
  const handleSessionTimeout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast.warning("Session expired due to inactivity. Please log in again.");
  }, []);

  const resetActivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Set up session timeout tracking
  useEffect(() => {
    if (!user || !isAdmin) return;

    const checkTimeout = () => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        handleSessionTimeout();
      }
    };

    // Check every minute
    timeoutRef.current = setInterval(checkTimeout, 60 * 1000);

    // Track user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetActivityTimer));

    return () => {
      if (timeoutRef.current) clearInterval(timeoutRef.current);
      events.forEach(event => window.removeEventListener(event, resetActivityTimer));
    };
  }, [user, isAdmin, handleSessionTimeout, resetActivityTimer]);

  // Set up auth state listener and check session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle password recovery event
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode("update-password");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check admin status when user changes
  useEffect(() => {
    async function checkAdmin() {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        setIsAdmin(!!roles);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkAdmin();
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    setAuthLoading(true);
    try {
      if (authMode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/arena/admin`
          }
        });
        if (error) throw error;
        toast.success("Signed up successfully! You can now login.");
        setAuthMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Logged in successfully!");
      }
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    toast.success("Logged out");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/arena/admin`
      });
      if (error) throw error;
      toast.success("Password reset email sent! Check your inbox.");
      setAuthMode("login");
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setAuthMode("login");
    } catch (error: any) {
      console.error("Password update error:", error);
      toast.error(error.message || "Failed to update password");
    } finally {
      setAuthLoading(false);
    }
  };

  // Fetch competitions
  useEffect(() => {
    async function fetchCompetitions() {
      const { data } = await supabase
        .from('arena_competitions')
        .select('*')
        .order('competition_number', { ascending: true });
      setCompetitions((data || []) as Competition[]);
      if (data && data.length > 0 && !selectedCompetition) {
        setSelectedCompetition(data[0].id);
      }
    }
    if (isAdmin) {
      fetchCompetitions();
    }
  }, [isAdmin]);

  // Fetch whitelist for selected competition
  useEffect(() => {
    async function fetchWhitelist() {
      if (!selectedCompetition) return;
      const { data } = await supabase
        .from('arena_whitelist')
        .select('*')
        .eq('competition_id', selectedCompetition)
        .order('added_at', { ascending: false });
      setWhitelist((data || []) as WhitelistEntry[]);
    }
    if (isAdmin && selectedCompetition) {
      fetchWhitelist();
    }
  }, [isAdmin, selectedCompetition]);

  // Fetch registrations for selected competition
  useEffect(() => {
    async function fetchRegistrations() {
      if (!selectedCompetition) return;
      const { data } = await supabase
        .from('arena_registrations')
        .select('*')
        .eq('competition_id', selectedCompetition)
        .order('registered_at', { ascending: false });
      setRegistrations((data || []) as Registration[]);
    }
    if (isAdmin && selectedCompetition) {
      fetchRegistrations();
    }
  }, [isAdmin, selectedCompetition]);

  // Fetch admin logs
  useEffect(() => {
    async function fetchLogs() {
      const { data } = await supabase
        .from('arena_admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      setLogs((data || []) as AdminLog[]);
    }
    if (isAdmin) {
      fetchLogs();
    }
  }, [isAdmin]);

  // Fetch notification signups
  useEffect(() => {
    async function fetchNotificationSignups() {
      const { data } = await supabase
        .from('arena_notification_signups')
        .select('*')
        .order('created_at', { ascending: false });
      setNotificationSignups((data || []) as NotificationSignup[]);
    }
    if (isAdmin) {
      fetchNotificationSignups();
    }
  }, [isAdmin]);

  const addToWhitelist = async () => {
    if (!newAddress || !selectedCompetition) return;
    
    // Validate address format
    if (!newAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      toast.error('Invalid wallet address format');
      return;
    }

    setAddingAddress(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('arena_whitelist')
        .insert({
          competition_id: selectedCompetition,
          wallet_address: newAddress.toLowerCase(),
          added_by: user?.id || null,
        });

      if (error) throw error;

      // Log the action
      await supabase.from('arena_admin_logs').insert({
        admin_user_id: user?.id,
        action: 'ADD_WHITELIST',
        target_type: 'arena_whitelist',
        details: { 
          wallet_address: newAddress.toLowerCase(), 
          competition_id: selectedCompetition 
        },
      });

      toast.success('Address added to whitelist');
      setNewAddress('');
      
      // Refresh whitelist
      const { data } = await supabase
        .from('arena_whitelist')
        .select('*')
        .eq('competition_id', selectedCompetition)
        .order('added_at', { ascending: false });
      setWhitelist((data || []) as WhitelistEntry[]);
    } catch (error: any) {
      console.error('Error adding to whitelist:', error);
      if (error.code === '23505') {
        toast.error('Address already whitelisted');
      } else {
        toast.error('Failed to add address');
      }
    } finally {
      setAddingAddress(false);
    }
  };

  const removeFromWhitelist = async (id: string, address: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('arena_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log the action
      await supabase.from('arena_admin_logs').insert({
        admin_user_id: user?.id,
        action: 'REMOVE_WHITELIST',
        target_type: 'arena_whitelist',
        details: { wallet_address: address, competition_id: selectedCompetition },
      });

      toast.success('Address removed from whitelist');
      setWhitelist(whitelist.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error removing from whitelist:', error);
      toast.error('Failed to remove address');
    }
    setDeleteConfirm(null);
  };

  const updateCompetitionStatus = async (compId: string, newStatus: 'UPCOMING' | 'REGISTERING' | 'LIVE' | 'FINALIZED') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('arena_competitions')
        .update({ status: newStatus as any })
        .eq('id', compId);

      if (error) throw error;

      // Log the action
      await supabase.from('arena_admin_logs').insert({
        admin_user_id: user?.id,
        action: 'UPDATE_COMPETITION_STATUS',
        target_type: 'arena_competitions',
        target_id: compId,
        details: { new_status: newStatus },
      });

      toast.success(`Competition status updated to ${newStatus}`);
      
      // Refresh competitions
      const { data } = await supabase
        .from('arena_competitions')
        .select('*')
        .order('competition_number', { ascending: true });
      setCompetitions((data || []) as Competition[]);
    } catch (error) {
      console.error('Error updating competition:', error);
      toast.error('Failed to update competition');
    }
  };

  const maskAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const exportSignupsToCSV = () => {
    setExportingCSV(true);
    try {
      const headers = ['Email', 'Wallet Address', 'Signed Up', 'Notified', 'Unsubscribed'];
      const rows = notificationSignups.map(signup => [
        signup.email,
        signup.wallet_address || '',
        new Date(signup.created_at).toISOString(),
        signup.notified_at ? new Date(signup.notified_at).toISOString() : '',
        signup.unsubscribed_at ? new Date(signup.unsubscribed_at).toISOString() : ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `arena-notification-signups-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setExportingCSV(false);
    }
  };

  const sendBulkNotification = async () => {
    if (!bulkSubject.trim()) {
      toast.error('Subject is required');
      return;
    }

    const activeCount = notificationSignups.filter(s => !s.unsubscribed_at).length;
    if (activeCount === 0) {
      toast.error('No active subscribers to notify');
      return;
    }

    setSendingBulk(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-arena-bulk-notification", {
        body: {
          subject: bulkSubject,
          notificationType: bulkType,
          customMessage: bulkType === "custom" ? bulkCustomMessage : undefined,
        },
      });

      if (error) throw error;

      toast.success(`Sent to ${data.sent} subscribers${data.failed > 0 ? `, ${data.failed} failed` : ''}`);
      setShowBulkModal(false);
      
      // Refresh signups to show updated notified_at
      const { data: refreshedSignups } = await supabase
        .from('arena_notification_signups')
        .select('*')
        .order('created_at', { ascending: false });
      setNotificationSignups((refreshedSignups || []) as NotificationSignup[]);
    } catch (error: any) {
      console.error('Bulk notification error:', error);
      toast.error(error.message || 'Failed to send notifications');
    } finally {
      setSendingBulk(false);
    }
  };

  if (loading) {
    return (
      <ArenaLayout title="Arena Admin | Predifi" description="Arena administration">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </ArenaLayout>
    );
  }

  // Show password update form if in recovery mode
  if (authMode === "update-password") {
    return (
      <ArenaLayout title="Update Password | Predifi" description="Update your password">
        <Card className="p-8 border border-border max-w-md mx-auto">
          <div className="text-center mb-6">
            <Key className="w-8 h-8 text-primary mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-foreground mb-2">Update Password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <Input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={authLoading}>
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              Update Password
            </Button>
          </form>
        </Card>
      </ArenaLayout>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return (
      <ArenaLayout title="Arena Admin | Predifi" description="Arena administration">
        <Card className="p-8 border border-border max-w-md mx-auto">
          <div className="text-center mb-6">
            <Shield className="w-8 h-8 text-primary mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-foreground mb-2">
              {authMode === "reset" ? "Reset Password" : "Arena Admin Login"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {authMode === "reset" 
                ? "Enter your email to receive a password reset link."
                : "Sign in or create an account to access administration."}
            </p>
          </div>
          
          {authMode === "reset" ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={authLoading}>
                {authLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Send Reset Link
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode("login")}
                  className="text-sm text-primary hover:underline"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={authLoading}>
                  {authLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : authMode === "login" ? (
                    <LogIn className="w-4 h-4 mr-2" />
                  ) : (
                    <UserPlus className="w-4 h-4 mr-2" />
                  )}
                  {authMode === "login" ? "Sign In" : "Sign Up"}
                </Button>
              </form>
              
              <div className="mt-4 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => setAuthMode(authMode === "login" ? "signup" : "login")}
                  className="text-sm text-primary hover:underline block w-full"
                >
                  {authMode === "login" ? "Need an account? Sign up" : "Already have an account? Sign in"}
                </button>
                {authMode === "login" && (
                  <button
                    type="button"
                    onClick={() => setAuthMode("reset")}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </ArenaLayout>
    );
  }

  // Show access denied if logged in but not admin
  if (!isAdmin) {
    return (
      <ArenaLayout title="Arena Admin | Predifi" description="Arena administration">
        <Card className="p-8 border border-destructive/30 max-w-md mx-auto">
          <div className="text-center">
            <Shield className="w-8 h-8 text-destructive mx-auto mb-4" />
            <h1 className="text-lg font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-sm text-muted-foreground mb-2">
              You do not have admin permission.
            </p>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              Your User ID: {user.id}
            </p>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </Card>
      </ArenaLayout>
    );
  }

  const selectedComp = competitions.find(c => c.id === selectedCompetition);

  return (
    <ArenaLayout title="Arena Admin | Predifi" description="Arena administration">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-warning" />
          <h1 className="text-xl font-semibold text-foreground">Arena Administration</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage competitions, whitelists, and competitor access.
        </p>
      </div>

      {/* Competition Selector */}
      <Card className="p-4 mb-6 border border-border">
        <div className="flex items-center gap-4">
          <label className="text-xs text-muted-foreground uppercase tracking-wide">Competition</label>
          <Select value={selectedCompetition} onValueChange={setSelectedCompetition}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  {comp.is_finale ? 'Grand Finale' : `Competition ${comp.competition_number}`}
                  {' — '}
                  <span className="text-muted-foreground">{comp.status}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedComp && (
            <Badge variant="outline" className={`text-[9px] uppercase ${
              selectedComp.status === 'LIVE' ? 'text-warning border-warning/30' :
              selectedComp.status === 'REGISTERING' ? 'text-green-400 border-green-400/30' :
              'text-muted-foreground border-border'
            }`}>
              {selectedComp.status}
            </Badge>
          )}
        </div>
      </Card>

      <Tabs defaultValue="whitelist" className="space-y-4">
        <TabsList>
          <TabsTrigger value="whitelist" className="gap-2">
            <Users className="w-4 h-4" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="registrations" className="gap-2">
            <Shield className="w-4 h-4" />
            Registrations
          </TabsTrigger>
          <TabsTrigger value="control" className="gap-2">
            <Settings className="w-4 h-4" />
            Control
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <FileText className="w-4 h-4" />
            Audit Log
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Signups
          </TabsTrigger>
        </TabsList>

        {/* Whitelist Tab */}
        <TabsContent value="whitelist">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Whitelist Management
            </h2>

            {/* Add Address Form */}
            <div className="flex gap-2 mb-6">
              <Input
                placeholder="0x..."
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="font-mono"
              />
              <Button onClick={addToWhitelist} disabled={addingAddress || !newAddress}>
                {addingAddress ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add
              </Button>
            </div>

            {/* Whitelist Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wide">Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Added</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelist.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No addresses whitelisted
                    </TableCell>
                  </TableRow>
                ) : (
                  whitelist.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <code className="text-xs">{entry.wallet_address}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(entry.added_at).toLocaleDateString()}
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

            <p className="text-xs text-muted-foreground mt-4">
              {whitelist.length} address{whitelist.length !== 1 ? 'es' : ''} whitelisted
            </p>
          </Card>
        </TabsContent>

        {/* Registrations Tab */}
        <TabsContent value="registrations">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Registered Competitors
            </h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wide">Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Arena Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Deposit</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Admission</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                ) : (
                  registrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <code className="text-xs">{maskAddress(reg.wallet_address)}</code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {reg.arena_wallet_address ? maskAddress(reg.arena_wallet_address) : '—'}
                        </code>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        ${reg.deposit_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {reg.admission_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[9px] uppercase ${
                          reg.status === 'ACTIVE' ? 'text-warning border-warning/30' :
                          reg.status === 'QUALIFIED' ? 'text-green-400 border-green-400/30' :
                          reg.status === 'ELIMINATED' ? 'text-destructive border-destructive/30' :
                          'text-muted-foreground border-border'
                        }`}>
                          {reg.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <p className="text-xs text-muted-foreground mt-4">
              {registrations.length} registered competitor{registrations.length !== 1 ? 's' : ''}
            </p>
          </Card>
        </TabsContent>

        {/* Control Tab */}
        <TabsContent value="control">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Competition Control
            </h2>

            {selectedComp && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Current Status
                    </p>
                    <p className="text-lg font-semibold text-foreground">{selectedComp.status}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Whitelist Only
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {selectedComp.is_whitelist_only ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                <div className="p-4 border border-warning/30 rounded bg-warning/5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-xs font-medium text-warning uppercase tracking-wide">
                      Status Control
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateCompetitionStatus(selectedCompetition, 'UPCOMING')}
                      disabled={selectedComp.status === 'UPCOMING'}
                    >
                      <Lock className="w-3 h-3 mr-1" />
                      Set Upcoming
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateCompetitionStatus(selectedCompetition, 'REGISTERING')}
                      disabled={selectedComp.status === 'REGISTERING'}
                    >
                      <Unlock className="w-3 h-3 mr-1" />
                      Open Registration
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateCompetitionStatus(selectedCompetition, 'LIVE')}
                      disabled={selectedComp.status === 'LIVE'}
                    >
                      Go Live
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => updateCompetitionStatus(selectedCompetition, 'FINALIZED')}
                      disabled={selectedComp.status === 'FINALIZED'}
                    >
                      Finalize
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Audit Log Tab */}
        <TabsContent value="logs">
          <Card className="p-5 border border-border">
            <h2 className="text-sm font-semibold uppercase tracking-wide mb-4">
              Admin Audit Log
            </h2>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wide">Time</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Action</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Target</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No actions logged
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[9px] uppercase">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {log.target_type}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Notification Signups Tab */}
        <TabsContent value="notifications">
          <Card className="p-5 border border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Arena Notification Signups
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Users who signed up to be notified when registration opens
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setShowBulkModal(true)}
                  disabled={notificationSignups.filter(s => !s.unsubscribed_at).length === 0}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Bulk Notification
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportSignupsToCSV}
                  disabled={exportingCSV || notificationSignups.length === 0}
                >
                  {exportingCSV ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{notificationSignups.length}</p>
                <p className="text-xs text-muted-foreground">Total Signups</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {notificationSignups.filter(s => s.wallet_address).length}
                </p>
                <p className="text-xs text-muted-foreground">With Wallet</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {notificationSignups.filter(s => !s.unsubscribed_at).length}
                </p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[10px] uppercase tracking-wide">Email</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Wallet</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Signed Up</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wide">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notificationSignups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      No signups yet
                    </TableCell>
                  </TableRow>
                ) : (
                  notificationSignups.map((signup) => (
                    <TableRow key={signup.id}>
                      <TableCell className="text-xs">{signup.email}</TableCell>
                      <TableCell>
                        {signup.wallet_address ? (
                          <code className="text-xs text-muted-foreground">
                            {maskAddress(signup.wallet_address)}
                          </code>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(signup.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {signup.unsubscribed_at ? (
                          <Badge variant="outline" className="text-[9px] uppercase text-destructive border-destructive/30">
                            Unsubscribed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] uppercase text-green-400 border-green-400/30">
                            Active
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <p className="text-xs text-muted-foreground mt-4">
              {notificationSignups.length} signup{notificationSignups.length !== 1 ? 's' : ''} total
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Whitelist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this address from the whitelist? 
              This action will be logged.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const entry = whitelist.find(w => w.id === deleteConfirm);
                if (entry) removeFromWhitelist(entry.id, entry.wallet_address);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Notification Modal */}
      <AlertDialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Send Bulk Notification
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send an email to all {notificationSignups.filter(s => !s.unsubscribed_at).length} active subscribers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Notification Type
              </label>
              <Select value={bulkType} onValueChange={(v) => setBulkType(v as typeof bulkType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration_open">🎉 Registration Open</SelectItem>
                  <SelectItem value="reminder">⏰ Registration Reminder</SelectItem>
                  <SelectItem value="custom">✏️ Custom Message</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground uppercase tracking-wide">
                Email Subject
              </label>
              <Input
                value={bulkSubject}
                onChange={(e) => setBulkSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>

            {bulkType === "custom" && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground uppercase tracking-wide">
                  Custom Message
                </label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={bulkCustomMessage}
                  onChange={(e) => setBulkCustomMessage(e.target.value)}
                  placeholder="Your custom message to subscribers..."
                />
              </div>
            )}

            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This will send emails to <strong>{notificationSignups.filter(s => !s.unsubscribed_at).length}</strong> subscribers. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingBulk}>Cancel</AlertDialogCancel>
            <Button
              onClick={sendBulkNotification}
              disabled={sendingBulk || !bulkSubject.trim()}
            >
              {sendingBulk ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send to All
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ArenaLayout>
  );
}
