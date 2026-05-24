interface StatCardProps {
    label: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
}

export default function StatCard({
    label,
    value,
    unit,
    icon,
    backgroundColor = 'bg-white',
    textColor = 'text-pacewell-dark',
    accentColor = 'text-pacewell-dark'
}: StatCardProps) {
    return (
        <div className={`${backgroundColor} rounded-lg shadow-lg p-6 hover:shadow-xl transition`}>
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                    {label}
                </h3>
                {icon && (
                    <div className={`${accentColor} text-2xl`}>
                        {icon}
                    </div>
                )}
            </div>

            <div className="flex items-baseline gap-1">
                <span className={`text-4xl font-bold ${textColor}`}>
                    {typeof value === 'number' ? value.toFixed(1) : value}
                </span>
                {unit && (
                    <span className="text-lg text-gray-600 font-semibold">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}