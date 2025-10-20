import React, { createContext, useState, useEffect, useContext } from "react";

export const BudgetContext = createContext();

export const BudgetProvider = ({ children }) => {
    const [budget, setBudget] = useState(null);
    const [loading, setLoading] = useState(true);
    const [unallocatedIncome, setUnallocatedIncome] = useState(0);

    // Fetch current active budget session
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

            // Update to reflect new backend keys
            setBudget({
                sessionId: data.sessionId,
                monthly_income: data.monthly_income || 0,
                unallocated_income: data.unallocated_income || 0,
                allocations: data.allocations || [],
            });

            setUnallocatedIncome(Number(data.unallocated_income || 0));

        } catch (error) {
            console.error("Failed to fetch budget:", error);
        } finally {
            setLoading(false);
        }
    };

    // Update allocations and income
    const updateBudget = async (newBudget) => {
        try {
            const allocationsArray = Array.isArray(newBudget.allocations)
                ? newBudget.allocations
                : Object.entries(newBudget.allocations).map(
                    ([entry_id, amount_allocated]) => ({
                        entry_id,
                        amount_allocated: Number(amount_allocated),
                    })
                );

            const response = await fetch("http://localhost:5000/api/budget", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    allocations: allocationsArray,
                    monthly_income: Number(newBudget.monthly_income),
                }),
            });

            if (!response.ok) throw new Error("Failed to update budget");

            // Refetch updated data from backend
            await fetchBudget();
        } catch (error) {
            console.error("Error updating budget:", error);
        }
    };

    // DELETE current budget session
    const deleteBudget = async () => {
        try {
            const response = await fetch("http://localhost:5000/api/budget", {
                method: "DELETE",
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });

            if (!response.ok) throw new Error("Failed to delete budget");

            setBudget(null);
        } catch (error) {
            console.error("Error deleting budget:", error);
        }
    };

    useEffect(() => {
        fetchBudget();
    }, []);

    return (
        <BudgetContext.Provider value={{
            budget,
            updateBudget,
            deleteBudget,
            loading,
            unallocatedIncome: Number(unallocatedIncome) || 0,
            setUnallocatedIncome
        }}>
            {children}
        </BudgetContext.Provider>
    );
};

export const useBudget = () => useContext(BudgetContext);