import { submitKyc } from "@/api/verification"
import { useMutation } from "@tanstack/react-query"

export const useSubmitKycMutation = () => {
    return useMutation({
        mutationKey: ["kycVerification"],
        mutationFn: ({ panName, panNumber, DOB }: { panName: string, panNumber: string, DOB: string }) => submitKyc(panName, panNumber, DOB)
    })
}