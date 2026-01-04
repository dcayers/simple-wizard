import { createStore, type StateCreator } from "zustand/vanilla";
import { immer } from "zustand/middleware/immer";

type Mutators = [["zustand/immer", never]];

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

const DEFAULT_STEP_ACTION = () => { };

function isPromise(value: unknown): value is Promise<void> {
  return value instanceof Promise;
}

const createStateSlice: StateCreator<Store, Mutators, [], Store> = (
  set,
  get,
) => ({
  activeStep: 0,
  stepCount: 0,
  isLoading: false,
  nextButtonLabel: "Next",
  previousButtonLabel: "Back",
  isNextButtonDisabled: false,
  stepAction: DEFAULT_STEP_ACTION,
  nextStep: (skip = 1) => {
    const state = get();
    if (state.activeStep < state.stepCount - skip) {
      const result = state.stepAction();
      if (isPromise(result)) {
        set({ isLoading: true });
        result
          .then(() => {
            set((state) => {
              state.activeStep += skip;
              state.stepAction = DEFAULT_STEP_ACTION;
            });
          })
          .catch((error) => {
            console.error("Error in stepAction:", error);
          }).finally(() => {
            set({ isLoading: false });
          });
      } else {
        set((state) => {
          state.activeStep += skip;
          state.stepAction = DEFAULT_STEP_ACTION;
        });
      }
    }
  },
  previousStep: (skip = 1) =>
    set((state) => {
      if (state.activeStep - skip >= 0) {
        state.stepAction = DEFAULT_STEP_ACTION;
        state.activeStep -= skip;
      }
    }),
  setStepAction: (handler) => {
    set((state) => {
      state.stepAction = handler;
    });
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setActiveStep: (activeStep) => set({ activeStep }),
  setStepCount: (stepCount) => set({ stepCount }),
  setNextButtonLabel: (nextButtonLabel) => set({ nextButtonLabel }),
  setPreviousButtonLabel: (previousButtonLabel) => set({ previousButtonLabel }),
  setNextButtonDisabled: (isNextButtonDisabled) =>
    set({ isNextButtonDisabled }),
});

export const createWizardStore = (initialState = {}) =>
  createStore(
    immer<Store>((...args) => ({
      ...createStateSlice(...args),
      ...(initialState as State),
    })),
  );

export type StoreApi = ReturnType<typeof createWizardStore>;
