import React, { useState, useCallback, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface ConfirmContextType {
    confirm: (options?: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context.confirm;
};

interface ConfirmProviderProps {
    children: React.ReactNode;
}

export const ConfirmProvider: React.FC<ConfirmProviderProps> = ({ children }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions>({});
    const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts?: ConfirmOptions): Promise<boolean> => {
        setOptions(opts || {});
        setIsOpen(true);
        return new Promise<boolean>((resolve) => {
            setResolveRef(() => resolve);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolveRef?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolveRef?.(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {options.title || t('confirm.title', 'Are you sure?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {options.description || t('confirm.description', 'This action cannot be undone.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options.cancelText || t('cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={options.variant === 'destructive' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                        >
                            {options.confirmText || t('confirm')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
};
