'use client'

import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'

    const variants = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100',
      secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
      outline: 'border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600',
      ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-100',
    }

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
