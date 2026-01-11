# simple-wizard

A lightweight, flexible wizard component for React 18 and 19.

## Installation

```bash
npm install @d1os/simple-wizard
```

```bash
yarn add @d1os/simple-wizard
```

```bash
pnpm add @d1os/simple-wizard
```

## Quick Start

```tsx
import { Wizard, useWizard } from "@d1os/simple-wizard";

function App() {
  return (
    <Wizard footer={<WizardFooter />}>
      <StepOne />
      <StepTwo />
      <StepThree />
    </Wizard>
  );
}

function WizardFooter() {
  const { nextStep, previousStep, activeStep, stepCount } = useWizard((state) => ({
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    activeStep: state.activeStep,
    stepCount: state.stepCount,
  }));

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === stepCount - 1;

  return (
    <div>
      <button onClick={() => previousStep()} disabled={isFirstStep}>
        Back
      </button>
      <button onClick={() => nextStep()} disabled={isLastStep}>
        {isLastStep ? "Finish" : "Next"}
      </button>
    </div>
  );
}
```

## API

### `<Wizard />`

The main container component.

```tsx
interface WizardProps {
  children?: ReactNode;    // Step components
  header?: ReactNode;      // Rendered before steps
  footer?: ReactNode;      // Rendered after steps
  startAtEnd?: boolean;    // Start at last step (default: false)
  initialStep?: number;    // Starting step index (default: 0)
}
```

### `useWizard(selector)`

Hook to access wizard state and actions. Uses selectors for optimal re-renders.

```tsx
const { activeStep, nextStep } = useWizard((state) => ({
  activeStep: state.activeStep,
  nextStep: state.nextStep,
}));
```

#### State

| Property | Type | Description |
|----------|------|-------------|
| `activeStep` | `number` | Current step index (0-based) |
| `stepCount` | `number` | Total number of steps |
| `isLoading` | `boolean` | Loading state during async actions |
| `nextButtonLabel` | `string` | Label for next button (default: "Next") |
| `previousButtonLabel` | `string` | Label for previous button (default: "Back") |
| `isNextButtonDisabled` | `boolean` | Whether next button is disabled |

#### Actions

| Action | Type | Description |
|--------|------|-------------|
| `nextStep(skip?)` | `(skip?: number) => void` | Go to next step (or skip multiple) |
| `previousStep(skip?)` | `(skip?: number) => void` | Go to previous step (or skip multiple) |
| `setActiveStep(step)` | `(step: number) => void` | Jump to specific step |
| `setIsLoading(loading)` | `(loading: boolean) => void` | Set loading state |
| `setStepAction(handler)` | `(handler: () => void \| Promise<void>) => void` | Set action to run before advancing |
| `setNextButtonLabel(label)` | `(label: string) => void` | Set next button label |
| `setPreviousButtonLabel(label)` | `(label: string) => void` | Set previous button label |
| `setNextButtonDisabled(disabled)` | `(disabled: boolean) => void` | Disable/enable next button |

## Examples

### Async Step Validation

Run async validation before advancing to the next step:

```tsx
function StepWithValidation() {
  const { setStepAction } = useWizard((state) => ({
    setStepAction: state.setStepAction,
  }));

  useEffect(() => {
    setStepAction(async () => {
      await saveFormData();
      // If this throws, navigation is cancelled
    });
  }, [setStepAction]);

  return <form>...</form>;
}
```

### Skip Steps Conditionally

Use the `skip` prop to conditionally skip steps:

```tsx
<Wizard>
  <StepOne />
  <StepTwo skip={!showOptionalStep} />
  <StepThree />
</Wizard>
```

### Custom Progress Indicator

```tsx
function ProgressBar() {
  const { activeStep, stepCount } = useWizard((state) => ({
    activeStep: state.activeStep,
    stepCount: state.stepCount,
  }));

  const progress = ((activeStep + 1) / stepCount) * 100;

  return (
    <div className="progress-bar">
      <div className="progress-fill" style={{ width: `${progress}%` }} />
      <span>{activeStep + 1} of {stepCount}</span>
    </div>
  );
}

// Usage
<Wizard header={<ProgressBar />}>
  ...
</Wizard>
```

