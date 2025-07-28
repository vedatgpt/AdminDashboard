import { useMutation } from "@tanstack/react-query";

/**
 * Common step completion hook for all create-listing steps
 * Handles the repeated step completion marking pattern
 */
export function useStepCompletion() {
  const markStepCompletedMutation = useMutation({
    mutationFn: async ({
      classifiedId,
      step,
    }: {
      classifiedId: number | string;
      step: number;
    }) => {
      const response = await fetch(
        `/api/draft-listings/${classifiedId}/step/${step}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      if (!response.ok) throw new Error("Step completion update failed");
      return response.json();
    },
  });

  return { markStepCompletedMutation };
}
