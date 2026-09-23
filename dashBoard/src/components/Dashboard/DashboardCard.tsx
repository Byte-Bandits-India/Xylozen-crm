import { TrendingDown, TrendingUp } from 'lucide-react';

type DashboardCardProps = {
  title: string
  value: string
  change: string
  isPositive: boolean
  icon: React.ReactNode
  iconBg?: string
  iconTextColor?: string
  link?: string
}

export const DashboardCard = ({ title, value, change, isPositive, icon, iconBg, link = "bg-emerald-50", iconTextColor = "text-emerald-600" }: DashboardCardProps) => {
    return (
        <div className="relative overflow-hidden rounded-lg border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            {/* Top right corner - Percentage change */}
            <div className="absolute top-4 right-4">
                <span className={`inline-flex items-center text-lg font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    {isPositive ? (
                        <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                        <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {change}
                </span>
            </div>

            {/* Title at top left */}
            <div className="mb-8">
                <p className="text-sm font-medium uppercase tracking-[0.5px] text-gray-500">
                    {title}
                </p>
            </div>

            {/* Value in the middle left */}
            <div className="mb-8">
                <h3 className="text-2xl lg:text-[30px] font-bold text-gray-900">{value}</h3>
            </div>

            {/* "View net earnings" link at bottom left */}
            <div>
                <a href="/" className="text-sm text-brand-blue hover:text-blue-700 underline">
                    {link}
                </a>
            </div>

            {/* Icon at bottom right */}
            <div className="absolute bottom-4 right-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-lg ${iconBg} ${iconTextColor}`}>
                    {icon}
                </div>
            </div>
        </div>

    );
};