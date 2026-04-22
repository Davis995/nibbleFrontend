import { useState } from "react"
import { useAuth } from "@/components/providers/AuthContext"
import { toast } from "react-hot-toast"

interface Plan {
    id: number
    plan_id: string
    name: string
    monthly_price: string
    annual_price: string
    annual_billed: string
    [key: string]: any
}

interface InitiatePaymentParams {
    plan: Plan
    billingPeriod: "monthly" | "annual"
    organisationId?: string | number | null
}

export const usePlanPayment = () => {
    const { tokens, user } = useAuth()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const initiatePlanPayment = async ({ plan, billingPeriod, organisationId }: InitiatePaymentParams) => {
        setIsLoading(true)
        setError(null)

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            
            // Amount should be annual_billed if annual, else monthly_price
            const amount = billingPeriod === "annual" ? plan.annual_billed : plan.monthly_price
            
            if (!amount || parseFloat(amount) <= 0) {
                // If it's a free plan, we might need a different logic, but for now we assume paid upgrades
                toast.error("Invalid plan amount")
                setIsLoading(false)
                return
            }

            const payload: any = {
                payment_type: "subscription",
                amount: parseFloat(amount),
                plan_id: plan.id,
                currency: "UGX", // Default as per backend logic
                email_address: user?.email,
                first_name: user?.first_name || user?.username,
                last_name: user?.last_name || "User",
            }

            // Either user_id or organisation_id (not both)
            if (organisationId) {
                payload.organisation_id = organisationId
            } else if (user?.id) {
                payload.user_id = user.id
            } else {
                throw new Error("User or Organization identification missing")
            }

            // Add payload log for easier debugging
            console.log("Payment initiation payload:", payload)

            const response = await fetch(`${baseUrl}/api/v1/payments/initiate/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
                },
                body: JSON.stringify(payload),
            })

            const responseData = await response.json()
            console.log("Payment initiation response:", responseData)

            if (!response.ok) {
                // Extract error message from DRF field errors or generic error/details
                let errorMessage = "Failed to initiate payment"
                
                if (responseData.error) {
                    errorMessage = responseData.error
                } else if (responseData.details) {
                    errorMessage = responseData.details
                } else if (typeof responseData === 'object') {
                    // Handle DRF field errors: {"field": ["error"]}
                    const firstKey = Object.keys(responseData)[0]
                    if (firstKey && Array.isArray(responseData[firstKey])) {
                        errorMessage = `${firstKey}: ${responseData[firstKey][0]}`
                    } else if (firstKey) {
                        errorMessage = `${firstKey}: ${JSON.stringify(responseData[firstKey])}`
                    }
                }
                
                throw new Error(errorMessage)
            }

            if (responseData.redirect_url) {
                toast.success("Redirecting to Pesapal...")
                window.location.href = responseData.redirect_url
            } else {
                throw new Error("No redirect URL received from payment gateway")
            }
        } catch (err: any) {
            console.error("Payment initiation error:", err)
            const errMsg = err.message || "Something went wrong"
            setError(errMsg)
            toast.error(errMsg)
        } finally {
            setIsLoading(false)
        }
    }

    return {
        initiatePlanPayment,
        isLoading,
        error,
    }
}
