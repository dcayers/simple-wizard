import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { Wizard, useWizard } from "./index";

// =============================================================================
// Test Helpers
// =============================================================================

function NavigationFooter() {
  const { nextStep, previousStep, activeStep, stepCount, isLoading } = useWizard((state) => ({
    nextStep: state.nextStep,
    previousStep: state.previousStep,
    activeStep: state.activeStep,
    stepCount: state.stepCount,
    isLoading: state.isLoading,
  }));

  const isFirstStep = activeStep === 0;
  const isLastStep = activeStep === stepCount - 1;

  return (
    <div>
      <button onClick={() => previousStep()} disabled={isFirstStep}>
        Back
      </button>
      <button onClick={() => nextStep()} disabled={isLastStep || isLoading}>
        {isLoading ? "Loading..." : "Next"}
      </button>
      <span data-testid="step-indicator">
        Step {activeStep + 1} of {stepCount}
      </span>
    </div>
  );
}

function JumpToStepFooter() {
  const { setActiveStep, stepCount } = useWizard((state) => ({
    setActiveStep: state.setActiveStep,
    stepCount: state.stepCount,
  }));

  return (
    <div>
      {Array.from({ length: stepCount }, (_, i) => (
        <button key={i} onClick={() => setActiveStep(i)}>
          Go to Step {i + 1}
        </button>
      ))}
    </div>
  );
}

function AsyncStepAction({ onAction }: { onAction: () => Promise<void> }) {
  const { setStepAction } = useWizard((state) => ({
    setStepAction: state.setStepAction,
  }));

  // Set the async action on mount
  useState(() => {
    setStepAction(onAction);
  });

  return <div>Async Step</div>;
}

// =============================================================================
// Basic Rendering Tests
// =============================================================================

