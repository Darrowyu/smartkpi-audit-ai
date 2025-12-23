import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const NotFoundPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <CardTitle className="text-2xl">404</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{t('notFound.message')}</p>
                    <Button onClick={() => navigate('/')}>
                        <Home className="mr-2 h-4 w-4" /> {t('notFound.backHome')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default NotFoundPage;
