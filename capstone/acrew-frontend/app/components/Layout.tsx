'use client'

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletConnector from './WalletConnector';
import Image from 'next/image';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();

  return (
    <div className="container">
      <header>
      <nav className="bg-blue-600 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex space-x-4">
            <Link href="/" className="text-xl font-bold">
            <Image 
                src="/logo.png" 
                alt="ACREW Logo"
                width={150}
                height={150} 
              />
            </Link>
            <div className="hidden md:flex items-center space-x-1">
              <NavLink href="/plans" current={pathname}>Plans</NavLink>
              <NavLink href="/create-plan" current={pathname}>Create Plan</NavLink>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <WalletConnector/>
          </div>
        </div>
      </div>
    </nav>
      </header>

      <main>{children}</main>

      <footer>
        <p>&copy; 2024 ACREW. All rights reserved.</p>
      </footer>
    </div>
  );
};

interface NavLinkProps {
  href: string;
  current: string | null;
  children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ href, children, current }) => {
  const isActive = current === href;
  return (
    <Link 
      href={href} 
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        isActive 
          ? 'bg-blue-700 text-white' 
          : 'text-blue-200 hover:bg-blue-700 hover:text-white'
      }`}
    >
      {children}
    </Link>
  );
};

export default Layout;