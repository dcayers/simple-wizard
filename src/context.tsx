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

type WizardSelector<T> = (
  store: Store & { isFirstStep: boolean; isLastStep: boolean }
) => T;

function selectSnapshot<T>(
  store: StoreApi,
  selector: WizardSelector<T>,
  cacheRef: { current: T | undefined }
): T {
  const state = store.getState();
  const next = selector({
    ...state,
    isFirstStep: state.activeStep === 0,
    isLastStep: state.activeStep >= state.stepCount - 1,
  });
  if (shallowEqual(cacheRef.current, next)) {
    return cacheRef.current as T;
  }
  cacheRef.current = next;
  return next;
}

export const useWizard = <T,>(selector: WizardSelector<T>) => {
  const store = useContext(Context);
  if (!store) {
    throw new Error("useWizard must be used within a WizardProvider");
  }

  const clientCacheRef = useRef<T>();
  const serverCacheRef = useRef<T>();

  return useSyncExternalStore(
    store.subscribe,
    () => selectSnapshot(store, selector, clientCacheRef),
    () => selectSnapshot(store, selector, serverCacheRef)
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
  const store = useContext(Context);
  const currentStepCount = useWizard((state) => state.stepCount);

  useEffect(() => {
    if (store && stepCount !== currentStepCount) {
      const { activeStep } = store.getState();
      store.setState({
        stepCount,
        activeStep: Math.min(
          Math.max(0, activeStep),
          Math.max(0, stepCount - 1)
        ),
      });
    }
  }, [store, stepCount, currentStepCount]);

  return null;
};
