import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../i18n/context';
import QRCode from 'qrcode';
import { downloadFile } from '../utils/reportGenerator';

const QrCodeGenerator: React.FC = () => {
    const { t } = useTranslation();
    const [text, setText] = useState('');
    const [qrCodeUrl, setQrCodeUrl] = useState('');

    const generateQrCode = useCallback(async () => {
        if (!text.trim()) {
            setQrCodeUrl('');
            return;
        }
        try {
            const url = await QRCode.toDataURL(text, { 
                errorCorrectionLevel: 'H', 
                width: 300,
                margin: 2,
                color: {
                    dark: '#083344', // dark cyan for dark mode
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(url);
        } catch (err) {
            console.error("QR Code generation failed:", err);
            setQrCodeUrl(''); // Clear on error
        }
    }, [text]);

    useEffect(() => {
        generateQrCode();
    }, [generateQrCode]);
    
    const downloadQrCode = () => {
        if (!qrCodeUrl) return;
        downloadFile('qrcode.png', qrCodeUrl, (key) => t(key as any));
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white dark:bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-200 dark:border-cyan-500/30 shadow-xl">
                <h2 className="text-2xl font-bold text-cyan-700 dark:text-cyan-400 mb-6 text-center">{t('qrCode.title')}</h2>
                <div className="flex flex-col gap-4">
                    <label htmlFor="qr-text" className="sr-only">{t('qrCode.form.text')}</label>
                    <textarea
                        id="qr-text"
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder={t('qrCode.form.placeholder')}
                        rows={4}
                        className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all duration-300"
                        aria-label={t('qrCode.form.text')}
                    />
                </div>
            </div>

            {qrCodeUrl && (
                <div className="mt-8 bg-white dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-fuchsia-500/30 animate-fade-in text-center">
                    <h3 className="text-xl font-bold text-fuchsia-700 dark:text-fuchsia-400 mb-4">{t('dashboard.qrCodeGenerator.title')}</h3>
                    <img src={qrCodeUrl} alt={t('qrCode.title')} className="mx-auto border-4 border-white dark:border-gray-700 rounded-lg shadow-lg" />
                    <button onClick={downloadQrCode} className="mt-6 bg-cyan-600 text-white dark:text-black font-bold py-3 px-8 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/30">
                        {t('qrCode.form.download')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default QrCodeGenerator;