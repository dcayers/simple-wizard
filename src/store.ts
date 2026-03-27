export interface State {
  activeStep: number;
  stepCount: number;
  isLoading: boolean;
  stepAction: (() => Promise<void>) | (() => void);
  nextButtonLabel?: string;
  previousButtonLabel?: string;
  isNextButtonDisabled?: boolean;
}

export interface Actions {
  nextStep: (skip?: number) => void;
  previousStep: (skip?: number) => void;
  setIsLoading: (isLoading: boolean) => void;
  setActiveStep: (activeStep: number) => void;
  setStepCount: (stepCount: number) => void;
  setStepAction: (handler: (() => Promise<void>) | (() => void)) => void;
  setNextButtonLabel: (label: string) => void;
  setPreviousButtonLabel: (label: string) => void;
  setNextButtonDisabled: (disabled: boolean) => void;
}

export type Store = State & Actions;

const DEFAULT_STEP_ACTION = () => {};

function isPromise(value: unknown): value is Promise<void> {
  return value instanceof Promise;
}

export interface StoreApi {
  getState: () => Store;
  setState: (partial: Partial<State>) => void;
  subscribe: (listener: () => void) => () => void;
}

export const createWizardStore = (
  initialState: Partial<State> = {}
): StoreApi => {
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  const setState = (partial: Partial<State>) => {
    state = { ...state, ...partial };
    notify();
  };

  const getState = () => state;

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  let state: Store = {
    activeStep: 0,
    stepCount: 0,
    isLoading: false,
    nextButtonLabel: "Next",
    previousButtonLabel: "Back",
    isNextButtonDisabled: false,
    stepAction: DEFAULT_STEP_ACTION,
    ...initialState,
    nextStep: (skip = 1) => {
      const current = getState();
      if (current.activeStep < current.stepCount - skip) {
        const result = current.stepAction();
        if (isPromise(result)) {
          setState({ isLoading: true });
          result
            .then(() => {
              const s = getState();
              setState({
                activeStep: s.activeStep + skip,
                stepAction: DEFAULT_STEP_ACTION,
              });
            })
            .catch((error) => {
              console.error("Error in stepAction:", error);
            })
            .finally(() => {
              setState({ isLoading: false });
            });
        } else {
          setState({
            activeStep: current.activeStep + skip,
            stepAction: DEFAULT_STEP_ACTION,
          });
        }
      }
    },
    previousStep: (skip = 1) => {
      const current = getState();
      if (current.activeStep - skip >= 0) {
        setState({
          activeStep: current.activeStep - skip,
          stepAction: DEFAULT_STEP_ACTION,
        });
      }
    },
    setStepAction: (handler) => {
      setState({ stepAction: handler } as Partial<State>);
    },
    setIsLoading: (isLoading) => setState({ isLoading }),
    setActiveStep: (activeStep) => setState({ activeStep }),
    setStepCount: (stepCount) => setState({ stepCount }),
    setNextButtonLabel: (nextButtonLabel) => setState({ nextButtonLabel }),
    setPreviousButtonLabel: (previousButtonLabel) =>
      setState({ previousButtonLabel }),
    setNextButtonDisabled: (isNextButtonDisabled) =>
      setState({ isNextButtonDisabled }),
  };

  return { getState, setState, subscribe };
};
