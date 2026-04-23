import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Download, Printer, Plus, Minus, Copy, Check } from 'lucide-react';
import { SITE_URL } from '../../lib/config';

const DEFAULT_URL = SITE_URL;

export default function AdminQR() {
    const [url, setUrl] = useState(DEFAULT_URL);
    const [copies, setCopies] = useState(1);
    const [copied, setCopied] = useState(false);
    const qrRef = useRef(null);

    const handleCopyUrl = async () => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;

        const padding = 40;
        const totalW = canvas.width + padding * 2;
        const totalH = canvas.height + padding * 2;

        const offscreen = document.createElement('canvas');
        offscreen.width = totalW;
        offscreen.height = totalH;
        const ctx = offscreen.getContext('2d');

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, totalW, totalH);
        ctx.drawImage(canvas, padding, padding);

        const link = document.createElement('a');
        link.download = 'qr-menu-burgers-boss.png';
        link.href = offscreen.toDataURL('image/png');
        link.click();
    };

    const handlePrint = () => {
        const canvas = qrRef.current?.querySelector('canvas');
        if (!canvas) return;
        const dataUrl = canvas.toDataURL('image/png');

        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html><head><title>QR - Burgers Boss</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: system-ui, sans-serif; }
                .page { display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; padding: 20px; }
                .qr-card {
                    width: 280px; padding: 24px; text-align: center;
                    border: 2px solid #e5e5e5; border-radius: 16px;
                    page-break-inside: avoid;
                }
                .qr-card img { width: 200px; height: 200px; margin: 0 auto 12px; }
                .brand { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 2px; }
                .sub { font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 3px; }
                .scan { font-size: 11px; color: #999; margin-top: 6px; }
                @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
            </style></head><body>
            <div class="page">
                ${Array.from({ length: copies }, () => `
                    <div class="qr-card">
                        <div class="brand">Burgers Boss</div>
                        <div class="sub">Pedí online</div>
                        <img src="${dataUrl}" />
                        <div class="scan">Escaneá para ver el menú</div>
                    </div>
                `).join('')}
            </div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 300);
    };

    return (
        <div className="max-w-2xl mx-auto animate-fade-up">
            <div className="mb-8">
                <h1 className="font-display text-3xl font-black text-secondary uppercase tracking-wider mb-1">Código QR</h1>
                <p className="font-body italic text-text-muted text-sm">Generá e imprimí el QR del menú para pegar en las mesas</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Config */}
                <div className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">URL del menú</label>
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-secondary text-sm focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="https://tudominio.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Copias para imprimir</label>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCopies(c => Math.max(1, c - 1))} className="cursor-pointer w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:border-primary/30 transition-colors">
                                <Minus className="w-4 h-4 text-text-muted" />
                            </button>
                            <span className="text-sm text-secondary font-medium w-16 text-center">{copies}</span>
                            <button onClick={() => setCopies(c => Math.min(20, c + 1))} className="cursor-pointer w-10 h-10 rounded-xl border border-border flex items-center justify-center hover:border-primary/30 transition-colors">
                                <Plus className="w-4 h-4 text-text-muted" />
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={handleDownload}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Descargar
                        </button>
                        <button
                            onClick={handlePrint}
                            className="cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-border text-secondary font-semibold text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Imprimir
                        </button>
                    </div>
                </div>

                {/* Preview */}
                <div className="flex flex-col items-center">
                    <div className="border border-border rounded-2xl p-6 bg-white w-fit">
                        <p className="text-center font-display font-black text-lg uppercase tracking-wider text-gray-900 mb-0.5">Burgers Boss</p>
                        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-gray-400 mb-4">Pedí online</p>
                        <div ref={qrRef}>
                            <QRCodeCanvas
                                value={url}
                                size={220}
                                level="M"
                                marginSize={2}
                            />
                        </div>
                        <p className="text-center text-[10px] text-gray-400 mt-3">Escaneá para ver el menú</p>
                    </div>
                    <div className="flex items-center gap-2 mt-3 max-w-[260px]">
                        <p className="text-xs text-text-muted break-all flex-1">{url}</p>
                        <button
                            onClick={handleCopyUrl}
                            className="cursor-pointer shrink-0 p-1.5 rounded-lg border border-border hover:border-primary/40 transition-colors"
                            title="Copiar URL"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-text-muted" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
