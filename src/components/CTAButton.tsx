import { Button } from "@/components/ui/button"

interface CTAButtonProps {
  href: string;
  children: React.ReactNode;
}

export function CTAButton({ href, children }: CTAButtonProps) {
  const handleClick = () => {
    window.location.href = href;
  };

  return (
    <Button 
      variant="custom" 
      size="lg" 
      className="text-lg px-8 py-4 gap-2"
      onClick={handleClick}
    >
      {children}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/>
      </svg>
    </Button>
  )
}