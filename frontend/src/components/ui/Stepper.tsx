import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';
import { cn } from '../../utils/cn';

export interface Step {
  id: string;
  title: string;
  description?: string;
  icon: string;
  optional?: boolean;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowClickableSteps?: boolean;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowClickableSteps = false,
  className
}) => {
  const isStepCompleted = (stepIndex: number) => stepIndex < currentStep;
  const isStepActive = (stepIndex: number) => stepIndex === currentStep;
  const isStepAccessible = (stepIndex: number) => stepIndex <= currentStep;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center">
        {steps.map((step, index) => {
          const completed = isStepCompleted(index);
          const active = isStepActive(index);
          const accessible = isStepAccessible(index);

          return (
            <React.Fragment key={step.id}>
              {/* Step */}
              <motion.div
                className="flex flex-col items-center relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
              >
                {/* Step Circle */}
                <motion.button
                  onClick={() => allowClickableSteps && accessible && onStepClick?.(index)}
                  disabled={!allowClickableSteps || !accessible}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center font-semibold text-sm relative z-10 transition-all duration-300",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neuro-primary",
                    completed || active
                      ? "text-white shadow-glow-lg"
                      : "text-neuro-gray-600 bg-neuro-surface border-2 border-neuro-border",
                    allowClickableSteps && accessible && "hover:scale-105 cursor-pointer",
                    !allowClickableSteps && "cursor-default"
                  )}
                  style={
                    completed || active
                      ? {
                          background: completed
                            ? `linear-gradient(135deg, #10B981 0%, #059669 100%)`
                            : `linear-gradient(135deg, #2D5A1F 0%, #4A9A3F 100%)`,
                          boxShadow: completed
                            ? `0 4px 15px rgba(16, 185, 129, 0.4)`
                            : `0 4px 15px rgba(45, 90, 31, 0.4)`
                        }
                      : undefined
                  }
                  whileHover={
                    allowClickableSteps && accessible
                      ? { scale: 1.05, y: -2 }
                      : undefined
                  }
                  whileTap={
                    allowClickableSteps && accessible
                      ? { scale: 0.95 }
                      : undefined
                  }
                >
                  {/* Step Content */}
                  <motion.div
                    initial={false}
                    animate={{
                      rotate: completed ? 360 : 0,
                      scale: active ? 1.1 : 1
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {completed ? (
                      <Icon name="check" className="w-6 h-6" />
                    ) : (
                      <Icon name={step.icon as any} className="w-6 h-6" />
                    )}
                  </motion.div>

                  {/* Glow Effect */}
                  {(completed || active) && (
                    <motion.div
                      className="absolute inset-0 rounded-xl opacity-30 blur-lg"
                      style={{
                        background: completed
                          ? `radial-gradient(circle, #10B981 0%, transparent 70%)`
                          : `radial-gradient(circle, #2D5A1F 0%, transparent 70%)`
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}

                  {/* Ripple Effect for Active Step */}
                  {active && (
                    <motion.div
                      className="absolute inset-0 rounded-xl border-2 border-neuro-primary"
                      animate={{
                        scale: [1, 1.5],
                        opacity: [0.5, 0]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeOut"
                      }}
                    />
                  )}
                </motion.button>

                {/* Step Label */}
                <motion.div
                  className="mt-3 text-center max-w-24"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                >
                  <h3
                    className={cn(
                      "text-xs font-semibold transition-colors",
                      completed || active
                        ? "text-neuro-gray-900"
                        : "text-neuro-gray-500"
                    )}
                  >
                    {step.title}
                  </h3>
                  {step.description && (
                    <p className="text-xs text-neuro-gray-500 mt-1">
                      {step.description}
                    </p>
                  )}
                  {step.optional && (
                    <span className="text-xs text-neuro-gray-400 italic">
                      Opcional
                    </span>
                  )}
                </motion.div>
              </motion.div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <motion.div
                  className="flex-1 px-4 relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                >
                  {/* Background Line */}
                  <div className="h-0.5 bg-neuro-border rounded-full" />
                  
                  {/* Progress Line */}
                  <motion.div
                    className="absolute top-0 left-4 h-0.5 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, #10B981 0%, #059669 100%)`
                    }}
                    initial={{ width: "0%" }}
                    animate={{
                      width: isStepCompleted(index + 1) ? "100%" : "0%"
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />

                  {/* Animated Dots */}
                  {isStepActive(index + 1) && (
                    <motion.div
                      className="absolute top-0 left-4 h-0.5"
                      style={{
                        background: `linear-gradient(90deg, #2D5A1F 0%, #4A9A3F 100%)`
                      }}
                      animate={{
                        width: ["0%", "50%", "0%"]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <motion.div
        className="mt-8 h-1 bg-neuro-surface rounded-full overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4 }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, #10B981 0%, #059669 50%, #2D5A1F 100%)`
          }}
          initial={{ width: "0%" }}
          animate={{
            width: `${((currentStep + 1) / steps.length) * 100}%`
          }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Step Counter */}
      <motion.div
        className="mt-4 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
      >
        <p className="text-sm text-neuro-gray-600 font-medium">
          Etapa {currentStep + 1} de {steps.length}
          {steps[currentStep]?.title && (
            <span className="text-neuro-primary font-semibold ml-1">
              · {steps[currentStep].title}
            </span>
          )}
        </p>
      </motion.div>
    </div>
  );
};