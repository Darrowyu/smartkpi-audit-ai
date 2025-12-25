import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3, Users, Target, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const LandingPage: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const features = [
        { icon: Target, titleKey: 'landing.feature1Title', descKey: 'landing.feature1Desc', path: '/kpi-library' },
        { icon: BarChart3, titleKey: 'landing.feature2Title', descKey: 'landing.feature2Desc', path: '/dashboard' },
        { icon: Users, titleKey: 'landing.feature3Title', descKey: 'landing.feature3Desc', path: '/team' },
        { icon: FileSpreadsheet, titleKey: 'landing.feature4Title', descKey: 'landing.feature4Desc', path: '/reports' },
    ];

    return (
        <div className="space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">{t('landing.welcome')}</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    {t('landing.subtitle')}
                </p>
                <Button size="lg" onClick={() => navigate('/dashboard')}>
                    {t('landing.getStarted')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mt-12">
                {features.map((feature, index) => (
                    <Card
                        key={index}
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(feature.path)}
                    >
                        <CardHeader>
                            <feature.icon className="h-10 w-10 text-primary mb-2" />
                            <CardTitle className="text-lg">{t(feature.titleKey)}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{t(feature.descKey)}</CardDescription>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default LandingPage;
