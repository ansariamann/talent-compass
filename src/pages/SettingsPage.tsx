import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  User, Lock, Settings, Mail, Phone, MapPin,
  Shield, Bell, Moon, Sun, Globe, Save, Eye, EyeOff,
  Briefcase, CheckCircle2,
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [profileName,     setProfileName]     = useState(user?.name  || '');
  const [profileEmail,    setProfileEmail]    = useState(user?.email || '');
  const [profilePhone,    setProfilePhone]    = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileSaving,   setProfileSaving]   = useState(false);

  const [currentPassword,      setCurrentPassword]      = useState('');
  const [newPassword,          setNewPassword]          = useState('');
  const [confirmPassword,      setConfirmPassword]      = useState('');
  const [showCurrentPassword,  setShowCurrentPassword]  = useState(false);
  const [showNewPassword,      setShowNewPassword]      = useState(false);
  const [passwordSaving,       setPasswordSaving]       = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications,  setPushNotifications]  = useState(false);
  const [autoRefresh,        setAutoRefresh]        = useState(true);
  const [language,           setLanguage]           = useState('en');
  const [configSaving,       setConfigSaving]       = useState(false);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Profile updated successfully');
    } catch { toast.error('Failed to update profile'); }
    finally  { setProfileSaving(false); }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { toast.error('Please fill in all password fields'); return; }
    if (newPassword !== confirmPassword) { toast.error('New passwords do not match'); return; }
    if (newPassword.length < 8)          { toast.error('Password must be at least 8 characters'); return; }
    setPasswordSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch { toast.error('Failed to change password'); }
    finally  { setPasswordSaving(false); }
  };

  const handleConfigSave = async () => {
    setConfigSaving(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      toast.success('Settings saved successfully');
    } catch { toast.error('Failed to save settings'); }
    finally  { setConfigSaving(false); }
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const roleLabel: Record<string, string> = {
    hr_admin:     'HR Administrator',
    hr_recruiter: 'HR Recruiter',
    client_admin: 'Client Admin',
    client_user:  'Client User',
  };

  const Spinner = () => (
    <span className="w-3.5 h-3.5 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
  );

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto space-y-8 animate-fade-in">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 pb-4 border-b border-border">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Profile, security, and preferences</p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary border border-border p-1 rounded-xl h-auto gap-1">
          {[
            { value: 'profile',  label: 'Profile',  icon: User     },
            { value: 'security', label: 'Security', icon: Lock     },
            { value: 'system',   label: 'System',   icon: Settings },
          ].map(({ value, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-lg gap-2 text-[13px] px-4 py-1.5
                         text-muted-foreground
                         data-[state=active]:bg-background
                         data-[state=active]:shadow-sm
                         data-[state=active]:text-foreground
                         data-[state=active]:font-medium"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ══ PROFILE ════════════════════════════════════════════════ */}
        <TabsContent value="profile" className="space-y-5">

          {/* Identity card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-[22px] font-semibold text-primary shrink-0 ring-1 ring-border">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold text-foreground truncate">{user?.name || 'User'}</h2>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      <Shield className="w-3 h-3" />
                      {roleLabel[user?.role || ''] || user?.role || 'User'}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                      <Briefcase className="w-3 h-3" />
                      {user?.tenantId || 'Default Org'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal info */}
          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { id: 'profile-name',     icon: User,   label: 'Full Name', value: profileName,     setter: setProfileName,     type: 'text',  placeholder: 'Your full name'    },
                  { id: 'profile-email',    icon: Mail,   label: 'Email',     value: profileEmail,    setter: setProfileEmail,    type: 'email', placeholder: 'your@email.com'    },
                  { id: 'profile-phone',    icon: Phone,  label: 'Phone',     value: profilePhone,    setter: setProfilePhone,    type: 'text',  placeholder: '+91 98765 43210'   },
                  { id: 'profile-location', icon: MapPin, label: 'Location',  value: profileLocation, setter: setProfileLocation, type: 'text',  placeholder: 'City, Country'     },
                ] as const).map(({ id, icon: Icon, label, value, setter, type, placeholder }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id} className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-normal">
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </Label>
                    <Input
                      id={id}
                      type={type}
                      value={value}
                      onChange={e => setter(e.target.value)}
                      placeholder={placeholder}
                      className="h-9 text-[14px] bg-secondary border-border/70 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <Button onClick={handleProfileSave} disabled={profileSaving} className="gap-2 h-9">
                  {profileSaving ? <Spinner /> : <Save className="w-3.5 h-3.5" />}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ SECURITY ═══════════════════════════════════════════════ */}
        <TabsContent value="security" className="space-y-5">

          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Change Password
              </CardTitle>
              <CardDescription className="text-[13px]">
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5 pb-5 space-y-4 max-w-md">

              {/* Current password */}
              <div className="space-y-1.5">
                <Label htmlFor="current-password" className="text-[13px] text-muted-foreground font-normal">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="h-9 text-[14px] bg-secondary border-border/70 focus-visible:ring-1 focus-visible:ring-primary pr-10"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-[13px] text-muted-foreground font-normal">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="h-9 text-[14px] bg-secondary border-border/70 focus-visible:ring-1 focus-visible:ring-primary pr-10"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="flex items-center gap-1.5 text-[12px]">
                    {newPassword.length >= 8
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/40" />
                    }
                    <span className={newPassword.length >= 8 ? 'text-status-success' : 'text-muted-foreground'}>
                      At least 8 characters
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password" className="text-[13px] text-muted-foreground font-normal">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="h-9 text-[14px] bg-secondary border-border/70 focus-visible:ring-1 focus-visible:ring-primary"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[12px] text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="gap-2 h-9"
                >
                  {passwordSaving ? <Spinner /> : <Lock className="w-3.5 h-3.5" />}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session info */}
          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Session
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              <div className="divide-y divide-border">
                {[
                  { label: 'Logged in as',  value: user?.email || 'N/A' },
                  { label: 'Role',          value: roleLabel[user?.role || ''] || user?.role || 'N/A' },
                  { label: 'Organisation',  value: user?.tenantId || 'N/A' },
                  { label: 'Member since',  value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="text-[13px] text-muted-foreground">{label}</span>
                    <span className="text-[13px] font-medium text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ══ SYSTEM ═════════════════════════════════════════════════ */}
        <TabsContent value="system" className="space-y-5">

          {/* Notifications */}
          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              <div className="divide-y divide-border">
                {[
                  { label: 'Email Notifications', description: 'Updates about candidates and applications via email', checked: emailNotifications, toggle: setEmailNotifications },
                  { label: 'Push Notifications',  description: 'Real-time browser push notifications',              checked: pushNotifications,  toggle: setPushNotifications  },
                ].map(({ label, description, checked, toggle }) => (
                  <div key={label} className="flex items-center justify-between py-3.5 gap-4">
                    <div>
                      <p className="text-[14px] font-medium text-foreground">{label}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
                    </div>
                    <Switch checked={checked} onCheckedChange={toggle} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <div className="divide-y divide-border">
                {/* Dark mode row — wired to real theme hook */}
                <div className="flex items-center justify-between py-3.5 gap-4">
                  <div className="flex items-center gap-2.5">
                    {isDark
                      ? <Moon className="w-4 h-4 text-muted-foreground" />
                      : <Sun  className="w-4 h-4 text-muted-foreground" />
                    }
                    <div>
                      <p className="text-[14px] font-medium text-foreground">Dark Mode</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5">Use dark theme across the application</p>
                    </div>
                  </div>
                  <Switch checked={isDark} onCheckedChange={toggleTheme} />
                </div>

                {/* Auto-refresh row */}
                <div className="flex items-center justify-between py-3.5 gap-4">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">Auto-Refresh Data</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Automatically refresh candidate and application data</p>
                  </div>
                  <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
                </div>

                {/* Language */}
                <div className="flex items-center justify-between py-3.5 gap-4">
                  <div>
                    <p className="text-[14px] font-medium text-foreground">Language</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">Preferred display language</p>
                  </div>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="h-8 px-3 rounded-lg text-[13px] bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleConfigSave} disabled={configSaving} className="gap-2 h-9">
                  {configSaving ? <Spinner /> : <Save className="w-3.5 h-3.5" />}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader className="pt-5 pb-3 px-5">
              <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                About
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-2">
              <div className="divide-y divide-border">
                {[
                  { label: 'Application',  value: 'TalentFlow ATS' },
                  { label: 'Version',      value: '1.0.0'          },
                  { label: 'Environment',  value: 'Production'     },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="text-[13px] text-muted-foreground">{label}</span>
                    <span className="text-[13px] font-medium text-foreground font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
