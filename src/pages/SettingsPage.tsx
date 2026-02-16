
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SettingsPage = () => {
    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account and application preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Settings configuration coming soon...</p>
                </CardContent>
            </Card>
        </div>
    );
};

export default SettingsPage;
