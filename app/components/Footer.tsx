"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
    return(
        <footer className="bg-white border-t border-gray-200 mt-8">
            <div className="px-8 py-6 flex items-center justify-between">
                <p className="text-xs text-gray-600">© 2024 Pacewell Tracker.</p>
                <div className="flex gap-6">
                    <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Privacy Policy</a>
                    <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Terms of Service</a>
                    <a href="#" className="text-xs text-gray-600 hover:text-gray-900">Help Center</a>
                </div>
            </div>
        </footer>
    )
}