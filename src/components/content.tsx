import type { ReactNode } from "react";
import { useWizard } from "../context";
import type { State } from "../store";

export const Content = ({
  steps,
  keepMounted = false,
}: { steps: ReactNode[]; keepMounted?: boolean }) => {
  const { activeStep } = useWizard<Pick<State, "activeStep">>(
    (state) => ({
      activeStep: state.activeStep,
    }),
  );

  if (!keepMounted) {
    return steps[activeStep] ?? null;
  }

  return (
    <>
      {steps.map((step, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: steps are a stable, ordered list
          key={index}
          hidden={index !== activeStep}
        >
          {step}
        </div>
      ))}
    </>
  );
};
