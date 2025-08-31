import { useState, useCallback } from 'react';
import type { FormState } from '../types';

/**
 * Custom hook for form state management
 * Eliminates duplicated form logic across components
 */

interface UseFormOptions {
  initialValues?: Record<string, any>;
  validate?: (values: Record<string, any>) => Record<string, string>;
  onSubmit?: (values: Record<string, any>) => Promise<void> | void;
}

interface UseFormReturn extends FormState {
  values: Record<string, any>;
  errors: Record<string, string>;
  loading: boolean;
  error: string | null;
  setValue: (field: string, value: any) => void;
  setValues: (values: Record<string, any>) => void;
  setError: (field: string, error: string) => void;
  clearError: (field: string) => void;
  clearErrors: () => void;
  setFieldErrors: (errors: Record<string, string>) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  reset: () => void;
  isDirty: boolean;
  isValid: boolean;
}

export const useForm = (options: UseFormOptions = {}): UseFormReturn => {
  const { initialValues = {}, validate, onSubmit } = options;

  const [values, setFormValues] = useState<Record<string, any>>(initialValues);
  const [errors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setGlobalError] = useState<string | null>(null);

  const setValue = useCallback((field: string, value: any) => {
    setFormValues(prev => ({ ...prev, [field]: value }));
    
    // Clear field error when value changes
    if (errors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  const setValues = useCallback((newValues: Record<string, any>) => {
    setFormValues(newValues);
    setFormErrors({});
  }, []);

  const setError = useCallback((field: string, errorMessage: string) => {
    setFormErrors(prev => ({ ...prev, [field]: errorMessage }));
  }, []);

  const clearError = useCallback((field: string) => {
    setFormErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setFormErrors({});
    setGlobalError(null);
  }, []);

  const setFieldErrors = useCallback((fieldErrors: Record<string, string>) => {
    setFormErrors(fieldErrors);
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();

    setLoading(true);
    setGlobalError(null);

    try {
      // Run validation if provided
      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setFormErrors(validationErrors);
          setLoading(false);
          return;
        }
      }

      // Clear errors before submission
      setFormErrors({});

      // Execute submit handler
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Erro ao processar formulário');
    } finally {
      setLoading(false);
    }
  }, [values, validate, onSubmit]);

  const reset = useCallback(() => {
    setFormValues(initialValues);
    setFormErrors({});
    setGlobalError(null);
    setLoading(false);
  }, [initialValues]);

  const isDirty = Object.keys(values).some(key => values[key] !== initialValues[key]);
  const isValid = Object.keys(errors).length === 0 && !error;

  return {
    values,
    errors,
    loading,
    error,
    setValue,
    setValues,
    setError,
    clearError,
    clearErrors,
    setFieldErrors,
    handleSubmit,
    reset,
    isDirty,
    isValid
  };
};

/**
 * Custom hook specifically for auth forms
 * Pre-configured with common auth validations
 */
export const useAuthForm = () => {
  const validateAuth = (values: Record<string, any>) => {
    const errors: Record<string, string> = {};

    if (values.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        errors.email = 'Email inválido';
      }
    }

    if (values.password) {
      if (values.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }
    }

    if (values.name) {
      if (values.name.trim().length < 2) {
        errors.name = 'Nome deve ter pelo menos 2 caracteres';
      }
    }

    if (values.confirmPassword && values.password) {
      if (values.confirmPassword !== values.password) {
        errors.confirmPassword = 'Senhas não coincidem';
      }
    }

    return errors;
  };

  return useForm({
    validate: validateAuth
  });
};

/**
 * Custom hook for login form
 */
export const useLoginForm = (onSubmit: (email: string, password: string) => Promise<void>) => {
  return useForm({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.email) {
        errors.email = 'Email é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
          errors.email = 'Email inválido';
        }
      }

      if (!values.password) {
        errors.password = 'Senha é obrigatória';
      }

      return errors;
    },
    onSubmit: async (values) => {
      await onSubmit(values.email, values.password);
    }
  });
};

/**
 * Custom hook for register form
 */
export const useRegisterForm = (onSubmit: (email: string, password: string, name: string) => Promise<void>) => {
  return useForm({
    initialValues: { email: '', password: '', confirmPassword: '', name: '' },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.name) {
        errors.name = 'Nome é obrigatório';
      } else if (values.name.trim().length < 2) {
        errors.name = 'Nome deve ter pelo menos 2 caracteres';
      }

      if (!values.email) {
        errors.email = 'Email é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
          errors.email = 'Email inválido';
        }
      }

      if (!values.password) {
        errors.password = 'Senha é obrigatória';
      } else if (values.password.length < 6) {
        errors.password = 'Senha deve ter pelo menos 6 caracteres';
      }

      if (!values.confirmPassword) {
        errors.confirmPassword = 'Confirmação de senha é obrigatória';
      } else if (values.confirmPassword !== values.password) {
        errors.confirmPassword = 'Senhas não coincidem';
      }

      return errors;
    },
    onSubmit: async (values) => {
      await onSubmit(values.email, values.password, values.name);
    }
  });
};

/**
 * Custom hook for forgot password form
 */
export const useForgotPasswordForm = (onSubmit: (email: string) => Promise<void>) => {
  return useForm({
    initialValues: { email: '' },
    validate: (values) => {
      const errors: Record<string, string> = {};

      if (!values.email) {
        errors.email = 'Email é obrigatório';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.email)) {
          errors.email = 'Email inválido';
        }
      }

      return errors;
    },
    onSubmit: async (values) => {
      await onSubmit(values.email);
    }
  });
};