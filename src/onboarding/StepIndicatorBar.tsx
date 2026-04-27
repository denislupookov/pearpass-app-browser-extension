import React from 'react'

interface StepIndicatorBarProps {
  currentStep: number
  totalSteps: number
}

export const StepIndicatorBar = ({
  currentStep,
  totalSteps
}: StepIndicatorBarProps) => (
  <div className="flex h-[var(--spacing2)] w-full flex-row items-start gap-[var(--spacing6)]">
    {Array.from({ length: totalSteps }, (_, i) => {
      const step = i + 1
      const isActive = step <= currentStep

      return (
        <div
          key={step}
          className={`bg-text-primary h-[var(--spacing2)] flex-grow rounded-full ${
            isActive ? 'opacity-100' : 'opacity-20'
          }`}
        />
      )
    })}
  </div>
)
