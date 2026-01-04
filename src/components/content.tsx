import type { ReactNode } from "react";
import { useWizard } from "../context";
import type { State } from "../store";

export const Content = ({ steps }: { steps: ReactNode[] }) => {
  const { activeStep } = useWizard<Pick<State, "activeStep">>(
    (state) => ({
      activeStep: state.activeStep,
    }),
  );

  return steps[activeStep] ?? null;
};
