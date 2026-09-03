'use client';

import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import Head from 'next/head';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class GranularErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('GranularErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm my-2 text-center">
            تعذر تحميل هذا الجزء حالياً.
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY ? 'down' : 'up';
      if (direction !== scrollDirection && Math.abs(scrollY - lastScrollY) > 10) {
        setScrollDirection(direction);
      }
      lastScrollY = scrollY > 0 ? scrollY : 0;
    };

    window.addEventListener('scroll', updateScrollDirection, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollDirection);
  }, [scrollDirection]);

  return scrollDirection;
}

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export default function AppLayout({
  children,
  title = 'Compux - شبكة التواصل الجامعية',
  activeTab = 'home',
  onTabChange,
}: AppLayoutProps) {
  const [isMounted, setIsMounted] = useState(false);
  const scrollDirection = useScrollDirection();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
        <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-md transition-all duration-300">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                COMPUX
              </span>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-slate-800/60 transition-colors" aria-label="الإشعارات">
                🔔
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 mb-20 md:mb-6">
          <GranularErrorBoundary>
            {isMounted ? children : <div className="animate-pulse bg-slate-900 rounded-xl h-96 w-full" />}
          </GranularErrorBoundary>
        </main>

        <nav
          className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md transition-transform duration-300 ease-in-out md:hidden ${
            scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
          }`}
          style={{
            paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          }}
        >
          <div className="flex items-center justify-around h-16 px-2">
            {[
              { id: 'home', label: 'الرئيسية', icon: '🏠' },
              { id: 'groups', label: 'المجموعات', icon: '👥' },
              { id: 'events', label: 'الفعاليات', icon: '📅' },
              { id: 'messages', label: 'الرسائل', icon: '✉️' },
              { id: 'profile', label: 'حسابي', icon: '👤' },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                    isActive ? 'text-indigo-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}
