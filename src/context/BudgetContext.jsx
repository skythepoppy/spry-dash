import React, { createContext, useState, useEffect } from "react";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch budget info (total, remaining, etc.)
    const fetchBudget = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/budget", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch budget");

            const data = await response.json();
            setBudget(data);
        } catch (error) {
            console.error("Failed to fetch budget:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update the budget
    const updateBudget = async (newBudget) => {
        try {
            const response = await fetch("http://localhost:5000/api/budget", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    allocations: newBudget.allocations,
                    income: newBudget.totalIncome,
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                }),
            });

            if (!response.ok) throw new Error("Failed to update budget");

            const data = await response.json();
            setBudget(data);
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
