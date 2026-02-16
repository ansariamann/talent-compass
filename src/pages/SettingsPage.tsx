import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  User,
  Lock,
  Settings,
  Mail,
  Phone,
  MapPin,
  Shield,
  Bell,
  Moon,
  Globe,
  Save,
  Eye,
  EyeOff,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // System config state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [language, setLanguage] = useState('en');
  const [configSaving, setConfigSaving] = useState(false);

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleConfigSave = async () => {
    setConfigSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setConfigSaving(false);
    }
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const roleLabel: Record<string, string> = {
    hr_admin: 'HR Administrator',
    hr_recruiter: 'HR Recruiter',
    client_admin: 'Client Admin',
    client_user: 'Client User',
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your profile, security, and application preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="glass border border-border/50 p-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Lock className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Settings className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* ============ PROFILE TAB ============ */}
        <TabsContent value="profile" className="space-y-6">
          {/* User card */}
          <Card className="glass border-border/50 overflow-hidden">
            <div className="h-20 w-full" style={{ background: 'var(--gradient-primary)', opacity: 0.3 }} />
            <div className="px-6 pb-6 -mt-10 flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl font-bold text-primary-foreground shadow-lg ring-4 ring-background">
                {userInitials}
              </div>
              <div className="pb-1">
                <h2 className="text-lg font-semibold">{user?.name || 'User'}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleLabel[user?.role || ''] || user?.role || 'User'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {user?.tenantId || 'Default Org'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Profile form */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-name" className="flex items-center gap-1.5 text-sm">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> Full Name
                  </Label>
                  <Input
                    id="profile-name"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    placeholder="Your full name"
                    className="glass border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-email" className="flex items-center gap-1.5 text-sm">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input
                    id="profile-email"
                    type="email"
                    value={profileEmail}
                    onChange={e => setProfileEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="glass border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-phone" className="flex items-center gap-1.5 text-sm">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" /> Phone
                  </Label>
                  <Input
                    id="profile-phone"
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="glass border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profile-location" className="flex items-center gap-1.5 text-sm">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Location
                  </Label>
                  <Input
                    id="profile-location"
                    value={profileLocation}
                    onChange={e => setProfileLocation(e.target.value)}
                    placeholder="City, Country"
                    className="glass border-border/50"
                  />
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex justify-end">
                <Button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="btn-vibrant gap-2"
                >
                  {profileSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SECURITY TAB ============ */}
        <TabsContent value="security" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="glass border-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="glass border-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex items-center gap-2 text-xs mt-1">
                      {newPassword.length >= 8 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--status-success))]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground/50" />
                      )}
                      <span className={newPassword.length >= 8 ? 'text-[hsl(var(--status-success))]' : 'text-muted-foreground'}>
                        At least 8 characters
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="glass border-border/50"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1">Passwords do not match</p>
                  )}
                </div>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex justify-end">
                <Button
                  onClick={handlePasswordChange}
                  disabled={passwordSaving || !currentPassword || !newPassword || !confirmPassword}
                  className="btn-vibrant gap-2"
                >
                  {passwordSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                  Update Password
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Session info */}
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Session Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Logged in as</p>
                  <p className="font-medium">{user?.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Role</p>
                  <p className="font-medium">{roleLabel[user?.role || ''] || user?.role || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Organization</p>
                  <p className="font-medium">{user?.tenantId || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Account Created</p>
                  <p className="font-medium">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SYSTEM TAB ============ */}
        <TabsContent value="system" className="space-y-6">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about candidates and applications via email
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get browser push notifications for real-time updates
                  </p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                Preferences
              </CardTitle>
              <CardDescription>Customize your application experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Moon className="w-3.5 h-3.5" /> Dark Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use dark theme across the application
                  </p>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Auto-Refresh Data</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically refresh candidate and application data
                  </p>
                </div>
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              </div>
              <Separator className="bg-border/50" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> Language
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred language
                  </p>
                </div>
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="glass border border-border/50 rounded-lg px-3 py-1.5 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <Separator className="bg-border/50" />

              <div className="flex justify-end">
                <Button
                  onClick={handleConfigSave}
                  disabled={configSaving}
                  className="btn-vibrant gap-2"
                >
                  {configSaving ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
