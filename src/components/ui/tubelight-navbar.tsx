"use client"

import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConnectButton } from "@rainbow-me/rainbowkit"

interface NavItem {
  name: string
  url: string
  icon: LucideIcon
}

interface NavBarProps {
  items: NavItem[]
  className?: string
}

export function NavBar({ items }: NavBarProps) {
  const pathname = usePathname()
  
  // Determine active tab based on current pathname
  const getActiveTab = () => {
    const currentItem = items.find(item => {
      if (item.url === '/' && pathname === '/') return true
      if (item.url !== '/' && pathname.startsWith(item.url)) return true
      return false
    })
    return currentItem?.name || items[0].name
  }



  return (
    <div className="fixed top-0 left-0 right-0 z-50 pt-6 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Twitter Logo - Left Side */}
        <div className="w-32 flex justify-start">
          <a 
            href="https://twitter.com/BruceWayne82118" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-500 transition-colors p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            <svg 
              className="w-6 h-6" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
          </a>
        </div>
        
        {/* Navigation Items - Center */}
        <div className="flex justify-center flex-1">
          <div className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = getActiveTab() === item.name

          return (
            <Link
              key={item.name}
              href={item.url}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "bg-muted text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="lamp"
                  className="absolute inset-0 w-full bg-primary/5 rounded-full -z-10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          )
        })}
          </div>
        </div>
        
        {/* Connect Wallet Button - Right Side */}
        <div className="w-32 flex justify-end">
          <div className="hidden sm:block">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              authenticationStatus,
              mounted,
            }) => {
              const ready = mounted && authenticationStatus !== 'loading'
              const connected =
                ready &&
                account &&
                chain &&
                (!authenticationStatus ||
                  authenticationStatus === 'authenticated')
              return (
                <div
                  {...(!ready && {
                    'aria-hidden': true,
                    'style': {
                      opacity: 0,
                      pointerEvents: 'none',
                      userSelect: 'none',
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          type="button"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg w-40"
                        >
                          Connect Wallet
                        </button>
                      )
                    }
                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          type="button"
                          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg  w-40"
                        >
                          Wrong network
                        </button>
                      )
                    }
                    return (
                      <button
                        onClick={openAccountModal}
                        type="button"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full text-sm font-semibold transition-colors shadow-lg w-48"
                      >
                        {account.displayName}
                        {account.displayBalance
                          ? ` (${account.displayBalance})`
                          : ''}
                      </button>
                    )
                  })()
                  }
                </div>
              )
            }}
          </ConnectButton.Custom>
          </div>
        </div>
      </div>
    </div>
  )
}
