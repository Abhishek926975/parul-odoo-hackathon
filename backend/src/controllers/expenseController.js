import { query } from "../db/connection.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ensureTripAccess } from "../utils/dbHelpers.js";

const expenseSummary = (rows) => {
  const byCategoryMap = new Map();
  const byDayMap = new Map();
  const total = rows.reduce((sum, expense) => {
    const amount = Number(expense.amount || 0) * Number(expense.qty || 1);
    byCategoryMap.set(expense.category, (byCategoryMap.get(expense.category) || 0) + amount);
    byDayMap.set(expense.expense_date, (byDayMap.get(expense.expense_date) || 0) + amount);
    return sum + amount;
  }, 0);

  return {
    total,
    by_category: [...byCategoryMap.entries()].map(([category, categoryTotal]) => ({
      category,
      total: categoryTotal,
    })),
    by_day: [...byDayMap.entries()].map(([date, dayTotal]) => ({ date, total: dayTotal })),
    daily_avg: byDayMap.size ? total / byDayMap.size : 0,
  };
};

export const listExpenses = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query(
    "SELECT * FROM expenses WHERE trip_id = $1 ORDER BY expense_date DESC, created_at DESC",
    [request.params.tripId],
  );

  response.json({ success: true, data: { expenses: result.rows, summary: expenseSummary(result.rows) } });
});

export const createExpense = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const expenseDate = request.body.expense_date || request.body.expenseDate;
  const stopId = request.body.stop_id || request.body.stopId || null;
  const { category = "other", description, amount, currency = "USD", qty = 1 } = request.body;

  if (!description || !amount || !expenseDate) {
    throw new ApiError(400, "description, amount, and expense_date are required");
  }

  const result = await query(
    `INSERT INTO expenses (trip_id, stop_id, category, description, amount, currency, qty, expense_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [request.params.tripId, stopId, category, description, amount, currency, qty, expenseDate],
  );

  response.status(201).json({ success: true, data: { expense: result.rows[0] } });
});

export const updateExpense = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const fieldMap = [
    ["stop_id", request.body.stop_id || request.body.stopId],
    ["category", request.body.category],
    ["description", request.body.description],
    ["amount", request.body.amount],
    ["currency", request.body.currency],
    ["qty", request.body.qty],
    ["expense_date", request.body.expense_date || request.body.expenseDate],
  ].filter(([, value]) => value !== undefined);

  if (!fieldMap.length) throw new ApiError(400, "At least one field is required");

  const values = fieldMap.map(([, value]) => value);
  values.push(request.params.expId, request.params.tripId);
  const setClause = fieldMap.map(([field], index) => `${field} = $${index + 1}`).join(", ");

  const result = await query(
    `UPDATE expenses SET ${setClause}
     WHERE id = $${values.length - 1} AND trip_id = $${values.length}
     RETURNING *`,
    values,
  );
  if (!result.rows[0]) throw new ApiError(404, "Expense not found");

  response.json({ success: true, data: { expense: result.rows[0] } });
});

export const deleteExpense = asyncHandler(async (request, response) => {
  await ensureTripAccess(request.params.tripId, request.user.id);
  const result = await query("DELETE FROM expenses WHERE id = $1 AND trip_id = $2 RETURNING id", [
    request.params.expId,
    request.params.tripId,
  ]);
  if (!result.rows[0]) throw new ApiError(404, "Expense not found");

  response.json({ success: true, data: { message: "Expense deleted" } });
});
