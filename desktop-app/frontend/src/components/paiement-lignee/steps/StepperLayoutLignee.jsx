// src/components/paiement/StepperLayout.jsx
import React from "react";
import { motion } from "framer-motion";

export default function StepperLayout({ 
  steps = [], 
  current = 1, 
  summaries = {}, 
  onStepClick = () => {}, 
  loading = false,
  children 
}) {
  return (
    <div className="space-y-6">
      {/* Desktop stepper */}
      <div className="hidden md:flex items-center justify-between relative">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 -z-10"></div>
        
        {steps.map((s, index) => {
          const isCompleted = s.id < current;
          const isCurrent = s.id === current;
          const isClickable = s.id <= current;
          
          return (
            <div key={s.id} className="flex flex-col items-center relative z-10">
              <motion.button
                whileHover={{ scale: isClickable ? 1.05 : 1 }}
                whileTap={{ scale: isClickable ? 0.95 : 1 }}
                onClick={() => isClickable && onStepClick(s.id)}
                disabled={!isClickable}
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold
                  transition-all duration-300 shadow-md
                  ${isCurrent 
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100' 
                    : isCompleted 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }
                  ${isClickable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed'}
                `}
              >
                {isCompleted ? '✓' : s.icon}
              </motion.button>
              
              <div className="mt-2 text-center">
                <div className={`font-medium ${isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                  {s.label}
                </div>
                {summaries[s.id] && (
                  <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">
                    {summaries[s.id]}
                  </div>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`
                  absolute top-6 left-1/2 w-full h-1 -z-10
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                `}></div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile stepper */}
      <div className="md:hidden overflow-x-auto pb-4">
        <div className="flex space-x-2 min-w-max">
          {steps.map((s) => {
            const isCurrent = s.id === current;
            const isCompleted = s.id < current;
            
            return (
              <button
                key={s.id}
                onClick={() => onStepClick(s.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap
                  transition-colors
                  ${isCurrent 
                    ? 'bg-blue-600 text-white' 
                    : isCompleted
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-700'
                  }
                `}
              >
                <span className="font-semibold">{s.id}.</span>
                <span>{s.label}</span>
                {isCompleted && <span>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div>{children}</div>
    </div>
  );
}