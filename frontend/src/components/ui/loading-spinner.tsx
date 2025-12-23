import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
    text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    fullScreen = false,
    size = 'md',
    text
}) => {
    const { t } = useTranslation();

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12',
    };

    const content = (
        <div className="flex flex-col items-center justify-center gap-3">
            <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
            {text && <p className="text-sm text-muted-foreground">{text}</p>}
            {!text && fullScreen && <p className="text-sm text-muted-foreground">{t('loading')}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                {content}
            </div>
        );
    }

    return content;
};
