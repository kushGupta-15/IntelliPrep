"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import toast from "react-hot-toast";
import { CheckCircle, Zap, Star, Crown, ArrowLeft } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useRouter } from "next/navigation";

const PLANS = [
    {
        id: "basic",
        name: "Basic",
        icon: Zap,
        iconColor: "text-blue-500",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        price: 99,
        credits: 10,
        popular: false,
        features: [
            "10 course credits",
            "All study material types",
            "Notes, Flashcards & Quizzes",
            "Valid forever",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        icon: Star,
        iconColor: "text-purple-500",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-400",
        price: 199,
        credits: 25,
        popular: true,
        features: [
            "25 course credits",
            "All study material types",
            "Notes, Flashcards & Quizzes",
            "Priority generation",
            "Valid forever",
        ],
    },
    {
        id: "premium",
        name: "Premium",
        icon: Crown,
        iconColor: "text-yellow-500",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-300",
        price: 349,
        credits: 50,
        popular: false,
        features: [
            "50 course credits",
            "All study material types",
            "Notes, Flashcards & Quizzes",
            "Priority generation",
            "Best value per credit",
            "Valid forever",
        ],
    },
];

export default function UpgradePage() {
    const { user } = useUser();
    const router = useRouter();
    const [currentCredits, setCurrentCredits] = useState(null);
    const [loadingPlan, setLoadingPlan] = useState(null);

    useEffect(() => {
        if (user?.primaryEmailAddress?.emailAddress) {
            fetchCredits();
        }
    }, [user]);

    const fetchCredits = async () => {
        try {
            const res = await axios.get(
                `/api/user/credits?email=${user.primaryEmailAddress.emailAddress}`
            );
            setCurrentCredits(res.data.credits);
        } catch (e) {
            console.error("Failed to fetch credits:", e);
        }
    };

    const handleBuy = async (plan) => {
        if (!user) {
            toast.error("Please sign in first");
            return;
        }

        setLoadingPlan(plan.id);

        try {
            // 1. Create Razorpay order
            const { data } = await axios.post("/api/payment/create-order", {
                planId: plan.id,
                email: user.primaryEmailAddress.emailAddress,
            });

            // 2. Load Razorpay checkout script
            await loadRazorpayScript();

            // 3. Open Razorpay checkout
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "IntelliPrep",
                description: `${plan.name} Plan — ${plan.credits} Credits`,
                order_id: data.orderId,
                prefill: {
                    name: user.fullName || "",
                    email: user.primaryEmailAddress.emailAddress,
                },
                theme: { color: "#2563EB" },
                handler: async (response) => {
                    // 4. Verify payment on server
                    try {
                        const verify = await axios.post("/api/payment/verify", {
                            razorpay_order_id:   response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature:  response.razorpay_signature,
                            email:   user.primaryEmailAddress.emailAddress,
                            credits: plan.credits,
                        });

                        if (verify.data.success) {
                            toast.success(`🎉 ${plan.credits} credits added to your account!`);
                            setCurrentCredits(verify.data.credits);
                        }
                    } catch (err) {
                        toast.error("Payment verification failed. Contact support.");
                        console.error("Verify error:", err);
                    }
                },
                modal: {
                    ondismiss: () => {
                        toast("Payment cancelled", { icon: "ℹ️" });
                    },
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            console.error("Payment error:", err);
            toast.error(err?.response?.data?.error || "Failed to initiate payment");
        } finally {
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push("/dashboard")}
                        className="mb-4 text-gray-600"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>

                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Buy Credits
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Each credit lets you generate one complete course with notes, flashcards &amp; quizzes.
                        </p>
                        {currentCredits !== null && (
                            <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-medium">
                                <Zap className="w-4 h-4" />
                                You currently have {currentCredits} credit{currentCredits !== 1 ? "s" : ""}
                            </div>
                        )}
                    </div>
                </div>

                {/* Plans */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {PLANS.map((plan) => {
                        const Icon = plan.icon;
                        return (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-2xl border-2 ${plan.borderColor} shadow-sm p-6 flex flex-col transition-shadow hover:shadow-lg`}
                            >
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                        <span className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                            MOST POPULAR
                                        </span>
                                    </div>
                                )}

                                {/* Icon + Name */}
                                <div className={`w-12 h-12 ${plan.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                                    <Icon className={`w-6 h-6 ${plan.iconColor}`} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h2>

                                {/* Price */}
                                <div className="mb-4">
                                    <span className="text-4xl font-extrabold text-gray-900">₹{plan.price}</span>
                                    <span className="text-gray-400 ml-1 text-sm">one-time</span>
                                    <div className="text-sm text-gray-500 mt-1">
                                        ₹{(plan.price / plan.credits).toFixed(1)} per credit
                                    </div>
                                </div>

                                {/* Credits badge */}
                                <div className={`${plan.bgColor} rounded-lg px-3 py-2 text-center mb-5`}>
                                    <span className={`font-bold text-lg ${plan.iconColor}`}>
                                        {plan.credits} Credits
                                    </span>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-6 flex-1">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={() => handleBuy(plan)}
                                    disabled={loadingPlan === plan.id}
                                    className={`w-full ${
                                        plan.popular
                                            ? "bg-purple-600 hover:bg-purple-700 text-white"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {loadingPlan === plan.id ? "Processing..." : `Buy ${plan.credits} Credits`}
                                </Button>
                            </div>
                        );
                    })}
                </div>

                {/* Security note */}
                <p className="text-center text-xs text-gray-400 mt-8">
                    🔒 Payments are securely processed by Razorpay. We never store your card details.
                </p>
            </div>
        </div>
    );
}

// Dynamically loads the Razorpay checkout script
function loadRazorpayScript() {
    return new Promise((resolve) => {
        if (window.Razorpay) return resolve();
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = resolve;
        document.body.appendChild(script);
    });
}
