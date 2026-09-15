"use client";
import { Children, type ReactNode, isValidElement, useMemo } from "react";
import { Content } from "./components/content";
import { Provider, StepChangeNotifier, StepCountSync } from "./context";

export interface Props {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  startAtEnd?: boolean;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  keepMounted?: boolean;
}

export function Wizard({
  header = null,
  footer = null,
  children,
  startAtEnd = false,
  initialStep = 0,
  onStepChange,
  keepMounted = false,
}: Props) {
  const steps = useMemo(() => {
    return Children.toArray(children).filter((child) => {
      if (child === null) return false;
      if (isValidElement(child) && child.props?.skip) return false;
      return true;
    });
  }, [children]);

  const stepCount = steps.length;
  const initialActiveStep = Math.max(
    0,
    startAtEnd ? stepCount - 1 : initialStep
  );

  return (
    <Provider
      config={{
        activeStep:
          stepCount > 0
            ? Math.min(initialActiveStep, stepCount - 1)
            : initialActiveStep,
        stepCount,
      }}
    >
      <StepCountSync stepCount={stepCount} />
      {onStepChange && <StepChangeNotifier onStepChange={onStepChange} />}
      {header}
      <Content steps={steps} keepMounted={keepMounted} />
      {footer}
    </Provider>
  );
}
