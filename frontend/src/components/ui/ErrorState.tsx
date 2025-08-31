import React from 'react';
import { Button } from './Button';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
  icon?: React.ReactNode;
  variant?: 'page' | 'card' | 'inline';
  className?: string;
}

const ErrorIcons = {
  general: (
    <svg className="w-12 h-12 text-neuro-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  network: (
    <svg className="w-12 h-12 text-neuro-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  notFound: (
    <svg className="w-12 h-12 text-neuro-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-3" />
    </svg>
  ),
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Ops! Algo deu errado",
  message = "Ocorreu um erro inesperado. Tente novamente.",
  onRetry,
  retryText = "Tentar Novamente",
  icon,
  variant = 'page',
  className = '',
}) => {
  const errorIcon = icon || ErrorIcons.general;

  if (variant === 'page') {
    return (
      <div className={`flex items-center justify-center min-h-96 px-4 ${className}`}>
        <div className="text-center max-w-md">
          <div className="flex justify-center mb-4">
            {errorIcon}
          </div>
          <h3 className="text-xl font-semibold text-neuro-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-neuro-gray-600 mb-6 leading-relaxed">
            {message}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {retryText}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={`text-center ${className}`}>
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="w-8 h-8 text-neuro-error">
              {errorIcon}
            </div>
          </div>
          <CardTitle as="h3" className="text-lg">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neuro-gray-600 text-sm mb-4">
            {message}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {retryText}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Inline variant
  return (
    <div className={`flex items-center justify-center p-6 text-center ${className}`}>
      <div>
        <div className="flex justify-center mb-2">
          <div className="w-6 h-6 text-neuro-error">
            {errorIcon}
          </div>
        </div>
        <h4 className="text-sm font-medium text-neuro-gray-900 mb-1">
          {title}
        </h4>
        <p className="text-xs text-neuro-gray-600 mb-3">
          {message}
        </p>
        {onRetry && (
          <Button onClick={onRetry} variant="ghost" size="sm">
            {retryText}
          </Button>
        )}
      </div>
    </div>
  );
};

// Specific error components for common scenarios
export const NetworkError: React.FC<Omit<ErrorStateProps, 'icon' | 'title'>> = (props) => (
  <ErrorState
    {...props}
    icon={ErrorIcons.network}
    title="Erro de Conexão"
    message="Verifique sua conexão com a internet e tente novamente."
  />
);

export const NotFoundError: React.FC<Omit<ErrorStateProps, 'icon' | 'title'>> = (props) => (
  <ErrorState
    {...props}
    icon={ErrorIcons.notFound}
    title="Não Encontrado"
    message="O item que você está procurando não foi encontrado."
  />
);

export const EmptyState: React.FC<{
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
  className?: string;
}> = ({
  title = "Nenhum item encontrado",
  message = "Não há itens para exibir no momento.",
  action,
  icon,
  className = '',
}) => {
  const emptyIcon = icon || (
    <svg className="w-12 h-12 text-neuro-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div className={`flex items-center justify-center min-h-64 px-4 ${className}`}>
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          {emptyIcon}
        </div>
        <h3 className="text-lg font-medium text-neuro-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-neuro-gray-500 mb-6">
          {message}
        </p>
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};