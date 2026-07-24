import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import toast from "react-hot-toast";
import { Sun, Moon, Monitor, Clock, Coffee, Timer, Bell, BellOff, Volume2, VolumeX, Save, User, Lock, GraduationCap, Palette } from "lucide-react";

interface Settings {
    theme: string;
    gpaScale: string;
    pomodoroWork: number;
    pomodoroBreak: number;
    pomodoroLongBreak: number;
    pomodoroSessionsBeforeLongBreak: number;
    studyGoalHours: number;
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    weekStartsOn: number;
}

const defaultSettings: Settings = {
    theme: 'system',
    gpaScale: '10.0',
    pomodoroWork: 25,
    pomodoroBreak: 5,
    pomodoroLongBreak: 15,
    pomodoroSessionsBeforeLongBreak: 4,
    studyGoalHours: 20,
    notificationsEnabled: true,
    soundEnabled: true,
    weekStartsOn: 1,
};

const Settings = () => {
    const { user } = useAuth();
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Profile fields
    const [name, setName] = useState(user?.name || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/settings');
                setSettings(data);
            } catch {
                // Use defaults
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const updateSetting = async (key: keyof Settings, value: any) => {
        const updated = { ...settings, [key]: value };
        setSettings(updated);

        if (key === 'theme') {
            setTheme(value as 'light' | 'dark' | 'system');
        }

        try {
            await api.put('/settings', { [key]: value });
        } catch {
            toast.error('Failed to save setting');
        }
    };

    const handleProfileUpdate = async () => {
        setProfileSaving(true);
        try {
            const payload: any = {};
            if (name && name !== user?.name) payload.name = name;
            if (newPassword) {
                payload.currentPassword = currentPassword;
                payload.newPassword = newPassword;
            }

            if (Object.keys(payload).length === 0) {
                toast.error('No changes to save');
                setProfileSaving(false);
                return;
            }

            const { data } = await api.put('/auth/profile', payload);
            // Update local storage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.name = data.name;
            localStorage.setItem('user', JSON.stringify(storedUser));

            setCurrentPassword('');
            setNewPassword('');
            toast.success('Profile updated!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setProfileSaving(false);
        }
    };

    const themeOptions = [
        { value: 'light', label: 'Light', icon: Sun },
        { value: 'dark', label: 'Dark', icon: Moon },
        { value: 'system', label: 'System', icon: Monitor },
    ];

    const gpaOptions = [
        { value: '4.0', label: '4.0 Scale' },
        { value: '10.0', label: '10.0 Scale' },
        { value: 'percentage', label: 'Percentage' },
    ];

    if (loading) {
        return (
            <DashboardLayout title="Settings" subtitle="Customize your experience">
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Settings" subtitle="Customize your experience">
            <div className="max-w-3xl mx-auto space-y-6 page-enter">
                {/* Appearance */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="stat-icon-badge stat-icon-badge-primary">
                            <Palette className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
                            <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {themeOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => updateSetting('theme', opt.value)}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                                    settings.theme === opt.value
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-border hover:border-primary/30 hover:bg-accent'
                                }`}
                            >
                                <opt.icon className={`w-6 h-6 ${settings.theme === opt.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                <span className={`text-sm font-medium ${settings.theme === opt.value ? 'text-primary' : 'text-foreground'}`}>
                                    {opt.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Academic */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="stat-icon-badge stat-icon-badge-success">
                            <GraduationCap className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Academic</h2>
                            <p className="text-sm text-muted-foreground">GPA scale and study goals</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-2 block">GPA Scale</label>
                            <div className="grid grid-cols-3 gap-2">
                                {gpaOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => updateSetting('gpaScale', opt.value)}
                                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                            settings.gpaScale === opt.value
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'bg-secondary text-secondary-foreground hover:bg-accent'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Weekly Study Goal (hours)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={1} max={60}
                                    value={settings.studyGoalHours}
                                    onChange={e => updateSetting('studyGoalHours', Number(e.target.value))}
                                    className="flex-1 accent-primary"
                                />
                                <span className="text-lg font-semibold text-primary w-12 text-right">{settings.studyGoalHours}h</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pomodoro */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="stat-icon-badge stat-icon-badge-warning">
                            <Timer className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Pomodoro Timer</h2>
                            <p className="text-sm text-muted-foreground">Configure your focus sessions</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Work Duration</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1} max={120}
                                    value={settings.pomodoroWork}
                                    onChange={e => updateSetting('pomodoroWork', Number(e.target.value))}
                                    className="input w-20"
                                />
                                <span className="text-sm text-muted-foreground">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Break Duration</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1} max={60}
                                    value={settings.pomodoroBreak}
                                    onChange={e => updateSetting('pomodoroBreak', Number(e.target.value))}
                                    className="input w-20"
                                />
                                <span className="text-sm text-muted-foreground">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Long Break</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1} max={60}
                                    value={settings.pomodoroLongBreak}
                                    onChange={e => updateSetting('pomodoroLongBreak', Number(e.target.value))}
                                    className="input w-20"
                                />
                                <span className="text-sm text-muted-foreground">min</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Sessions Before Long Break</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min={1} max={10}
                                    value={settings.pomodoroSessionsBeforeLongBreak}
                                    onChange={e => updateSetting('pomodoroSessionsBeforeLongBreak', Number(e.target.value))}
                                    className="input w-20"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="stat-icon-badge stat-icon-badge-info">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                            <p className="text-sm text-muted-foreground">Alerts and sound preferences</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                {settings.notificationsEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                                <div>
                                    <p className="text-sm font-medium">Push Notifications</p>
                                    <p className="text-xs text-muted-foreground">Deadline reminders & flashcard reviews</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                                    settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                    settings.notificationsEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div className="flex items-center gap-3">
                                {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-primary" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                                <div>
                                    <p className="text-sm font-medium">Sound Effects</p>
                                    <p className="text-xs text-muted-foreground">Timer completion & achievement sounds</p>
                                </div>
                            </div>
                            <button
                                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                                className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                                    settings.soundEnabled ? 'bg-primary' : 'bg-muted'
                                }`}
                            >
                                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                                    settings.soundEnabled ? 'translate-x-[22px]' : 'translate-x-0.5'
                                }`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile & Account */}
                <div className="card">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="stat-icon-badge stat-icon-badge-primary">
                            <User className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-foreground">Account</h2>
                            <p className="text-sm text-muted-foreground">Update your profile details</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Display Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="input"
                                placeholder="Your name"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground mb-1 block">Email</label>
                            <input
                                type="email"
                                value={user?.email || ''}
                                disabled
                                className="input opacity-50 cursor-not-allowed"
                            />
                        </div>
                        <div className="border-t border-border pt-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Lock className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">Change Password</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">Current Password</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        className="input"
                                        placeholder="••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="input"
                                        placeholder="••••••"
                                    />
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleProfileUpdate}
                            disabled={profileSaving}
                            className="btn btn-primary gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {profileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
