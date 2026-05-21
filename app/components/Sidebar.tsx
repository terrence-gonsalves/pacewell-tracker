"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
    const pathname = usePathname();

    const menuItems = [
        { icon: '📊', label: 'Dashboard', href: '/dashboard' },
        { icon: '🍽️', label: 'Meal Tracker', href: '/meals' },
        { icon: '⚖️', label: 'Body Metrics', href: '/body-metrics' },
        { icon: '🎯', label: 'Personal Goals', href: '/goals' },
        { icon: '📈', label: 'History & Logs', href: '/history' },
    ];

    return (
        <aside className="w-56 bg-white h-screen fixed left-0 top-0 shadow-lg flex flex-col">
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-pacewell-dark rounded flex items-center justify-center">
                        <span className="text-white font-bold text-sm">⚡</span>
                    </div>
                    <span className="font-bold text-lg text-pacewell-dark">Pacewell</span>
                </div>
            </div>
            
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                                        isActive
                                            ? 'bg-pacewell-dark text-white font-semibold'
                                            : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
            
            <div className="p-4 border-t border-gray-200 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition">
                    <span className="text-xl">⚙️</span>
                    <span>Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <span className="text-xl">🚪</span>
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}