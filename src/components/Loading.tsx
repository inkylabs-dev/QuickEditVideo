interface LoadingProps {
  className?: string;
}

const Loading = ({ className = '' }: LoadingProps) => {
  return <div className={`loader ${className}`} />;
};

export default Loading;
