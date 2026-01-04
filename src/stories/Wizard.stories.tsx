import type { Meta, StoryObj } from "@storybook/react";
import { useEffect, useState } from "react";
import { Wizard, useWizard } from "../index";

const meta: Meta<typeof Wizard> = {
  title: "Wizard",
  component: Wizard,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Wizard>;

// ============================================================================
// Step Components
// ============================================================================

function StepOne() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Step 1: Welcome</h2>
      <p className="text-gray-600">
        This is the first step of the wizard. Click Next to continue.
      </p>
    </div>
  );
}

function StepTwo() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Step 2: Details</h2>
      <p className="text-gray-600">
        Enter your details here. This is the second step.
      </p>
      <input
        type="text"
        placeholder="Your name"
        className="mt-4 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function StepThree() {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Step 3: Confirmation</h2>
      <p className="text-gray-600">
        Review your information and confirm to complete the wizard.
      </p>
    </div>
  );
}

// ============================================================================
// Footer Components
// ============================================================================

function BasicFooter() {
  const { nextStep, previousStep, activeStep, stepCount } = useWizard(
    (state) => ({
      nextStep: state.nextStep,
      previousStep: state.previousStep,
      activeStep: state.activeStep,
      stepCount: state.stepCount,
    })
  );

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === stepCount - 1;

  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={() => previousStep()}
        disabled={isFirstStep}
        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back
      </button>
      <button
        onClick={() => nextStep()}
        disabled={isLastStep}
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLastStep ? "Finish" : "Next"}
      </button>
    </div>
  );
}

function ProgressHeader() {
  const { activeStep, stepCount } = useWizard((state) => ({
    activeStep: state.activeStep,
    stepCount: state.stepCount,
  }));

  const progress = ((activeStep + 1) / stepCount) * 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-gray-600 mb-2">
        <span>
          Step {activeStep + 1} of {stepCount}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function StepIndicator() {
  const { activeStep, stepCount, setActiveStep } = useWizard((state) => ({
    activeStep: state.activeStep,
    stepCount: state.stepCount,
    setActiveStep: state.setActiveStep,
  }));

  return (
    <div className="flex justify-center gap-2 mb-6">
      {Array.from({ length: stepCount }, (_, i) => (
        <button
          key={i}
          onClick={() => setActiveStep(i)}
          className={`w-10 h-10 rounded-full font-medium transition-colors ${activeStep === i
            ? "bg-blue-600 text-white"
            : activeStep > i
              ? "bg-green-500 text-white"
              : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// Stories
// ============================================================================

export const Basic: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard footer={<BasicFooter />}>
        <StepOne />
        <StepTwo />
        <StepThree />
      </Wizard>
    </div>
  ),
};

export const WithProgressBar: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard header={<ProgressHeader />} footer={<BasicFooter />}>
        <StepOne />
        <StepTwo />
        <StepThree />
      </Wizard>
    </div>
  ),
};

export const WithStepIndicator: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard header={<StepIndicator />} footer={<BasicFooter />}>
        <StepOne />
        <StepTwo />
        <StepThree />
      </Wizard>
    </div>
  ),
};

export const StartAtEnd: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard header={<ProgressHeader />} footer={<BasicFooter />} startAtEnd>
        <StepOne />
        <StepTwo />
        <StepThree />
      </Wizard>
    </div>
  ),
};

export const InitialStep: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard
        header={<ProgressHeader />}
        footer={<BasicFooter />}
        initialStep={1}
      >
        <StepOne />
        <StepTwo />
        <StepThree />
      </Wizard>
    </div>
  ),
};

// ============================================================================
// Async Validation Story
// ============================================================================

function AsyncStep() {
  const { setStepAction, isLoading } = useWizard((state) => ({
    setStepAction: state.setStepAction,
    isLoading: state.isLoading,
  }));

  useEffect(() => {
    setStepAction(async () => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
    });
  }, [setStepAction]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Async Validation Step</h2>
      <p className="text-gray-600">
        This step simulates an async validation. Click Next to see the loading
        state.
      </p>
      {isLoading && (
        <div className="mt-4 flex items-center gap-2 text-blue-600">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Validating...</span>
        </div>
      )}
    </div>
  );
}

function AsyncFooter() {
  const { nextStep, previousStep, activeStep, stepCount, isLoading } =
    useWizard((state) => ({
      nextStep: state.nextStep,
      previousStep: state.previousStep,
      activeStep: state.activeStep,
      stepCount: state.stepCount,
      isLoading: state.isLoading,
    }));

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === stepCount - 1;

  return (
    <div className="flex justify-between mt-6">
      <button
        onClick={() => previousStep()}
        disabled={isFirstStep || isLoading}
        className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Back
      </button>
      <button
        onClick={() => nextStep()}
        disabled={isLastStep || isLoading}
        className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Loading..." : isLastStep ? "Finish" : "Next"}
      </button>
    </div>
  );
}

export const AsyncValidation: Story = {
  render: () => (
    <div className="w-[500px]">
      <Wizard header={<ProgressHeader />} footer={<AsyncFooter />}>
        <StepOne />
        <AsyncStep />
        <StepThree />
      </Wizard>
    </div>
  ),
};

// ============================================================================
// Skip Steps Story
// ============================================================================

function SkippableStep({ skip }: { skip: boolean }) {
  return (
    <div className="p-6 bg-yellow-50 rounded-lg shadow-sm border border-yellow-200">
      <h2 className="text-xl font-semibold mb-4">
        Step 2: Optional Details
      </h2>
      <p className="text-gray-600">
        This step is optional and can be skipped.
      </p>
    </div>
  );
}

function SkipStepsDemo() {
  const [showOptional, setShowOptional] = useState(true);

  return (
    <div className="w-[500px]">
      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showOptional}
            onChange={(e) => setShowOptional(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-yellow-800">
            Show optional step (Step 2)
          </span>
        </label>
      </div>
      <Wizard header={<ProgressHeader />} footer={<BasicFooter />}>
        <StepOne />
        <SkippableStep skip={!showOptional} />
        <StepThree />
      </Wizard>
    </div>
  );
}

export const SkipSteps: Story = {
  render: () => <SkipStepsDemo />,
};
