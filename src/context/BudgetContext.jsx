import React, { createContext, useState, useEffect } from "react";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch budget info (totalIncome, allocations, sessionId)
    const fetchBudget = async () => {
        try {
            setLoading(true);
            const response = await fetch("http://localhost:5000/api/budget", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch budget");

            const data = await response.json();
            setBudget({
                totalIncome: data.totalIncome,
                allocations: data.allocations,
                sessionId: data.sessionId,
            });
        } catch (error) {
            console.error("Failed to fetch budget:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update the budget (allocations + totalIncome)
    const updateBudget = async (newBudget) => {
        try {
            // Convert object { category: amount } into array for backend
            const allocationsArray = Array.isArray(newBudget.allocations)
                ? newBudget.allocations
                : Object.entries(newBudget.allocations).map(([category, amount_allocated]) => ({
                    category,
                    amount_allocated: Number(amount_allocated),
                }));

            const response = await fetch("http://localhost:5000/api/budget", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    allocations: allocationsArray,
                    totalIncome: Number(newBudget.totalIncome),
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                }),
            });

            if (!response.ok) throw new Error("Failed to update budget");

            await fetchBudget(); // Refetch after saving
        } catch (error) {
            console.error("Error updating budget:", error);
        }
    };

    useEffect(() => {
        fetchBudget();
    }, []);

    return (
        <BudgetContext.Provider value={{ budget, updateBudget, loading }}>
            {children}
        </BudgetContext.Provider>
    );
};
