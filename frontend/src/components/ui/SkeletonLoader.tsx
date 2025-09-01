import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  children?: React.ReactNode;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-gray-200", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const ConversationSkeleton: React.FC = () => {
  return (
    <div className="p-3 space-y-3">
      <div className="flex items-start space-x-3">
        <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
};

export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="divide-y divide-gray-100">
      {Array.from({ length: 5 }).map((_, index) => (
        <ConversationSkeleton key={index} />
      ))}
    </div>
  );
};

export const MessageSkeleton: React.FC<{ isUser?: boolean }> = ({ isUser = false }) => {
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg space-y-2",
        isUser ? "bg-blue-500" : "bg-gray-200"
      )}>
        <Skeleton className={cn("h-4 w-full", isUser ? "bg-blue-400" : "bg-gray-300")} />
        <Skeleton className={cn("h-4 w-3/4", isUser ? "bg-blue-400" : "bg-gray-300")} />
      </div>
    </div>
  );
};