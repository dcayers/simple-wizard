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
}

export function Wizard({
  header = null,
  footer = null,
  children,
  startAtEnd = false,
  initialStep = 0,
  onStepChange,
}: Props) {
  const steps = useMemo(() => {
    return Children.toArray(children).filter((child) => {
      if (child === null) return false;
      if (isValidElement(child) && child.props?.skip) return false;
      return true;
    });
  }, [children]);

  const stepCount = steps.length;

  return (
    <Provider
      config={{
        activeStep: startAtEnd ? stepCount - 1 : initialStep,
        stepCount,
      }}
    >
      <StepCountSync stepCount={stepCount} />
      {onStepChange && <StepChangeNotifier onStepChange={onStepChange} />}
      {header}
      <Content steps={steps} />
      {footer}
    </Provider>
  );
}