describe("Wizard", () => {
  describe("rendering", () => {
    it("renders the first step by default", () => {
      render(
        <Wizard>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
      expect(screen.queryByText("Step 2 Content")).not.toBeInTheDocument();
      expect(screen.queryByText("Step 3 Content")).not.toBeInTheDocument();
    });

    it("renders header and footer", () => {
      render(
        <Wizard
          header={<div>Header Content</div>}
          footer={<div>Footer Content</div>}
        >
          <div>Step 1</div>
        </Wizard>
      );

      expect(screen.getByText("Header Content")).toBeInTheDocument();
      expect(screen.getByText("Footer Content")).toBeInTheDocument();
    });

    it("starts at specified initialStep", () => {
      render(
        <Wizard initialStep={1}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.queryByText("Step 1 Content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
    });

    it("starts at end when startAtEnd is true", () => {
      render(
        <Wizard startAtEnd>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.queryByText("Step 1 Content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // Navigation Tests
  // ===========================================================================

  describe("navigation", () => {
    it("navigates to next step when nextStep is called", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<NavigationFooter />}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();

      await user.click(screen.getByText("Next"));

      expect(screen.queryByText("Step 1 Content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
    });

    it("navigates to previous step when previousStep is called", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<NavigationFooter />} initialStep={2}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 3 Content")).toBeInTheDocument();

      await user.click(screen.getByText("Back"));

      expect(screen.queryByText("Step 3 Content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 2 Content")).toBeInTheDocument();
    });

    it("jumps to specific step when setActiveStep is called", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<JumpToStepFooter />}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();

      await user.click(screen.getByText("Go to Step 3"));

      expect(screen.queryByText("Step 1 Content")).not.toBeInTheDocument();
      expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
    });

    it("does not navigate past the last step", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<NavigationFooter />} initialStep={2}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
          <div>Step 3 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeDisabled();

      // Try clicking anyway (button is disabled but let's verify state doesn't change)
      await user.click(screen.getByText("Next"));

      expect(screen.getByText("Step 3 Content")).toBeInTheDocument();
    });

    it("does not navigate before the first step", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<NavigationFooter />}>
          <div>Step 1 Content</div>
          <div>Step 2 Content</div>
        </Wizard>
      );

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
      expect(screen.getByText("Back")).toBeDisabled();

      await user.click(screen.getByText("Back"));

      expect(screen.getByText("Step 1 Content")).toBeInTheDocument();
    });

    it("reports correct step count", () => {
      render(
        <Wizard footer={<NavigationFooter />}>
          <div>Step 1</div>
          <div>Step 2</div>
          <div>Step 3</div>
          <div>Step 4</div>
        </Wizard>
      );

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 4");
    });

    it("updates step indicator as navigation occurs", async () => {
      const user = userEvent.setup();

      render(
        <Wizard footer={<NavigationFooter />}>
          <div>Step 1</div>
          <div>Step 2</div>
          <div>Step 3</div>
        </Wizard>
      );

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 3");

      await user.click(screen.getByText("Next"));
      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 2 of 3");

      await user.click(screen.getByText("Next"));
      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 3 of 3");
    });
  });

  // ===========================================================================
  // Skip Steps Tests
  // ===========================================================================

  describe("skip steps", () => {
    function SkippableWizard({ skipMiddle }: { skipMiddle: boolean }) {
      return (
        <Wizard footer={<NavigationFooter />}>
          <div>Step 1 Content</div>
          <div skip={skipMiddle || undefined}>Step 2 Content (Skippable)</div>
          <div>Step 3 Content</div>
        </Wizard>
      );
    }

    it("skips steps with skip prop", () => {
      render(<SkippableWizard skipMiddle={true} />);

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 2");
    });

    it("includes steps without skip prop", () => {
      render(<SkippableWizard skipMiddle={false} />);

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 3");
    });

    it("updates step count when skip prop changes dynamically", async () => {
      const user = userEvent.setup();

      function DynamicSkipWizard() {
        const [skipMiddle, setSkipMiddle] = useState(false);

        return (
          <div>
            <button onClick={() => setSkipMiddle(!skipMiddle)}>
              Toggle Skip
            </button>
            <Wizard footer={<NavigationFooter />}>
              <div>Step 1</div>
              <div skip={skipMiddle || undefined}>Step 2 (Skippable)</div>
              <div>Step 3</div>
            </Wizard>
          </div>
        );
      }

      render(<DynamicSkipWizard />);

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 3");

      await user.click(screen.getByText("Toggle Skip"));

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 2");

      await user.click(screen.getByText("Toggle Skip"));

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 1 of 3");
    });

    it("clamps activeStep when current step is skipped", async () => {
      const user = userEvent.setup();

      function DynamicSkipWizard() {
        const [skipLast, setSkipLast] = useState(false);

        return (
          <div>
            <button onClick={() => setSkipLast(true)}>Skip Last</button>
            <Wizard footer={<NavigationFooter />}>
              <div>Step 1</div>
              <div>Step 2</div>
              <div skip={skipLast || undefined}>Step 3</div>
            </Wizard>
          </div>
        );
      }

      render(<DynamicSkipWizard />);

      // Navigate to step 3
      await user.click(screen.getByText("Next"));
      await user.click(screen.getByText("Next"));

      expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 3 of 3");
      expect(screen.getByText("Step 3")).toBeInTheDocument();

      // Skip step 3 - should clamp to step 2
      await user.click(screen.getByText("Skip Last"));

      await waitFor(() => {
        expect(screen.getByTestId("step-indicator")).toHaveTextContent("Step 2 of 2");
      });
    });
  });

  // ===========================================================================
  // Async Step Action Tests
  // ===========================================================================

  describe("async step actions", () => {
    it("shows loading state during async action", async () => {
      const user = userEvent.setup();

      let resolveAction: () => void;
      const asyncAction = vi.fn(() => new Promise<void>((resolve) => {
        resolveAction = resolve;
      }));

      render(
        <Wizard footer={<NavigationFooter />}>
          <AsyncStepAction onAction={asyncAction} />
          <div>Step 2</div>
        </Wizard>
      );

      expect(screen.getByText("Next")).toBeInTheDocument();

      await user.click(screen.getByText("Next"));

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Loading...")).toBeInTheDocument();
      });

      // Resolve the async action
      resolveAction!();

      // Should navigate to next step
      await waitFor(() => {
        expect(screen.getByText("Step 2")).toBeInTheDocument();
      });
    });

    it("calls async action before navigating", async () => {
      const user = userEvent.setup();
      const asyncAction = vi.fn(() => Promise.resolve());

      render(
        <Wizard footer={<NavigationFooter />}>
          <AsyncStepAction onAction={asyncAction} />
          <div>Step 2</div>
        </Wizard>
      );

      await user.click(screen.getByText("Next"));

      await waitFor(() => {
        expect(asyncAction).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText("Step 2")).toBeInTheDocument();
      });
    });

    it("handles async action errors gracefully", async () => {
      const user = userEvent.setup();
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      const asyncAction = vi.fn(() => Promise.reject(new Error("Test error")));

      render(
        <Wizard footer={<NavigationFooter />}>
          <AsyncStepAction onAction={asyncAction} />
          <div>Step 2</div>
        </Wizard>
      );

      await user.click(screen.getByText("Next"));

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith("Error in stepAction:", expect.any(Error));
      });

      // Should stay on current step after error
      expect(screen.getByText("Async Step")).toBeInTheDocument();
      expect(screen.queryByText("Step 2")).not.toBeInTheDocument();

      consoleError.mockRestore();
    });
  });
});
