import React from 'react';

export class AdminErrorBoundary extends React.Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                <p className="text-text-muted text-sm mb-4">Ocurrió un error inesperado en el panel.</p>
                <button
                    onClick={() => this.setState({ hasError: false })}
                    className="cursor-pointer text-primary underline text-sm hover:text-primary-dark transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
        return this.props.children;
    }
}