### Controlled Navigation

```tsx
function StepButtons() {
  const { activeStep, stepCount, setActiveStep } = useWizard((state) => ({
    activeStep: state.activeStep,
    stepCount: state.stepCount,
    setActiveStep: state.setActiveStep,
  }));

  return (
    <div className="step-buttons">
      {Array.from({ length: stepCount }, (_, i) => (
        <button
          key={i}
          onClick={() => setActiveStep(i)}
          className={activeStep === i ? "active" : ""}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
```

## Using with Form Libraries

`simple-wizard` is form-library agnostic. You can use it with any form library you like, such as `react-hook-form`, `formik`, `@tanstack/react-form`, etc. 

Use `setStepAction()` to integrate validation:

### Using `react-hook-form`

```tsx
import { useForm } from "react-hook-form";

function StepWithValidation() {
  const { register, trigger } = useForm();
  const { setStepAction } = useWizard((state) => ({
    setStepAction: state.setStepAction,
  }));


  useEffect(() => {
    setStepAction(async () => {
      const valid = await trigger();
      if (!valid) {
        throw new Error("Form is invalid");
      }
    });
  }, [setStepAction, trigger]);

  return (
    <input {...register("email", { required: true })} placeholder="Email" />
  );
}
```


### Using `@tanstack/react-form`

```tsx
import { useForm } from "@tanstack/react-form";

function StepWithValidation() {
  const form = useForm({
    defaultValues: {
      email: "",
    },
  });
  const { setStepAction } = useWizard((state) => ({
    setStepAction: state.setStepAction,
  }));

  useEffect(() => {
    setStepAction(async () => {
      await form.validateAllFields("change");
      if (!form.state.isFormValid) {
        throw new Error("Form is invalid");
      }
    });
  }, [setStepAction, form]);

  return (
    <form.Field name="email">
      {({ field }) => (
        <input {...field.getInputProps()} placeholder="Email" />
      )}
    </form.Field>
  )
}
```

A more advanced example using `@tanstack/react-form` can be found in [this stackblitz](https://stackblitz.com/edit/example-d1os-wizard-rhf-ttsg3fvk).

## React 19 Best Practices

This library is fully compatible with React 19. Here are patterns to leverage React 19 features in your step components:

### Using `use()` for Data Fetching

```tsx
import { use, Suspense } from "react";

function StepWithData({ dataPromise }) {
  const data = use(dataPromise);
  return <div>{data.content}</div>;
}

// In your wizard
<Wizard>
  <Suspense fallback={<Loading />}>
    <StepWithData dataPromise={fetchStepData()} />
  </Suspense>
</Wizard>
```

### Optimistic Updates with `useOptimistic()`

```tsx
import { useOptimistic, useState } from "react";

function StepWithOptimisticSave() {
  const [saved, setSaved] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);

  async function handleSave() {
    setOptimisticSaved(true);  // Instant UI feedback
    await saveToServer();
    setSaved(true);
  }

  return (
    <div>
      <button onClick={handleSave}>
        {optimisticSaved ? "Saved!" : "Save"}
      </button>
    </div>
  );
}
```

### Form Actions with `useActionState()`

```tsx
import { useActionState } from "react";

function FormStep() {
  const [state, submitAction, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await submitForm(formData);
      return { success: result.ok, error: result.error };
    },
    { success: false, error: null }
  );

  return (
    <form action={submitAction}>
      <input name="email" type="email" required />
      {state.error && <p className="error">{state.error}</p>}
      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Continue"}
      </button>
    </form>
  );
}
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  WizardProps,
  WizardStore,
  WizardState,
  WizardActions
} from "@d1os/simple-wizard";
```

## License

MIT
