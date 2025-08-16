import { Card, CardHeader, CardContent } from "@/components/ui/card"

interface ToolCardProps {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ToolCard({ href, title, description, icon }: ToolCardProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <Card 
      className="group cursor-pointer border-gray-200 hover:border-teal-300 hover:shadow-md transition-all"
      onClick={handleClick}
    >
      <CardContent className="p-6">
        <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-200 transition-colors">
          <div className="text-teal-600">
            {icon}
          </div>
        </div>
        <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  )
}