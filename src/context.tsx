"use client";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
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

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  )
    return false;
  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(b, key) ||
      !Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
      return false;
  }
  return true;
}

export const useWizard = <T,>(
  selector: (store: Store & { isFirstStep: boolean; isLastStep: boolean }) => T
) => {
  const store = useContext(Context);
  if (!store) {
    throw new Error("useWizard must be used within a WizardProvider");
  }

  const cachedRef = useRef<T>();

  return useSyncExternalStore(store.subscribe, () => {
    const state = store.getState();
    const next = selector({
      ...state,
      isFirstStep: state.activeStep === 0,
      isLastStep: state.activeStep >= state.stepCount - 1,
    });
    if (shallowEqual(cachedRef.current, next)) {
      return cachedRef.current as T;
    }
    cachedRef.current = next;
    return next;
  });
};

/**
 * Internal component to notify when the active step changes.
 */
export const StepChangeNotifier = ({
  onStepChange,
}: { onStepChange: (step: number) => void }) => {
  const activeStep = useWizard((state) => state.activeStep);
  const isFirstRender = useRef(true);
  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onStepChangeRef.current(activeStep);
  }, [activeStep]);

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
