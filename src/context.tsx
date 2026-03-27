import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useStore } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  type State,
  type Store,
  type StoreApi,
  createWizardStore,
} from "./store";

export const Context = createContext<StoreApi | undefined>(undefined);

export const Provider = ({
  children,
  config,
}: {
  children: ReactNode;
  config: Pick<State, "activeStep" | "stepCount">;
}) => {
  const storeRef = useRef<StoreApi>();
  if (!storeRef.current) {
    storeRef.current = createWizardStore(config);
  }

  return (
    <Context.Provider value={storeRef.current}>{children}</Context.Provider>
  );
};

export const useWizard = <T,>(
  selector: (store: Store & { isFirstStep: boolean; isLastStep: boolean }) => T
) => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider");
  }
  return useStore(
    context,
    useShallow((store) => {
      const extended = {
        ...store,
        isFirstStep: store.activeStep === 0,
        isLastStep: store.activeStep >= store.stepCount - 1,
      };

      return selector(extended);
    })
  );
};

/**
 * Internal component to notify when the active step changes.
 */
export const StepChangeNotifier = ({
  onStepChange,
}: { onStepChange: (step: number) => void }) => {
  const activeStep = useWizard((state) => state.activeStep);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onStepChange(activeStep);
  }, [activeStep, onStepChange]);

  return null;
};

/**
 * Internal component to sync stepCount when children change dynamically.
 * This handles cases where steps are conditionally skipped.
 */
export const StepCountSync = ({ stepCount }: { stepCount: number }) => {
  const { currentStepCount, setStepCount, activeStep, setActiveStep } =
    useWizard((state) => ({
      currentStepCount: state.stepCount,
      setStepCount: state.setStepCount,
      activeStep: state.activeStep,
      setActiveStep: state.setActiveStep,
    }));

  useEffect(() => {
    if (stepCount !== currentStepCount) {
      setStepCount(stepCount);
      // If current step is now out of bounds, clamp it
      if (activeStep >= stepCount) {
        setActiveStep(Math.max(0, stepCount - 1));
      }
    }
  }, [stepCount, currentStepCount, setStepCount, activeStep, setActiveStep]);

  return null;
};
