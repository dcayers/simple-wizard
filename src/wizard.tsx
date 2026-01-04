"use client";
import { Children, isValidElement, useMemo, type ReactNode } from "react";
import { Content } from "./components/content";
import { Provider, StepCountSync } from "./context";
import { enableMapSet } from "immer";

enableMapSet();

export interface Props {
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  startAtEnd?: boolean;
  initialStep?: number;
}

export function Wizard({
  header = null,
  footer = null,
  children,
  startAtEnd = false,
  initialStep = 0,
}: Props) {
  const steps = useMemo(() => {
    return Children.toArray(children).filter((child) => {
      if (child === null) return false;
      if (isValidElement(child) && child.props?.skip) return false;
      return true;
    });
  }, [children])

  const stepCount = steps.length;

  return (
    <Provider
      config={{
        activeStep: startAtEnd ? stepCount - 1 : initialStep,
        stepCount,
      }}
    >
      <StepCountSync stepCount={stepCount} />
      {header}
      <Content steps={steps} />
      {footer}
    </Provider>
  );
}
